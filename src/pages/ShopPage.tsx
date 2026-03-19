import { useState } from "react";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { StatusBanner } from "../components/common/StatusBanner";
import { SHOP_ITEMS } from "../lib/shop";
import { paymentsService } from "../services/payments";
import type { PurchasePreparationResult, ShopItemConfig } from "../types/commerce";

export const ShopPage = () => {
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PurchasePreparationResult | null>(null);

  const handlePreparePurchase = async (item: ShopItemConfig) => {
    try {
      const response = await paymentsService.prepareTelegramStarsPurchase(item);
      setSelectedItem(response);
      setNotice(null);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to prepare purchase flow."
      );
    }
  };

  return (
    <>
      <section className="panel-grid">
        <Card className="bg-vault-grid p-5">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
            Shop
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            Monetization-ready shell
          </div>
          <p className="mt-3 text-sm leading-6 text-soft">
            UI is live now, while payment flows stay intentionally abstracted for a
            Telegram Stars rollout.
          </p>
        </Card>

        {notice ? (
          <StatusBanner title="Shop Update" tone="danger">
            {notice}
          </StatusBanner>
        ) : null}

        <div className="grid gap-3">
          {SHOP_ITEMS.map((item) => (
            <Card key={item.id} className="rounded-[24px] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-soft">{item.description}</p>
                  <div className="mt-3 text-xs uppercase tracking-[0.22em] text-white/[0.45]">
                    {item.priceLabel} • {item.rewardSummary}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/[0.55]">
                  {item.badge}
                </div>
              </div>
              <PrimaryButton
                className="mt-4"
                onClick={() => handlePreparePurchase(item)}
                variant={item.id === "keys_pack" ? "primary" : "secondary"}
              >
                {item.id === "keys_pack"
                  ? "Prepare Stars Checkout"
                  : "Prepare Future Offer"}
              </PrimaryButton>
            </Card>
          ))}
        </div>

        <Card className="rounded-[24px] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
            Future architecture notes
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-soft">
            <p>Telegram Stars should request an invoice server-side before opening checkout in Telegram.</p>
            <p>Completed payments should be verified server-side and granted idempotently through economy logs.</p>
            <p>Rewarded ads can coexist with key packs, but payout grants should stay on the backend.</p>
            <p>TON Connect and jetton flows should remain separate from the soft-currency MVP economy.</p>
          </div>
        </Card>

        <StatusBanner title="Monetization Ready" tone="info">
          Key packs, premium raid modes, and shield items already have UI entry points.
          Hook the buttons into Telegram Stars or rewarded ads when the purchase backend
          is ready.
        </StatusBanner>
      </section>

      <Modal
        description={
          selectedItem
            ? selectedItem.message
            : ""
        }
        onClose={() => setSelectedItem(null)}
        open={Boolean(selectedItem)}
        title="Shop action prepared"
      />
    </>
  );
};
