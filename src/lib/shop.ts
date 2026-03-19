import type { ShopItemConfig } from "../types/commerce";

export const SHOP_ITEMS: ShopItemConfig[] = [
  {
    badge: "Soon",
    description: "Fast refill for players who want more raids right away.",
    id: "keys_pack",
    priceLabel: "Telegram Stars soon",
    rewardSummary: "+5 Keys",
    title: "+5 Keys"
  },
  {
    badge: "Future feature",
    description: "Future consumable that forgives one bomb during a raid.",
    id: "bomb_shield",
    priceLabel: "Telegram Stars later",
    rewardSummary: "1 Bomb Shield",
    title: "Bomb Shield"
  },
  {
    badge: "Future feature",
    description: "Higher-risk special mode with boosted shard chance.",
    id: "premium_vault",
    priceLabel: "Telegram Stars later",
    rewardSummary: "Premium vault access",
    title: "Premium Vault"
  }
];
