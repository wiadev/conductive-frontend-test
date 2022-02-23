const MIN = 100

const NAMES = {
  MINT_BASE: 'POOL',
  MINT_OWNER: 'MintOwner',
  POLKA_STARTER: 'Polkastarter',
  PANCAKE_SWAP: 'PankcakeSwap',
  SECOND_WALLET: 'SecondWallet',
  THRID_WALLET: 'ThirdWallet',
  HODL: 'HODL'
}

const NODES = [
  {
    name: NAMES.POLKA_STARTER,
    id: 'POLKA_STARTER',
    color: '#0000FF',
    order: 1
  },
  {
    name: NAMES.PANCAKE_SWAP,
    id: 'PANCAKE_SWAP',
    color: '#FF0000',
    order: 2
  },
  {
    name: NAMES.SECOND_WALLET,
    id: 'SECOND_WALLET',
    color: '#FFFF00',
    order: 3
  },
  { name: NAMES.HODL, id: 'HODL', color: '#00FF00', order: 4 },
  {
    name: NAMES.THRID_WALLET,
    id: 'THRID_WALLET',
    color: '#FF00FF',
    order: 5
  }
]

const ADDRESS = {
  MINT_BASE: '0x0000000000000000000000000000000000000000',
  MIN_OWNER: '0x72571d815dd31fbde52be0b9d7ffc8344aede616',
  POLKA_STARTER: '0xee62650fa45ac0deb1b24ec19f983a8f85b727ab',
  PANCAKE_SWAP: '0xd6d206f59cc5a3bfa4cc10bc8ba140ac37ad1c89'
}

const toFloat = (q) => parseFloat(q.replace(",",""))
const createEmptyData = () => ({ totalCount: 0, totalAmount: 0 })

export default function convertData(rows) {
  const STOCK = {
    POLKA_STARTER: createEmptyData(),
    SECOND_WALLET: createEmptyData(),
    PANCAKE_SWAP: createEmptyData(),
    THRID_WALLET: createEmptyData(),
    HODL: createEmptyData(),
  }

  const LINKS_DATA = {
    POLKA_STARTER: {
      SECOND_WALLET: createEmptyData(),
      PANCAKE_SWAP: createEmptyData(),
      HODL: createEmptyData()
    },
    SECOND_WALLET: {
      THRID_WALLET: createEmptyData(),
      PANCAKE_SWAP: createEmptyData()
    }
  }

  const getReminaderAmount = (stock, targetObj, amountProp = 'totalAmount') => {
    return Math.abs(
      stock[amountProp] -
        Object.values(targetObj).reduce((ac, item) => {
          return ac + item[amountProp]
        }, 0)
    )
  }

  const addAmount = (target, amount, count = 1) => {
    target.totalAmount += amount
    target.totalCount += count
  }

  const secondWallets = {}
  const secondTierTransactions = []

  rows.forEach((row) => {
    const { From: from, To: to, Quantity: quantity } = row
    const transactionValue = toFloat(quantity)

    if (to === ADDRESS.POLKA_STARTER) {
      addAmount(STOCK.POLKA_STARTER, transactionValue)
      return
    }

    if (ADDRESS.POLKA_STARTER === from) {
      if (to === ADDRESS.PANCAKE_SWAP) {
        addAmount(LINKS_DATA.POLKA_STARTER.PANCAKE_SWAP, transactionValue)
        addAmount(STOCK.PANCAKE_SWAP, transactionValue)
      } else {
        addAmount(STOCK.SECOND_WALLET, transactionValue)
        addAmount(LINKS_DATA.POLKA_STARTER.SECOND_WALLET, transactionValue)
        secondWallets[to] = true
      }
    } else if (to === ADDRESS.PANCAKE_SWAP) {
      secondTierTransactions.push(row)
    }
  })

  secondTierTransactions.forEach((row) => {
    const { From: from, Quantity: quantity } = row
    const transactionValue = toFloat(quantity)

    if (!secondWallets[from]) {
      return
    }
    addAmount(LINKS_DATA.SECOND_WALLET.PANCAKE_SWAP, transactionValue)
    addAmount(STOCK.PANCAKE_SWAP, transactionValue)
  })

  LINKS_DATA.POLKA_STARTER.HODL.totalAmount = STOCK.HODL.totalAmount =
    getReminaderAmount(STOCK.POLKA_STARTER, LINKS_DATA.POLKA_STARTER)
  LINKS_DATA.POLKA_STARTER.HODL.totalCount = STOCK.HODL.totalCount =
    getReminaderAmount(STOCK.POLKA_STARTER, LINKS_DATA.POLKA_STARTER, 'totalCount')
  LINKS_DATA.SECOND_WALLET.THRID_WALLET.totalAmount = STOCK.THRID_WALLET.totalAmount =
    getReminaderAmount(STOCK.SECOND_WALLET, LINKS_DATA.SECOND_WALLET)
  LINKS_DATA.SECOND_WALLET.THRID_WALLET.totalCount = STOCK.THRID_WALLET.totalCount =
    getReminaderAmount(STOCK.SECOND_WALLET, LINKS_DATA.SECOND_WALLET, 'totalCount')

  const links = Object.entries(LINKS_DATA)
    .map(([sourceId, valueObj]) =>
      Object.entries(valueObj)
        .filter(([targetId, value]) => value.totalCount > 0)
        .map(([targetId, value]) => ({
          source: sourceId,
          target: targetId,
          metaValue: value,
          value: Math.max(value.totalCount, MIN)
        }))
    )
    .flatMap((item) => item)

  const nodes = NODES.map((item) => ({
    ...item,
    metaValue: STOCK[item.id],
    value: Math.max(STOCK[item.id].totalAmount, MIN)
  }))

  return {
    links,
    nodes
  }
}
