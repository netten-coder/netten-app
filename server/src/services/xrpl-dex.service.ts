/**
 * XRPL DEX Service
 * 
 * Handles automated XRP → RLUSD swaps on the XRPL DEX.
 * Used by both Transak (card payments) and ChangeNOW (crypto conversions).
 * 
 * Flow:
 * 1. XRP arrives at platform wallet (from Transak or ChangeNOW)
 * 2. WebSocket listener detects payment
 * 3. Auto-swap XRP → RLUSD via OfferCreate
 * 4. Send RLUSD to merchant wallet (minus 1% fee)
 * 5. Send 1% fee to fee collection wallet
 */

import xrpl, { 
  Client, 
  Wallet, 
  Payment, 
  TrustSet, 
  OfferCreate,
  TransactionMetadata,
  
  xrpToDrops
} from 'xrpl';

// =============================================================================
// CONFIGURATION
// =============================================================================

const XRPL_WSS = process.env.XRPL_WSS || 'wss://xrplcluster.com';

// RLUSD on XRPL
const RLUSD_CURRENCY = '524C555344000000000000000000000000000000'; // Hex for "RLUSD"
const RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';

// Your platform wallet (receives XRP, swaps, sends RLUSD)
const XRPL_PLATFORM_WALLET_ADDRESS = process.env.XRPL_PLATFORM_WALLET_ADDRESS!;
const XRPL_PLATFORM_WALLET_SECRET = process.env.XRPL_PLATFORM_WALLET_SECRET!;

// Fee collection wallet (receives 1% in RLUSD)
const FEE_WALLET_ADDRESS = process.env.FEE_WALLET_ADDRESS!;

// NETTEN fee percentage
const NETTEN_FEE_PERCENT = 0.01; // 1%

// Slippage tolerance for DEX swaps (2% = 0.02)
const SLIPPAGE_TOLERANCE = 0.02;

// =============================================================================
// TYPES
// =============================================================================

interface SwapResult {
  success: boolean;
  xrpAmount: string;
  rlusdAmount: string;
  merchantAmount: string;
  feeAmount: string;
  txHash?: string;
  error?: string;
}

interface PayLinkData {
  id: string;
  merchantWalletAddress: string;
  expectedAmount: number; // in USD
}

// =============================================================================
// XRPL DEX SERVICE CLASS
// =============================================================================

export class XrplDexService {
  private client: Client;
  private wallet: Wallet;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client(XRPL_WSS);
    this.wallet = Wallet.fromSecret(XRPL_PLATFORM_WALLET_SECRET);
  }

  // ---------------------------------------------------------------------------
  // CONNECTION MANAGEMENT
  // ---------------------------------------------------------------------------

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Connected to XRPL');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('🔌 Disconnected from XRPL');
    }
  }

  // ---------------------------------------------------------------------------
  // ONE-TIME SETUP: TRUSTLINE FOR RLUSD
  // ---------------------------------------------------------------------------

  /**
   * Sets up trustline for RLUSD on the platform wallet.
   * Only needs to be run ONCE ever.
   */
  async setupRlusdTrustline(): Promise<string> {
    await this.connect();

    // Check if trustline already exists
    const accountLines = await this.client.request({
      command: 'account_lines',
      account: XRPL_PLATFORM_WALLET_ADDRESS,
      peer: RLUSD_ISSUER,
    });

    const existingTrustline = accountLines.result.lines.find(
      (line: any) => line.currency === RLUSD_CURRENCY || line.currency === 'RLUSD'
    );

    if (existingTrustline) {
      console.log('✅ RLUSD trustline already exists');
      return 'TRUSTLINE_EXISTS';
    }

    // Create trustline
    const trustSet: TrustSet = {
      TransactionType: 'TrustSet',
      Account: XRPL_PLATFORM_WALLET_ADDRESS,
      LimitAmount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: '1000000000', // 1 billion limit (effectively unlimited)
      },
    };

    const prepared = await this.client.autofill(trustSet);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    const txResult = (result.result.meta as TransactionMetadata)?.TransactionResult;
    
    if (txResult === 'tesSUCCESS') {
      console.log('✅ RLUSD trustline created:', result.result.hash);
      return result.result.hash!;
    } else {
      throw new Error(`Trustline failed: ${txResult}`);
    }
  }

  // ---------------------------------------------------------------------------
  // GET CURRENT XRP/RLUSD PRICE FROM DEX
  // ---------------------------------------------------------------------------

  /**
   * Gets the current XRP → RLUSD exchange rate from the DEX order book.
   * Returns how much RLUSD you get for 1 XRP.
   */
  async getXrpToRlusdRate(): Promise<number> {
    await this.connect();

    const orderBook = await this.client.request({
      command: 'book_offers',
      taker_gets: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
      },
      taker_pays: {
        currency: 'XRP',
      },
      limit: 10,
    });

    if (!orderBook.result.offers || orderBook.result.offers.length === 0) {
      throw new Error('No liquidity on XRP/RLUSD DEX');
    }

    // Best offer rate
    const bestOffer = orderBook.result.offers[0];
    const rlusdAmount = parseFloat(
      typeof bestOffer.TakerGets === 'object' 
        ? bestOffer.TakerGets.value 
        : '0'
    );
    const dropsVal = typeof bestOffer.TakerPays === 'string' ? parseFloat(bestOffer.TakerPays) : 0; const xrpAmount = dropsVal / 1000000;
    
    const rate = rlusdAmount / xrpAmount;
    console.log(`📊 Current rate: 1 XRP = ${rate.toFixed(4)} RLUSD`);
    
    return rate;
  }

  // ---------------------------------------------------------------------------
  // SWAP XRP → RLUSD
  // ---------------------------------------------------------------------------

  /**
   * Swaps XRP for RLUSD on the XRPL DEX using OfferCreate.
   * Uses tfImmediateOrCancel flag to execute immediately or fail.
   */
  async swapXrpToRlusd(xrpAmount: string): Promise<{ rlusdReceived: string; txHash: string }> {
    await this.connect();

    // Get current rate and calculate expected RLUSD
    const rate = await this.getXrpToRlusdRate();
    const xrpNum = parseFloat(xrpAmount);
    const expectedRlusd = xrpNum * rate;
    
    // Apply slippage tolerance (minimum acceptable RLUSD)
    const minRlusd = expectedRlusd * (1 - SLIPPAGE_TOLERANCE);

    console.log(`🔄 Swapping ${xrpAmount} XRP for ~${expectedRlusd.toFixed(2)} RLUSD (min: ${minRlusd.toFixed(2)})`);

    // Create OfferCreate transaction
    const offer: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: XRPL_PLATFORM_WALLET_ADDRESS,
      // We're paying XRP
      TakerPays: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: minRlusd.toFixed(6),
      },
      // We're getting RLUSD
      TakerGets: xrpToDrops(xrpAmount),
      // tfImmediateOrCancel: Execute immediately or cancel
      // tfSell: Sell all XRP even if we get more RLUSD than requested
      Flags: 0x00020000 | 0x00080000, // tfImmediateOrCancel | tfSell
    };

    const prepared = await this.client.autofill(offer);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    const meta = result.result.meta as TransactionMetadata;
    const txResult = meta?.TransactionResult;

    if (txResult !== 'tesSUCCESS') {
      throw new Error(`Swap failed: ${txResult}`);
    }

    // Calculate actual RLUSD received from metadata
    const rlusdReceived = this.extractRlusdFromMeta(meta);
    
    console.log(`✅ Swap complete: ${xrpAmount} XRP → ${rlusdReceived} RLUSD`);
    console.log(`   TX: ${result.result.hash}`);

    return {
      rlusdReceived,
      txHash: result.result.hash!,
    };
  }

  /**
   * Extracts the actual RLUSD received from transaction metadata.
   */
  private extractRlusdFromMeta(meta: TransactionMetadata): string {
    // Look for RLUSD balance changes in AffectedNodes
    let rlusdReceived = '0';
    
    if (meta.AffectedNodes) {
      for (const node of meta.AffectedNodes) {
        const modified = (node as any).ModifiedNode || (node as any).CreatedNode;
        if (modified?.LedgerEntryType === 'RippleState') {
          const finalFields = modified.FinalFields || modified.NewFields;
          const prevFields = modified.PreviousFields;
          
          if (finalFields?.Balance?.currency === RLUSD_CURRENCY) {
            const finalBalance = parseFloat(finalFields.Balance.value);
            const prevBalance = prevFields?.Balance ? parseFloat(prevFields.Balance.value) : 0;
            const change = Math.abs(finalBalance - prevBalance);
            
            if (change > 0) {
              rlusdReceived = change.toFixed(6);
            }
          }
        }
      }
    }

    // Fallback: use delivered_amount if available
    if (rlusdReceived === '0' && meta.delivered_amount) {
      const delivered = meta.delivered_amount;
      if (typeof delivered === 'object' && delivered.currency === RLUSD_CURRENCY) {
        rlusdReceived = delivered.value;
      }
    }

    return rlusdReceived;
  }

  // ---------------------------------------------------------------------------
  // SEND RLUSD TO MERCHANT
  // ---------------------------------------------------------------------------

  /**
   * Sends RLUSD to the merchant wallet after deducting 1% fee.
   */
  async sendRlusdToMerchant(
    totalRlusd: string,
    merchantWallet: string,
    destinationTag?: number
  ): Promise<{ merchantTxHash: string; feeTxHash: string; merchantAmount: string; feeAmount: string }> {
    await this.connect();

    const total = parseFloat(totalRlusd);
    const feeAmount = total * NETTEN_FEE_PERCENT;
    const merchantAmount = total - feeAmount;

    console.log(`💸 Distributing ${totalRlusd} RLUSD:`);
    console.log(`   Merchant: ${merchantAmount.toFixed(6)} RLUSD → ${merchantWallet}`);
    console.log(`   Fee:      ${feeAmount.toFixed(6)} RLUSD → ${FEE_WALLET_ADDRESS}`);

    // Send to merchant
    const merchantPayment: Payment = {
      TransactionType: 'Payment',
      Account: XRPL_PLATFORM_WALLET_ADDRESS,
      Destination: merchantWallet,
      Amount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: merchantAmount.toFixed(6),
      },
      ...(destinationTag && { DestinationTag: destinationTag }),
    };

    const merchantPrepared = await this.client.autofill(merchantPayment);
    const merchantSigned = this.wallet.sign(merchantPrepared);
    const merchantResult = await this.client.submitAndWait(merchantSigned.tx_blob);

    const merchantTxResult = (merchantResult.result.meta as TransactionMetadata)?.TransactionResult;
    if (merchantTxResult !== 'tesSUCCESS') {
      throw new Error(`Merchant payment failed: ${merchantTxResult}`);
    }

    console.log(`✅ Merchant payment: ${merchantResult.result.hash}`);

    // Send fee to fee wallet
    const feePayment: Payment = {
      TransactionType: 'Payment',
      Account: XRPL_PLATFORM_WALLET_ADDRESS,
      Destination: FEE_WALLET_ADDRESS,
      Amount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: feeAmount.toFixed(6),
      },
    };

    const feePrepared = await this.client.autofill(feePayment);
    const feeSigned = this.wallet.sign(feePrepared);
    const feeResult = await this.client.submitAndWait(feeSigned.tx_blob);

    const feeTxResult = (feeResult.result.meta as TransactionMetadata)?.TransactionResult;
    if (feeTxResult !== 'tesSUCCESS') {
      throw new Error(`Fee payment failed: ${feeTxResult}`);
    }

    console.log(`✅ Fee payment: ${feeResult.result.hash}`);

    return {
      merchantTxHash: merchantResult.result.hash!,
      feeTxHash: feeResult.result.hash!,
      merchantAmount: merchantAmount.toFixed(6),
      feeAmount: feeAmount.toFixed(6),
    };
  }

  // ---------------------------------------------------------------------------
  // FULL FLOW: XRP → RLUSD → MERCHANT
  // ---------------------------------------------------------------------------

  /**
   * Complete flow: receives XRP, swaps to RLUSD, distributes to merchant.
   * Called when Transak or ChangeNOW delivers XRP to platform wallet.
   */
  async processIncomingXrp(
    xrpAmount: string,
    merchantWallet: string,
    payLinkId: string,
    destinationTag?: number
  ): Promise<SwapResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Processing incoming XRP payment`);
    console.log(`   Pay Link: ${payLinkId}`);
    console.log(`   XRP Amount: ${xrpAmount}`);
    console.log(`   Merchant: ${merchantWallet}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Step 1: Swap XRP → RLUSD
      const { rlusdReceived, txHash: swapTxHash } = await this.swapXrpToRlusd(xrpAmount);

      // Step 2: Send RLUSD to merchant (minus fee)
      const { 
        merchantTxHash, 
        feeTxHash, 
        merchantAmount, 
        feeAmount 
      } = await this.sendRlusdToMerchant(rlusdReceived, merchantWallet, destinationTag);

      console.log(`\n✅ Payment complete for pay link: ${payLinkId}`);
      console.log(`   Merchant received: ${merchantAmount} RLUSD`);
      console.log(`   NETTEN fee: ${feeAmount} RLUSD\n`);

      return {
        success: true,
        xrpAmount,
        rlusdAmount: rlusdReceived,
        merchantAmount,
        feeAmount,
        txHash: merchantTxHash,
      };

    } catch (error) {
      console.error(`❌ Payment processing failed:`, error);
      return {
        success: false,
        xrpAmount,
        rlusdAmount: '0',
        merchantAmount: '0',
        feeAmount: '0',
        error: (error as Error).message,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // WEBSOCKET LISTENER FOR INCOMING XRP
  // ---------------------------------------------------------------------------

  /**
   * Starts listening for incoming XRP payments to the platform wallet.
   * Call this on server startup.
   */
  async startPaymentListener(
    onPayment: (xrpAmount: string, txHash: string, destinationTag?: number) => Promise<void>
  ): Promise<void> {
    await this.connect();

    // Subscribe to platform wallet transactions
    await this.client.request({
      command: 'subscribe',
      accounts: [XRPL_PLATFORM_WALLET_ADDRESS],
    });

    console.log(`👂 Listening for payments to ${XRPL_PLATFORM_WALLET_ADDRESS}`);

    this.client.on('transaction', async (tx) => {
      const transaction = tx.transaction;
      
      // Only process incoming XRP payments
      if (
        transaction.TransactionType === 'Payment' &&
        transaction.Destination === XRPL_PLATFORM_WALLET_ADDRESS &&
        typeof transaction.Amount === 'string' // XRP is a string in drops
      ) {
        const xrpAmount = String(parseFloat(transaction.Amount) / 1000000);
        const txHash = transaction.hash;
        const destinationTag = transaction.DestinationTag;

        console.log(`\n💰 Incoming XRP detected!`);
        console.log(`   Amount: ${xrpAmount} XRP`);
        console.log(`   TX: ${txHash}`);
        console.log(`   Destination Tag: ${destinationTag || 'none'}`);

        await onPayment(xrpAmount, txHash!, destinationTag);
      }
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const xrplDexService = new XrplDexService();

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
// In your webhook handler (e.g., transak.webhook.ts or changenow.webhook.ts):

import { xrplDexService } from './xrpl-dex.service';
import { prisma } from '../lib/prisma';

// When Transak/ChangeNOW confirms XRP delivery:
async function handleXrpArrival(payLinkId: string, xrpAmount: string) {
  // Get pay link details from database
  const payLink = await prisma.payLink.findUnique({
    where: { id: payLinkId },
    include: { merchant: true },
  });

  if (!payLink) {
    console.error('Pay link not found:', payLinkId);
    return;
  }

  // Process the swap and distribution
  const result = await xrplDexService.processIncomingXrp(
    xrpAmount,
    payLink.merchant.walletAddress,
    payLinkId,
    payLink.destinationTag // if you use destination tags
  );

  if (result.success) {
    // Update pay link status
    await prisma.payLink.update({
      where: { id: payLinkId },
      data: {
        status: 'PAID',
        paidAmount: result.merchantAmount,
        feeAmount: result.feeAmount,
        txHash: result.txHash,
        paidAt: new Date(),
      },
    });
  }
}

// On server startup, start the WebSocket listener:
xrplDexService.startPaymentListener(async (xrpAmount, txHash, destinationTag) => {
  // Look up pay link by destination tag or pending payments
  // Then call handleXrpArrival
});

// One-time setup (run once):
// await xrplDexService.setupRlusdTrustline();
*/
