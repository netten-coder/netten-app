import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VELOCITY_CONFIG = {
  MIN_TRANSACTION_AMOUNT_USD: 1.00,
  MAX_TRANSACTIONS_PER_HOUR: 50,
  MIN_TRANSACTION_INTERVAL_SECONDS: 10,
  MAX_SAME_PAYER_PER_DAY: 10,
  SAME_AMOUNT_THRESHOLD: 5,
}

interface VelocityCheckResult {
  allowed: boolean
  reason?: string
  suspicious?: boolean
}

interface TransactionContext {
  merchantId: string
  amountUsd: number
  payerWalletAddress?: string
}

export async function checkTransactionVelocity(ctx: TransactionContext): Promise<VelocityCheckResult> {
  const { merchantId, amountUsd } = ctx
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  if (amountUsd < VELOCITY_CONFIG.MIN_TRANSACTION_AMOUNT_USD) {
    return { allowed: true, reason: 'BELOW_MINIMUM', suspicious: false }
  }

  const hourlyCount = await prisma.transaction.count({
    where: { merchantId, createdAt: { gte: oneHourAgo }, status: 'COMPLETED' }
  })

  if (hourlyCount >= VELOCITY_CONFIG.MAX_TRANSACTIONS_PER_HOUR) {
    return { allowed: false, reason: 'HOURLY_LIMIT_EXCEEDED', suspicious: true }
  }

  const lastTransaction = await prisma.transaction.findFirst({
    where: { merchantId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' }
  })

  if (lastTransaction) {
    const secondsSinceLastTx = (now.getTime() - lastTransaction.createdAt.getTime()) / 1000
    if (secondsSinceLastTx < VELOCITY_CONFIG.MIN_TRANSACTION_INTERVAL_SECONDS) {
      return { allowed: false, reason: 'TOO_FAST', suspicious: true }
    }
  }

  return { allowed: true, suspicious: false }
}

export function shouldCountForNetTen(velocityResult: VelocityCheckResult, amountUsd: number): boolean {
  if (amountUsd < VELOCITY_CONFIG.MIN_TRANSACTION_AMOUNT_USD) return false
  if (velocityResult.suspicious) return false
  if (!velocityResult.allowed) return false
  return true
}

export default { checkTransactionVelocity, shouldCountForNetTen, VELOCITY_CONFIG }
