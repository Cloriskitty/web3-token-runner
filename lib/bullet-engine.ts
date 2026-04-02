// lib/bullet-engine.ts — Bullet types, spawning, and collision
// Shared between map-runner and bullet-game

export interface Player {
  x: number
  y: number
  width: number
  height: number
}

export interface Bullet {
  id: number
  x: number
  y: number
  width: number
  height: number
  speed: number
  type: "token" | "scam" | "rare"
  label: string
  rotation: number
}

// ── Token labels per company (good bullets to collect) ─────────
const COMPANY_TOKENS: Record<string, string[]> = {
  coinbase: [
    "100M+ users",
    "Nasdaq listed",
    "First crypto IPO",
    "Mission Rock HQ",
    "Base L2 chain",
    "US regulated",
  ],
  "okx-sj": [
    "OKX US HQ",
    "AI Hackathon",
    "OnchainOS",
    "Agentic payment",
    "San Jose built",
    "120M+ users",
    "DEX top 3",
    "US expansion",
    "Web3 wallet",
    "100+ chains",
    "XLayer",
    "OKX DEX",
    "zkEVM",
    "Copy trading",
    "OKX earn",
    "Self-custody",
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

// Scam/wrong bullet labels (avoid these)
const SCAM_LABELS = [
  "100x guaranteed",
  "Send 1 ETH get 2",
  "Rug pull soon",
  "Free airdrop",
  "Not your keys OK",
  "Trust me bro",
  "No audit needed",
  "FOMO now",
  "Pump incoming",
  "DM for alpha",
  "Seed phrase needed",
  "No risk 100% gain",
  "Elon said buy",
  "Fake partnership",
  "Ponzi is fine",
  "Exit scam later",
]

let nextId = 0

export function createBullet(
  companySlug: string,
  containerWidth: number,
  difficulty: number
): Bullet {
  const roll = Math.random()
  const isRare = roll < 0.08 // 8% chance for gold rare
  const isScam = !isRare && roll > 0.45 // ~47% scam, rest tokens

  const tokens = COMPANY_TOKENS[companySlug] || COMPANY_TOKENS.coinbase
  const label = isRare
    ? RARE_LABELS[Math.floor(Math.random() * RARE_LABELS.length)]
    : isScam
    ? SCAM_LABELS[Math.floor(Math.random() * SCAM_LABELS.length)]
    : tokens[Math.floor(Math.random() * tokens.length)]

  const w = isRare ? 200 : label.length * 7 + 20
  const speed = 2 + difficulty * 0.5 + Math.random() * 1.5

  return {
    id: nextId++,
    x: Math.random() * Math.max(0, containerWidth - w),
    y: -40,
    width: w,
    height: 28,
    speed,
    type: isRare ? "rare" : isScam ? "scam" : "token",
    label,
    rotation: (Math.random() - 0.5) * 8,
  }
}

export function createBossBullet(
  companySlug: string,
  containerWidth: number,
  wave: number
): Bullet {
  const tokens = COMPANY_TOKENS[companySlug] || COMPANY_TOKENS.coinbase
  const roll = Math.random()

  // Boss has more scams and faster bullets
  const isRare = roll < 0.05
  const isScam = !isRare && roll > 0.3

  const label = isRare
    ? RARE_LABELS[Math.floor(Math.random() * RARE_LABELS.length)]
    : isScam
    ? SCAM_LABELS[Math.floor(Math.random() * SCAM_LABELS.length)]
    : tokens[Math.floor(Math.random() * tokens.length)]

  const w = isRare ? 220 : label.length * 7 + 24
  const speed = 3.5 + wave * 0.8 + Math.random() * 2

  return {
    id: nextId++,
    x: Math.random() * Math.max(0, containerWidth - w),
    y: -40,
    width: w,
    height: 30,
    speed,
    type: isRare ? "rare" : isScam ? "scam" : "token",
    label,
    rotation: (Math.random() - 0.5) * 12,
  }
}

export function checkCollision(player: Player, bullet: Bullet): boolean {
  return (
    player.x < bullet.x + bullet.width &&
    player.x + player.width > bullet.x &&
    player.y < bullet.y + bullet.height &&
    player.y + player.height > bullet.y
  )
}
