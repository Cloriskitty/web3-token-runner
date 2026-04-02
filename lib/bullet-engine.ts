export type BulletType = "token" | "scam" | "rare"

export interface Bullet {
  id: number
  x: number
  y: number
  speed: number
  type: BulletType
  label: string
  width: number
  height: number
  rotation: number
}

export interface Player {
  x: number
  y: number
  width: number
  height: number
}

// AABB collision detection
export function checkCollision(player: Player, bullet: Bullet): boolean {
  return (
    player.x < bullet.x + bullet.width &&
    player.x + player.width > bullet.x &&
    player.y < bullet.y + bullet.height &&
    player.y + player.height > bullet.y
  )
}

// Token facts per company
const COMPANY_TOKENS: Record<string, string[]> = {
  coinbase: [
    "100M+ users",
    "Nasdaq listed",
    "First crypto IPO",
    "Mission Rock HQ",
    "Base L2 chain",
    "US regulated",
  ],
  kraken: [
    "Never hacked",
    "Since 2011",
    "Staking pioneer",
    "Futures trading",
    "Bank chartered",
    "Pro interface",
  ],
  "okx-sf": [
    "50M+ users",
    "Web3 wallet",
    "DEX aggregator",
    "100+ countries",
    "Super app",
    "SF office",
  ],
  ripple: [
    "XRP Ledger",
    "RLUSD stablecoin",
    "Cross-border pay",
    "Bank partners",
    "3-5 sec settle",
    "Low fees",
  ],
  alchemy: [
    "AWS of Web3",
    "Node infra",
    "Dev platform",
    "Multi-chain",
    "Supernode API",
    "NFT toolkit",
  ],
  "solana-labs": [
    "65K TPS",
    "Sub-sec finality",
    "Low fees",
    "Proof of History",
    "Mobile Saga",
    "Top 3 chain",
  ],
  "protocol-labs": [
    "IPFS creator",
    "Filecoin",
    "Decentralized storage",
    "Open source",
    "Content addressing",
    "Data layer",
  ],
  "chainlink-labs": [
    "Oracle network",
    "$15T secured",
    "Data feeds",
    "CCIP bridge",
    "VRF random",
    "DeFi backbone",
  ],
  "aptos-labs": [
    "160K TPS",
    "Block-STM",
    "Move language",
    "Ex-Meta team",
    "Parallel exec",
    "Safe by design",
  ],
  "mysten-labs": [
    "Sui blockchain",
    "Object model",
    "Sub-sec finality",
    "Consumer focus",
    "Gaming chain",
    "Ex-Meta team",
  ],
  "a16z-crypto": [
    "$7.6B+ deployed",
    "Backed Coinbase",
    "Backed Uniswap",
    "Backed OpenSea",
    "Crypto fund",
    "Sand Hill Rd",
  ],
  "anchorage-digital": [
    "OCC chartered",
    "Federal bank",
    "Institutional",
    "Crypto custody",
    "Staking service",
    "Regulated",
  ],
  robinhood: [
    "24/7 crypto",
    "Zero commission",
    "Self-custody wallet",
    "Retail gateway",
    "Menlo Park HQ",
    "Gen Z investing",
  ],
  coinlist: [
    "Token launches",
    "Launched SOL",
    "Launched FIL",
    "Compliant sales",
    "Launched ALGO",
    "Early access",
  ],
  forte: [
    "Gaming Web3",
    "NFT economies",
    "Studio tools",
    "Player ownership",
    "In-game items",
    "Low friction",
  ],
  bitgo: [
    "Qualified custody",
    "Multi-sig",
    "Institutional",
    "Prime broker",
    "Settlement",
    "Palo Alto HQ",
  ],
}

// Gold rare bullet labels (universal Web3 wisdom)
const RARE_LABELS = [
  "Not your keys, not your coins",
  "DYOR always",
  "WAGMI",
  "gm gm gm",
  "Satoshi's vision",
  "In code we trust",
  "Decentralize everything",
  "Diamond hands",
]

// Scam/wrong bullet labels
const SCAM_LABELS = [
  "100x guaranteed",
  "Send 1 get 2",
  "Rug pull soon",
  "Free ETH airdrop",
  "Not your keys OK",
  "Trust me bro",
  "No audit needed",
  "FOMO now!",
  "Pump incoming",
  "DM for alpha",
  "Seed phrase share",
  "No risk 100% gain",
  "Click link below",
  "Elon said buy",
  "Fake partnership",
  "Ponzi is fine",
]

let nextId = 0

export function createBullet(
  companySlug: string,
  containerWidth: number,
  difficulty: number
): Bullet {
  const roll = Math.random()
  const isRare = roll < 0.08 // 8% chance for gold rare
  const isToken = !isRare && roll < 0.65 - difficulty * 0.05

  const tokens = COMPANY_TOKENS[companySlug] ?? COMPANY_TOKENS["coinbase"]
  const type: BulletType = isRare ? "rare" : isToken ? "token" : "scam"
  const label = isRare
    ? RARE_LABELS[Math.floor(Math.random() * RARE_LABELS.length)]
    : isToken
      ? tokens[Math.floor(Math.random() * tokens.length)]
      : SCAM_LABELS[Math.floor(Math.random() * SCAM_LABELS.length)]

  const width = Math.max(80, label.length * 9 + 20)
  const maxX = containerWidth - width - 10
  const x = Math.random() * Math.max(maxX, 10) + 5

  return {
    id: nextId++,
    x,
    y: -40,
    speed: isRare ? 2.5 + Math.random() : 1.5 + Math.random() * 1.5 + difficulty * 0.3,
    type,
    label,
    width,
    height: 32,
    rotation: (Math.random() - 0.5) * 10,
  }
}

export function createBossBullet(
  bossSlug: string,
  containerWidth: number,
  wave: number
): Bullet {
  const roll = Math.random()
  const isRare = roll < 0.06
  const isToken = !isRare && roll < 0.5

  const tokens = COMPANY_TOKENS[bossSlug] ?? COMPANY_TOKENS["coinbase"]
  const type: BulletType = isRare ? "rare" : isToken ? "token" : "scam"
  const label = isRare
    ? RARE_LABELS[Math.floor(Math.random() * RARE_LABELS.length)]
    : isToken
      ? tokens[Math.floor(Math.random() * tokens.length)]
      : SCAM_LABELS[Math.floor(Math.random() * SCAM_LABELS.length)]

  const width = Math.max(80, label.length * 9 + 20)
  const maxX = containerWidth - width - 10
  const x = Math.random() * Math.max(maxX, 10) + 5

  return {
    id: nextId++,
    x,
    y: -40,
    speed: isRare ? 3.5 + Math.random() : 2 + Math.random() * 2 + wave * 0.2,
    type,
    label,
    width,
    height: 32,
    rotation: (Math.random() - 0.5) * 15,
  }
}
