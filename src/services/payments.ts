import type { PurchasePreparationResult, ShopItemConfig } from "../types/commerce";

export const paymentsService = {
  prepareTelegramStarsPurchase: async (
    item: ShopItemConfig
  ): Promise<PurchasePreparationResult> => {
    // TODO: Request a Telegram Stars invoice from the backend.
    // TODO: Open the invoice in Telegram WebApp.
    // TODO: Verify the completed payment server-side and grant the reward idempotently.
    return {
      itemId: item.id,
      message: `${item.title} is structurally ready for Telegram Stars, but invoice creation and payment verification are still pending.`,
      status: "pending_config"
    };
  }
};
