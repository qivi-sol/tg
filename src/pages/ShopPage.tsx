import { useMemo, useState } from "react";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { StatusBanner } from "../components/common/StatusBanner";
import { useI18n } from "../hooks/useI18n";
import { SHOP_ITEMS } from "../lib/shop";
import { paymentsService } from "../services/payments";
import type { PurchasePreparationResult, ShopItemConfig } from "../types/commerce";

const localizedShopContent = {
  en: {
    bomb_shield: {
      badge: "Future feature",
      description: "Future consumable that forgives one bomb during a raid.",
      priceLabel: "Telegram Stars later",
      rewardSummary: "1 Bomb Shield",
      title: "Bomb Shield"
    },
    keys_pack: {
      badge: "Soon",
      description: "Fast refill for players who want more raids right away.",
      priceLabel: "Telegram Stars soon",
      rewardSummary: "+5 Keys",
      title: "+5 Keys"
    },
    premium_vault: {
      badge: "Future feature",
      description: "Higher-risk special mode with boosted shard chance.",
      priceLabel: "Telegram Stars later",
      rewardSummary: "Premium vault access",
      title: "Premium Vault"
    }
  },
  ru: {
    bomb_shield: {
      badge: "Будущая фича",
      description: "Будущий расходник, который простит одно попадание в бомбу в рейде.",
      priceLabel: "Telegram Stars позже",
      rewardSummary: "1 Bomb Shield",
      title: "Bomb Shield"
    },
    keys_pack: {
      badge: "Скоро",
      description: "Быстрое пополнение для игроков, которые хотят больше рейдов прямо сейчас.",
      priceLabel: "Telegram Stars скоро",
      rewardSummary: "+5 Ключей",
      title: "+5 Ключей"
    },
    premium_vault: {
      badge: "Будущая фича",
      description: "Специальный режим с повышенным риском и лучшим шансом на шарды.",
      priceLabel: "Telegram Stars позже",
      rewardSummary: "Доступ в Premium Vault",
      title: "Premium Vault"
    }
  }
} as const;

export const ShopPage = () => {
  const { copy, language } = useI18n();
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PurchasePreparationResult | null>(null);

  const items = useMemo(
    () =>
      SHOP_ITEMS.map((item) => ({
        ...item,
        ...localizedShopContent[language][item.id]
      })),
    [language]
  );

  const handlePreparePurchase = async (item: ShopItemConfig) => {
    try {
      const response = await paymentsService.prepareTelegramStarsPurchase(item);
      setSelectedItem(response);
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.shop.prepareError);
    }
  };

  return (
    <>
      <section className="panel-grid">
        <Card className="bg-vault-grid p-5">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
            {copy.shop.title}
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{copy.shop.heroTitle}</div>
          <p className="mt-3 text-sm leading-6 text-soft">{copy.shop.heroBody}</p>
        </Card>

        {notice ? (
          <StatusBanner title={copy.shop.updateTitle} tone="danger">
            {notice}
          </StatusBanner>
        ) : null}

        <div className="grid gap-3">
          {items.map((item) => (
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
                {item.id === "keys_pack" ? copy.shop.prepareStars : copy.shop.prepareFuture}
              </PrimaryButton>
            </Card>
          ))}
        </div>

        <Card className="rounded-[24px] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
            {copy.shop.notesTitle}
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6 text-soft">
            <p>{copy.shop.note1}</p>
            <p>{copy.shop.note2}</p>
            <p>{copy.shop.note3}</p>
            <p>{copy.shop.note4}</p>
          </div>
        </Card>

        <StatusBanner title={copy.shop.monetizationTitle} tone="info">
          {copy.shop.monetizationBody}
        </StatusBanner>
      </section>

      <Modal
        description={selectedItem ? selectedItem.message : ""}
        onClose={() => setSelectedItem(null)}
        open={Boolean(selectedItem)}
        title={copy.shop.preparedTitle}
      />
    </>
  );
};
