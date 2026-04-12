/**
 * Transak Webhook Handler
 * 
 * Receives webhook notifications from Transak when card payments complete.
 * Flow:
 *   1. Transak processes card payment → delivers XRP to platform wallet
 *   2. Transak sends webhook with order status
 *   3. We swap XRP → RLUSD via XRPL DEX
 *   4. RLUSD sent to merchant (minus 1% fee)
 * 
 * @see https://docs.transak.com/docs/webhooks
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { db } from '../lib/db';
import { xrplDexService } from '../services/xrpl-dex.service';

// =============================================================================
// TYPES
// =============================================================================

interface TransakWebhookPayload {
  id: string;                    // Transak order ID
  walletAddress: string;         // Destination wallet (our platform wallet)
  cryptoAmount: number;          // Amount of XRP delivered
  cryptoCurrency: string;        // Should be "XRP"
  fiatCurrency: string;          // e.g., "USD"
  fiatAmount: number;            // Original fiat amount
  status: TransakStatus;
  partnerOrderId?: string;       // Our NETTEN payment/paylink ID
  transactionHash?: string;      // XRPL transaction hash
  network?: string;              // Should be "xrpl" or "ripple"
  isBuyOrSell: string;           // Should be "BUY"
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

type TransakStatus = 
  | 'AWAITING_PAYMENT_FROM_USER'
  | 'PAYMENT_DONE_MARKED_BY_USER'
  | 'PROCESSING'
  | 'PENDING_DELIVERY_FROM_TRANSAK'
  | 'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'EXPIRED';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Verifies the Transak webhook signature using HMAC-SHA256.
 */
function verifyTransakSignature(payload: string, signature: string): boolean {
  const secret = process.env.TRANSAK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[transak] TRANSAK_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Finds a payment record by Transak's partnerOrderId.
 * This could be a PaymentLink ID or a Transaction ID.
 */
async function findPaymentByPartnerOrderId(partnerOrderId: string) {
  // First try to find a PaymentLink
  const paymentLink = await db.paymentLink.findUnique({
    where: { id: partnerOrderId },
    include: { 
      merchant: {
        select: {
          id: true,
          email: true,
          businessName: true,
          xrplAddress: true,
        }
      }
    },
  });

  if (paymentLink) {
    return {
      type: 'paymentLink' as const,
      record: paymentLink,
      merchantId: paymentLink.merchantId,
      merchantWallet: paymentLink.merchant.xrplAddress,
    };
  }

  // Otherwise try to find a Transaction
  const transaction = await db.transaction.findUnique({
    where: { id: partnerOrderId },
    include: {
      merchant: {
        select: {
          id: true,
          email: true,
          businessName: true,
          xrplAddress: true,
        }
      }
    },
  });

  if (transaction) {
    return {
      type: 'transaction' as const,
      record: transaction,
      merchantId: transaction.merchantId,
      merchantWallet: transaction.merchant.xrplAddress,
    };
  }

  return null;
}

/**
 * Updates the payment/transaction status after successful swap.
 */
async function updatePaymentStatus(
  partnerOrderId: string,
  type: 'paymentLink' | 'transaction',
  data: {
    transakOrderId: string;
    xrpAmount: number;
    rlusdAmount: string;
    merchantAmount: string;
    feeAmount: string;
    xrpTxHash?: string;
    rlusdTxHash: string;
  }
) {
  if (type === 'transaction') {
    await db.transaction.update({
      where: { id: partnerOrderId },
      data: {
        status: 'COMPLETED',
        xrplTxHash: data.rlusdTxHash,
        netAmount: parseFloat(data.merchantAmount),
        platformFeeAmount: parseFloat(data.feeAmount),
        source: 'TRANSAK',
        updatedAt: new Date(),
      },
    });
  } else {
    // For PaymentLinks, increment use count
    await db.paymentLink.update({
      where: { id: partnerOrderId },
      data: {
        useCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Create a transaction record for this payment
    const paymentLink = await db.paymentLink.findUnique({
      where: { id: partnerOrderId },
    });

    if (paymentLink) {
      await db.transaction.create({
        data: {
          merchantId: paymentLink.merchantId,
          fromCoin: 'USD',
          fromAmount: data.xrpAmount, // We'll get better tracking later
          toAmount: parseFloat(data.rlusdAmount),
          netAmount: parseFloat(data.merchantAmount),
          platformFeeAmount: parseFloat(data.feeAmount),
          status: 'COMPLETED',
          xrplTxHash: data.rlusdTxHash,
          source: 'TRANSAK',
          paymentLinkId: partnerOrderId,
          description: `Transak card payment via PayLink ${paymentLink.slug}`,
        },
      });
    }
  }
}

/**
 * Records a failed/cancelled payment for tracking.
 */
async function recordFailedPayment(
  partnerOrderId: string | undefined,
  transakOrderId: string,
  status: TransakStatus,
  reason?: string
) {
  if (!partnerOrderId) return;

  // Try to find and update the transaction
  const transaction = await db.transaction.findUnique({
    where: { id: partnerOrderId },
  });

  if (transaction) {
    await db.transaction.update({
      where: { id: partnerOrderId },
      data: {
        status: status === 'CANCELLED' ? 'CANCELLED' : 'FAILED',
        description: `Transak ${status}: ${reason || 'No reason provided'}`,
        updatedAt: new Date(),
      },
    });
  }
}

// =============================================================================
// WEBHOOK ROUTES
// =============================================================================

export async function transakWebhookRoutes(app: FastifyInstance) {
  
  /**
   * Main Transak webhook endpoint.
   * POST /webhooks/transak
   */
  app.post('/webhooks/transak', {
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    // Get signature from headers
    const signature = request.headers['x-transak-signature'] as string;
    
    if (!signature) {
      console.warn('[transak] Missing webhook signature');
      return reply.status(401).send({ error: 'Missing signature' });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(request.body);
    
    // Verify signature
    if (!verifyTransakSignature(rawBody, signature)) {
      console.warn('[transak] Invalid webhook signature');
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    const payload = request.body as TransakWebhookPayload;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[transak] Webhook received — Order: ${payload.id}`);
    console.log(`[transak] Status: ${payload.status}`);
    console.log(`[transak] Crypto: ${payload.cryptoAmount} ${payload.cryptoCurrency}`);
    console.log(`[transak] Fiat: ${payload.fiatAmount} ${payload.fiatCurrency}`);
    console.log(`[transak] Partner Order ID: ${payload.partnerOrderId || 'N/A'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Handle different statuses
    switch (payload.status) {
      case 'COMPLETED':
        return handleCompletedOrder(payload, reply);
      
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
      case 'EXPIRED':
        await recordFailedPayment(
          payload.partnerOrderId,
          payload.id,
          payload.status,
          payload.statusReason
        );
        console.log(`[transak] Order ${payload.id} marked as ${payload.status}`);
        return reply.send({ received: true, status: payload.status });
      
      case 'PROCESSING':
      case 'PENDING_DELIVERY_FROM_TRANSAK':
      case 'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK':
        console.log(`[transak] Order ${payload.id} is ${payload.status} — waiting...`);
        return reply.send({ received: true, status: payload.status });
      
      default:
        console.log(`[transak] Order ${payload.id} status: ${payload.status}`);
        return reply.send({ received: true, status: payload.status });
    }
  });

  /**
   * Health check endpoint for Transak webhook.
   */
  app.get('/webhooks/transak/health', async (request, reply) => {
    return reply.send({ 
      status: 'healthy',
      service: 'transak-webhook',
      timestamp: new Date().toISOString(),
    });
  });
}

// =============================================================================
// HANDLER FOR COMPLETED ORDERS
// =============================================================================

async function handleCompletedOrder(
  payload: TransakWebhookPayload,
  reply: FastifyReply
) {
  const { id: transakOrderId, partnerOrderId, cryptoAmount, transactionHash } = payload;

  // Validate required fields
  if (!partnerOrderId) {
    console.error(`[transak] No partnerOrderId in completed order ${transakOrderId}`);
    return reply.status(400).send({ error: 'Missing partnerOrderId' });
  }

  if (payload.cryptoCurrency !== 'XRP') {
    console.error(`[transak] Unexpected crypto ${payload.cryptoCurrency} — expected XRP`);
    return reply.status(400).send({ error: 'Only XRP payments supported' });
  }

  try {
    // 1. Find the NETTEN payment record
    const payment = await findPaymentByPartnerOrderId(partnerOrderId);

    if (!payment) {
      console.error(`[transak] Payment not found: ${partnerOrderId}`);
      return reply.status(404).send({ error: 'Payment not found' });
    }

    if (!payment.merchantWallet) {
      console.error(`[transak] Merchant ${payment.merchantId} has no wallet configured`);
      return reply.status(400).send({ error: 'Merchant wallet not configured' });
    }

    console.log(`[transak] Found ${payment.type}: ${partnerOrderId}`);
    console.log(`[transak] Merchant wallet: ${payment.merchantWallet}`);

    // 2. Connect to XRPL and process the swap
    await xrplDexService.connect();

    // 3. Swap XRP → RLUSD and distribute to merchant
    const xrpAmount = cryptoAmount.toString();
    const result = await xrplDexService.processIncomingXrp(
      xrpAmount,
      payment.merchantWallet,
      partnerOrderId
    );

    if (!result.success) {
      console.error(`[transak] Swap failed for order ${transakOrderId}:`, result.error);
      return reply.status(500).send({ 
        error: 'Swap failed', 
        details: result.error 
      });
    }

    // 4. Update payment status in database
    await updatePaymentStatus(partnerOrderId, payment.type, {
      transakOrderId,
      xrpAmount: cryptoAmount,
      rlusdAmount: result.rlusdAmount,
      merchantAmount: result.merchantAmount,
      feeAmount: result.feeAmount,
      xrpTxHash: transactionHash,
      rlusdTxHash: result.txHash!,
    });

    // 5. Trigger Net Ten Effect (increment counter)
    // This is handled by the existing XRPL listener, but we can also trigger here
    const { incrementNetTen } = await import('../xrpl/handlers/netTen');
    await incrementNetTen(payment.merchantId);

    console.log(`\n✅ [transak] Order ${transakOrderId} fully processed!`);
    console.log(`   Merchant received: ${result.merchantAmount} RLUSD`);
    console.log(`   NETTEN fee: ${result.feeAmount} RLUSD`);
    console.log(`   TX Hash: ${result.txHash}\n`);

    return reply.send({
      success: true,
      transakOrderId,
      partnerOrderId,
      merchantAmount: result.merchantAmount,
      feeAmount: result.feeAmount,
      txHash: result.txHash,
    });

  } catch (error) {
    console.error(`[transak] Error processing order ${transakOrderId}:`, error);
    return reply.status(500).send({ 
      error: 'Processing failed',
      details: (error as Error).message,
    });
  } finally {
    // Don't disconnect — we may have other pending operations
    // await xrplDexService.disconnect();
  }
}
