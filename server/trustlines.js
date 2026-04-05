const xrpl = require('xrpl')

const RLUSD_ISSUER   = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'
const RLUSD_CURRENCY = '524C555344000000000000000000000000000000'

const WALLETS = [
  { name: 'Platform/Rewards', seed: 'sEdTAnMnu6zZMwHHegu8wxbg3MRSgnq' },
  { name: 'Fee Collection',   seed: 'sEdVCgpdSsK5BPpXU5R8wDjwhNZpfWT' },
  { name: 'Subscription',     seed: 'sEdS1SN4U4mhWnzVjbhWvfmVBA39YUT' },
]

async function setTrustLines() {
  const client = new xrpl.Client('wss://xrplcluster.com')
  await client.connect()
  console.log('Connected to XRPL mainnet')

  for (const w of WALLETS) {
    const wallet = xrpl.Wallet.fromSeed(w.seed)
    console.log(`\n[${w.name}] Setting RLUSD trust line...`)
    console.log(`  Address: ${wallet.address}`)

    const tx = {
      TransactionType: 'TrustSet',
      Account: wallet.address,
      LimitAmount: {
        currency: RLUSD_CURRENCY,
        issuer:   RLUSD_ISSUER,
        value:    '1000000000',
      },
    }

    const result = await client.submitAndWait(tx, { wallet })
    const status = result.result.meta.TransactionResult

    if (status === 'tesSUCCESS') {
      console.log(`  Trust line SET — ${status}`)
    } else {
      console.log(`  FAILED — ${status}`)
    }
  }

  await client.disconnect()
  console.log('\nAll trust lines complete!')
}

setTrustLines().catch(console.error)
