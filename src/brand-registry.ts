// brand-registry.ts — ticker → brand metadata
//
// Consumed by Layer 1b (brand bg) and Layer 2b (brand logo) when the input
// has exactly one ticker that's registered here.
//
// Rules:
//   - If a ticker is NOT in this registry → default (hashed) bg + Material Symbol
//   - If `mono: true` → keep the logo replacement but skip the brand-color bg tint
//   - Logos are referenced by relative path under a shared logos/ folder. The
//     SKILL package does not ship the SVGs directly; callers wire up the
//     logo loader (SimpleIcons CDN, bundled asset folder, etc.).

import { BrandRegistry } from "./types";

export const BRAND_REGISTRY: BrandRegistry = {
  // ---------- US equities — top coverage ----------
  AAPL: { color: "#000000", logoSvg: "AAPL.svg", mono: true,  source: "https://simpleicons.org/?q=apple",  lastVerified: "2026-04-23", logoSlug: "apple", fallbackSymbol: "smartphone" , hasCdnLogo: true },
  AMZN: { color: "#FF9900", logoSvg: "AMZN.svg", mono: false, source: "https://simpleicons.org/?q=amazon", lastVerified: "2026-04-23", logoSlug: "amazon", fallbackSymbol: "shopping_bag" , hasCdnLogo: true },
  GOOGL:{ color: "#4285F4", logoSvg: "GOOGL.svg",mono: false, source: "https://simpleicons.org/?q=google", lastVerified: "2026-04-23", logoSlug: "google", fallbackSymbol: "search" , hasCdnLogo: true },
  META: { color: "#1877F2", logoSvg: "META.svg", mono: false, source: "https://simpleicons.org/?q=meta",   lastVerified: "2026-04-23", logoSlug: "meta", fallbackSymbol: "groups" , hasCdnLogo: true },
  MSFT: { color: "#F25022", logoSvg: "MSFT.svg", mono: false, source: "https://simpleicons.org/?q=microsoft", lastVerified: "2026-04-23", logoSlug: "microsoft", fallbackSymbol: "computer" , hasCdnLogo: true },
  NVDA: { color: "#76B900", logoSvg: "NVDA.svg", mono: false, source: "https://simpleicons.org/?q=nvidia", lastVerified: "2026-04-23", logoSlug: "nvidia", fallbackSymbol: "memory" , hasCdnLogo: true },
  TSLA: { color: "#E82127", logoSvg: "TSLA.svg", mono: false, source: "https://simpleicons.org/?q=tesla",  lastVerified: "2026-04-23", logoSlug: "tesla", fallbackSymbol: "directions_car" , hasCdnLogo: true },
  AMD:  { color: "#ED1C24", logoSvg: "AMD.svg",  mono: false, source: "https://simpleicons.org/?q=amd",    lastVerified: "2026-04-23", logoSlug: "amd", fallbackSymbol: "memory" , hasCdnLogo: true },
  AVGO: { color: "#CC092F", logoSvg: "AVGO.svg", mono: false, source: "https://en.wikipedia.org/wiki/Broadcom", lastVerified: "2026-04-23", logoSlug: "broadcom", fallbackSymbol: "memory" , hasCdnLogo: false },
  INTC: { color: "#0071C5", logoSvg: "INTC.svg", mono: false, source: "https://simpleicons.org/?q=intel",  lastVerified: "2026-04-23", logoSlug: "intel", fallbackSymbol: "memory" , hasCdnLogo: true },
  TSM:  { color: "#D70000", logoSvg: "TSM.svg",  mono: false, source: "https://en.wikipedia.org/wiki/TSMC", lastVerified: "2026-04-23", logoSlug: "tsmc", fallbackSymbol: "memory" , hasCdnLogo: false },
  PANW: { color: "#F04E23", logoSvg: "PANW.svg", mono: false, source: "https://en.wikipedia.org/wiki/Palo_Alto_Networks", lastVerified: "2026-04-23", logoSlug: "paloaltonetworks", fallbackSymbol: "security" , hasCdnLogo: true },
  CRM:  { color: "#00A1E0", logoSvg: "CRM.svg",  mono: false, source: "https://simpleicons.org/?q=salesforce", lastVerified: "2026-04-23", logoSlug: "salesforce", fallbackSymbol: "groups" , hasCdnLogo: true },
  ORCL: { color: "#F80000", logoSvg: "ORCL.svg", mono: false, source: "https://simpleicons.org/?q=oracle", lastVerified: "2026-04-23", logoSlug: "oracle", fallbackSymbol: "storage" , hasCdnLogo: true },
  IBM:  { color: "#1F70C1", logoSvg: "IBM.svg",  mono: false, source: "https://simpleicons.org/?q=ibm",    lastVerified: "2026-04-23", logoSlug: "ibm", fallbackSymbol: "computer" , hasCdnLogo: false },
  ADBE: { color: "#FF0000", logoSvg: "ADBE.svg", mono: false, source: "https://simpleicons.org/?q=adobe",  lastVerified: "2026-04-23", logoSlug: "adobe", fallbackSymbol: "draw" , hasCdnLogo: true },
  NFLX: { color: "#E50914", logoSvg: "NFLX.svg", mono: false, source: "https://simpleicons.org/?q=netflix",lastVerified: "2026-04-23", logoSlug: "netflix", fallbackSymbol: "movie" , hasCdnLogo: true },
  DIS:  { color: "#006E99", logoSvg: "DIS.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Walt_Disney_Company", lastVerified: "2026-04-23", logoSlug: "walt-disney", fallbackSymbol: "movie" , hasCdnLogo: false },
  JPM:  { color: "#0F4C81", logoSvg: "JPM.svg",  mono: false, source: "https://en.wikipedia.org/wiki/JPMorgan_Chase", lastVerified: "2026-04-23", logoSlug: "jpmorganchase", fallbackSymbol: "account_balance" , hasCdnLogo: false },
  BAC:  { color: "#012169", logoSvg: "BAC.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Bank_of_America", lastVerified: "2026-04-23", logoSlug: "bankofamerica", fallbackSymbol: "account_balance" , hasCdnLogo: false },
  V:    { color: "#1A1F71", logoSvg: "V.svg",    mono: false, source: "https://simpleicons.org/?q=visa",   lastVerified: "2026-04-23", logoSlug: "visa", fallbackSymbol: "credit_card" , hasCdnLogo: true },
  MA:   { color: "#EB001B", logoSvg: "MA.svg",   mono: false, source: "https://simpleicons.org/?q=mastercard", lastVerified: "2026-04-23", logoSlug: "mastercard", fallbackSymbol: "credit_card" , hasCdnLogo: true },
  WMT:  { color: "#0071CE", logoSvg: "WMT.svg",  mono: false, source: "https://simpleicons.org/?q=walmart",lastVerified: "2026-04-23", logoSlug: "walmart", fallbackSymbol: "shopping_bag" , hasCdnLogo: false },
  HD:   { color: "#F96302", logoSvg: "HD.svg",   mono: false, source: "https://en.wikipedia.org/wiki/Home_Depot", lastVerified: "2026-04-23", logoSlug: "homedepot", fallbackSymbol: "construction" , hasCdnLogo: false },
  COST: { color: "#E31837", logoSvg: "COST.svg", mono: false, source: "https://en.wikipedia.org/wiki/Costco", lastVerified: "2026-04-23", logoSlug: "costco", fallbackSymbol: "shopping_bag" , hasCdnLogo: false },
  KO:   { color: "#F40009", logoSvg: "KO.svg",   mono: false, source: "https://simpleicons.org/?q=cocacola", lastVerified: "2026-04-23", logoSlug: "coca-cola", fallbackSymbol: "local_drink" , hasCdnLogo: false },
  PEP:  { color: "#004B93", logoSvg: "PEP.svg",  mono: false, source: "https://simpleicons.org/?q=pepsi",  lastVerified: "2026-04-23", logoSlug: "pepsi", fallbackSymbol: "local_drink" , hasCdnLogo: false },
  PG:   { color: "#003DA5", logoSvg: "PG.svg",   mono: false, source: "https://en.wikipedia.org/wiki/Procter_%26_Gamble", lastVerified: "2026-04-23", logoSlug: "procter-and-gamble", fallbackSymbol: "shopping_bag" , hasCdnLogo: false },
  JNJ:  { color: "#CC0000", logoSvg: "JNJ.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Johnson_%26_Johnson", lastVerified: "2026-04-23", logoSlug: "johnsonandjohnson", fallbackSymbol: "medication" , hasCdnLogo: false },
  PFE:  { color: "#0093D0", logoSvg: "PFE.svg",  mono: false, source: "https://simpleicons.org/?q=pfizer", lastVerified: "2026-04-23", logoSlug: "pfizer", fallbackSymbol: "medication" , hasCdnLogo: false },
  LLY:  { color: "#E11F29", logoSvg: "LLY.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Eli_Lilly_and_Company", lastVerified: "2026-04-23", logoSlug: "eli-lilly", fallbackSymbol: "medication" , hasCdnLogo: false },
  UNH:  { color: "#002677", logoSvg: "UNH.svg",  mono: false, source: "https://en.wikipedia.org/wiki/UnitedHealth_Group", lastVerified: "2026-04-23", logoSlug: "unitedhealth", fallbackSymbol: "local_hospital" , hasCdnLogo: false },
  XOM:  { color: "#E1150E", logoSvg: "XOM.svg",  mono: false, source: "https://en.wikipedia.org/wiki/ExxonMobil", lastVerified: "2026-04-23", logoSlug: "exxon", fallbackSymbol: "oil_barrel" , hasCdnLogo: false },
  CVX:  { color: "#1F4E9D", logoSvg: "CVX.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Chevron_Corporation", lastVerified: "2026-04-23", logoSlug: "chevron", fallbackSymbol: "oil_barrel" , hasCdnLogo: false },
  BA:   { color: "#0033A0", logoSvg: "BA.svg",   mono: false, source: "https://simpleicons.org/?q=boeing", lastVerified: "2026-04-23", logoSlug: "ba", fallbackSymbol: "flight" , hasCdnLogo: false },
  LMT:  { color: "#0F1C49", logoSvg: "LMT.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Lockheed_Martin", lastVerified: "2026-04-23", logoSlug: "lmt", fallbackSymbol: "security" , hasCdnLogo: false },
  RTX:  { color: "#C00A2A", logoSvg: "RTX.svg",  mono: false, source: "https://en.wikipedia.org/wiki/RTX_Corporation", lastVerified: "2026-04-23", logoSlug: "rtx", fallbackSymbol: "security" , hasCdnLogo: false },
  CAT:  { color: "#FFCD11", logoSvg: "CAT.svg",  mono: false, source: "https://simpleicons.org/?q=caterpillar", lastVerified: "2026-04-23", logoSlug: "cat", fallbackSymbol: "construction" , hasCdnLogo: false },
  DE:   { color: "#367C2B", logoSvg: "DE.svg",   mono: false, source: "https://en.wikipedia.org/wiki/John_Deere", lastVerified: "2026-04-23", logoSlug: "de", fallbackSymbol: "agriculture" , hasCdnLogo: false },
  NKE:  { color: "#000000", logoSvg: "NKE.svg",  mono: true,  source: "https://simpleicons.org/?q=nike",   lastVerified: "2026-04-23", logoSlug: "nke", fallbackSymbol: "memory" , hasCdnLogo: true },
  SBUX: { color: "#006241", logoSvg: "SBUX.svg", mono: false, source: "https://simpleicons.org/?q=starbucks", lastVerified: "2026-04-23", logoSlug: "sbux", fallbackSymbol: "local_cafe" , hasCdnLogo: true },
  MCD:  { color: "#FFC72C", logoSvg: "MCD.svg",  mono: false, source: "https://simpleicons.org/?q=mcdonalds", lastVerified: "2026-04-23", logoSlug: "mcd", fallbackSymbol: "restaurant" , hasCdnLogo: false },
  UBER: { color: "#000000", logoSvg: "UBER.svg", mono: true,  source: "https://simpleicons.org/?q=uber",   lastVerified: "2026-04-23", logoSlug: "uber", fallbackSymbol: "memory" , hasCdnLogo: false },
  ABNB: { color: "#FF5A5F", logoSvg: "ABNB.svg", mono: false, source: "https://simpleicons.org/?q=airbnb", lastVerified: "2026-04-23", logoSlug: "abnb", fallbackSymbol: "memory" , hasCdnLogo: false },
  COIN: { color: "#0052FF", logoSvg: "COIN.svg", mono: false, source: "https://simpleicons.org/?q=coinbase", lastVerified: "2026-04-23", logoSlug: "coin", fallbackSymbol: "memory" , hasCdnLogo: false },
  SQ:   { color: "#000000", logoSvg: "SQ.svg",   mono: true,  source: "https://simpleicons.org/?q=square", lastVerified: "2026-04-23", logoSlug: "sq", fallbackSymbol: "memory" , hasCdnLogo: false },
  SHOP: { color: "#7AB55C", logoSvg: "SHOP.svg", mono: false, source: "https://simpleicons.org/?q=shopify", lastVerified: "2026-04-23", logoSlug: "shop", fallbackSymbol: "memory" , hasCdnLogo: false },
  SNOW: { color: "#29B5E8", logoSvg: "SNOW.svg", mono: false, source: "https://simpleicons.org/?q=snowflake", lastVerified: "2026-04-23", logoSlug: "snow", fallbackSymbol: "memory" , hasCdnLogo: false },

  // ---------- Crypto — top coverage ----------
  BTC:   { color: "#F7931A", logoSvg: "BTC.svg",   mono: false, source: "https://simpleicons.org/?q=bitcoin", lastVerified: "2026-04-23", logoSlug: "btc", fallbackSymbol: "memory" , hasCdnLogo: false },
  ETH:   { color: "#627EEA", logoSvg: "ETH.svg",   mono: false, source: "https://simpleicons.org/?q=ethereum", lastVerified: "2026-04-23", logoSlug: "eth", fallbackSymbol: "memory" , hasCdnLogo: false },
  USDT:  { color: "#26A17B", logoSvg: "USDT.svg",  mono: false, source: "https://simpleicons.org/?q=tether",   lastVerified: "2026-04-23", logoSlug: "usdt", fallbackSymbol: "memory" , hasCdnLogo: false },
  USDC:  { color: "#2775CA", logoSvg: "USDC.svg",  mono: false, source: "https://en.wikipedia.org/wiki/USD_Coin", lastVerified: "2026-04-23", logoSlug: "usdc", fallbackSymbol: "memory" , hasCdnLogo: false },
  BNB:   { color: "#F3BA2F", logoSvg: "BNB.svg",   mono: false, source: "https://simpleicons.org/?q=binance",   lastVerified: "2026-04-23", logoSlug: "bnb", fallbackSymbol: "memory" , hasCdnLogo: false },
  SOL:   { color: "#9945FF", logoSvg: "SOL.svg",   mono: false, source: "https://simpleicons.org/?q=solana",    lastVerified: "2026-04-23", logoSlug: "sol", fallbackSymbol: "memory" , hasCdnLogo: false },
  XRP:   { color: "#000000", logoSvg: "XRP.svg",   mono: true,  source: "https://simpleicons.org/?q=xrp",       lastVerified: "2026-04-23", logoSlug: "xrp", fallbackSymbol: "memory" , hasCdnLogo: false },
  DOGE:  { color: "#C2A633", logoSvg: "DOGE.svg",  mono: false, source: "https://simpleicons.org/?q=dogecoin",  lastVerified: "2026-04-23", logoSlug: "doge", fallbackSymbol: "memory" , hasCdnLogo: false },
  ADA:   { color: "#0033AD", logoSvg: "ADA.svg",   mono: false, source: "https://simpleicons.org/?q=cardano",   lastVerified: "2026-04-23", logoSlug: "ada", fallbackSymbol: "memory" , hasCdnLogo: false },
  AVAX:  { color: "#E84142", logoSvg: "AVAX.svg",  mono: false, source: "https://en.wikipedia.org/wiki/Avalanche_(blockchain_platform)", lastVerified: "2026-04-23", logoSlug: "avax", fallbackSymbol: "memory" , hasCdnLogo: false },
  LINK:  { color: "#2A5ADA", logoSvg: "LINK.svg",  mono: false, source: "https://simpleicons.org/?q=chainlink", lastVerified: "2026-04-23", logoSlug: "link", fallbackSymbol: "memory" , hasCdnLogo: false },
  DOT:   { color: "#E6007A", logoSvg: "DOT.svg",   mono: false, source: "https://simpleicons.org/?q=polkadot",  lastVerified: "2026-04-23", logoSlug: "dot", fallbackSymbol: "memory" , hasCdnLogo: false },
  UNI:   { color: "#FF007A", logoSvg: "UNI.svg",   mono: false, source: "https://simpleicons.org/?q=uniswap",   lastVerified: "2026-04-23", logoSlug: "uni", fallbackSymbol: "memory" , hasCdnLogo: false },

  // ---------- ETFs — distinct branding only ----------
  SPY:   { color: "#000000", logoSvg: "SPY.svg",   mono: true,  source: "https://en.wikipedia.org/wiki/SPDR_S%26P_500_ETF_Trust", lastVerified: "2026-04-23", logoSlug: "spy", fallbackSymbol: "public" , hasCdnLogo: false },
  QQQ:   { color: "#00B0B9", logoSvg: "QQQ.svg",   mono: false, source: "https://en.wikipedia.org/wiki/Invesco_QQQ", lastVerified: "2026-04-23", logoSlug: "qqq", fallbackSymbol: "memory" , hasCdnLogo: false },
  VOO:   { color: "#96151D", logoSvg: "VOO.svg",   mono: false, source: "https://en.wikipedia.org/wiki/Vanguard_S%26P_500_ETF", lastVerified: "2026-04-23", logoSlug: "voo", fallbackSymbol: "public" , hasCdnLogo: false },
  VTI:   { color: "#96151D", logoSvg: "VTI.svg",   mono: false, source: "https://en.wikipedia.org/wiki/Vanguard_Total_Stock_Market_Index_Fund", lastVerified: "2026-04-23", logoSlug: "vti", fallbackSymbol: "public" , hasCdnLogo: false },
  IWM:   { color: "#000000", logoSvg: "IWM.svg",   mono: true,  source: "https://en.wikipedia.org/wiki/iShares", lastVerified: "2026-04-23", logoSlug: "iwm", fallbackSymbol: "savings" , hasCdnLogo: false },
  ARKK:  { color: "#000000", logoSvg: "ARKK.svg",  mono: true,  source: "https://en.wikipedia.org/wiki/Ark_Invest", lastVerified: "2026-04-23", logoSlug: "arkk", fallbackSymbol: "trending_up" , hasCdnLogo: false },
};
