// server/src/services/xrpl.ts
import { Client, Wallet, Payment, convertStringToHex } from 'xrpl'

const RLUSD_ISSUER = process.env.RLUSD_ISSUER_ADDRESS || 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const RLUSD_CURRENCY = 'USD'

class XRPLService {
  private client: Client
  private wallet: Wallet | null = null

  constructor() {
    this.client = new Client(process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233')
  }

  async connect() {
    await this.client.connect()
    if (process.env.XRPL_PLATFORM_WALLET_SEED) {
      this.wallet = Wallet.fromSeed(process.env.XRPL_PLATFORM_WALLET_SEED)
    }
  }

  async sendRLUSD(params: { destination: string; amount: number; memo?: string }) {
    if (!this.client.isConnected()) await this.connect()
    if (!this.wallet) throw new Error('Platform wallet not configured')

    const payment: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Destination: params.destination,
      Amount: {
        currency: RLUSD_CURRENCY,
        value: params.amount.toFixed(6),
        issuer: RLUSD_ISSUER,
      },
      Memos: params.memo ? [{
        Memo: { MemoData: convertStringToHex(params.memo) }
      }] : undefined,
    }

    const result = await this.client.submitAndWait(payment, { wallet: this.wallet })
    return result
  }

  async monitorAddress(address: string, onPayment: (tx: any) => void) {
    await this.client.request({
      command: 'subscribe',
      accounts: [address],
    })
    this.client.on('transaction', (tx) => {
      if (tx.transaction.Destination === address) {
        onPayment(tx)
      }
    })
  }

  isConnected() { return this.client.isConnected() }
}

export const xrplService = new XRPLService()
