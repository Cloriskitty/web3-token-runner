import { COMPANIES, type Company } from "./companies"

export type RouteName = "founder" | "degen"

export interface RouteConfig {
  name: RouteName
  label: string
  emoji: string
  description: string
  bossSlugs: string[]
  companySlugs: string[]
  color: string
  bgGradient: string
}

const FOUNDER_SLUGS = [
  "alchemy",
  "solana-labs",
  "protocol-labs",
  "chainlink-labs",
  "aptos-labs",
  "mysten-labs",
  "anchorage-digital",
]

const DEGEN_SLUGS = [
  "kraken",
  "okx-sf",
  "robinhood",
  "coinlist",
  "ripple",
  "forte",
  "bitgo",
]

export const ROUTES: Record<RouteName, RouteConfig> = {
  founder: {
    name: "founder",
    label: "Founder Route",
    emoji: "🏗️",
    description:
      "Build your way through infra and protocol companies. Final boss: a16z Crypto.",
    bossSlugs: ["a16z-crypto"],
    companySlugs: FOUNDER_SLUGS,
    color: "#7b1fa2",
    bgGradient: "from-purple-900 via-indigo-900 to-slate-900",
  },
  degen: {
    name: "degen",
    label: "Degen Route",
    emoji: "🎰",
    description:
      "Trade, earn, and survive exchanges & payments. Final boss: Coinbase.",
    bossSlugs: ["coinbase"],
    companySlugs: DEGEN_SLUGS,
    color: "#d32f2f",
    bgGradient: "from-red-900 via-orange-900 to-slate-900",
  },
}

export function getRouteCompanies(route: RouteName): Company[] {
  const config = ROUTES[route]
  return config.companySlugs
    .map((slug) => COMPANIES.find((c) => c.slug === slug))
    .filter(Boolean) as Company[]
}

export function getRouteBoss(route: RouteName): Company | undefined {
  const config = ROUTES[route]
  return COMPANIES.find((c) => c.slug === config.bossSlugs[0])
}
