export type ShopItemId = "keys_pack" | "bomb_shield" | "premium_vault";

export interface ShopItemConfig {
  badge: string;
  description: string;
  id: ShopItemId;
  priceLabel: string;
  rewardSummary: string;
  title: string;
}

export interface PurchasePreparationResult {
  itemId: ShopItemId;
  message: string;
  status: "pending_config" | "ready";
}
