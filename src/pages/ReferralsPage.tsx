import { useState } from "react";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { StatusBanner } from "../components/common/StatusBanner";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useI18n";
import { appConfig, botUsernameConfigured } from "../lib/config";
import { copyText, openTelegramShare } from "../lib/telegram";

export const ReferralsPage = () => {
  const { dashboard } = useAuth();
  const { copy, language } = useI18n();
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!dashboard) {
    return null;
  }

  const referralLink = dashboard.referrals.referralLink;
  const deepLinkPreview = botUsernameConfigured
    ? `https://t.me/${appConfig.telegramBotUsername}?startapp=ref_${dashboard.profile.referralCode}`
    : `https://t.me/YOUR_BOT_USERNAME?startapp=ref_${dashboard.profile.referralCode}`;

  const handleCopy = async () => {
    if (!referralLink) {
      setErrorMessage(copy.referrals.linkUnavailable);
      return;
    }

    try {
      await copyText(referralLink);
      setCopied(true);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось скопировать ссылку."
            : "Could not copy referral link."
      );
    }
  };

  const handleShare = () => {
    if (!referralLink) {
      setErrorMessage(copy.referrals.shareUnavailable);
      return;
    }

    try {
      openTelegramShare(referralLink);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : language === "ru"
            ? "Не удалось открыть шаринг Telegram."
            : "Could not open Telegram sharing."
      );
    }
  };

  return (
    <>
      <section className="panel-grid">
        <Card className="bg-vault-grid p-5">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
            {copy.referrals.title}
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {copy.referrals.heroTitle}
          </div>
          <p className="mt-3 text-sm leading-6 text-soft">{copy.referrals.heroBody}</p>
          <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.referrals.code}
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {dashboard.profile.referralCode}
            </div>
            <div className="mt-3 break-all text-sm text-soft">
              {referralLink ?? copy.referrals.configureBot}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PrimaryButton disabled={!referralLink} onClick={handleCopy}>
              {copy.referrals.copyLink}
            </PrimaryButton>
            <PrimaryButton
              disabled={!referralLink}
              onClick={handleShare}
              variant="secondary"
            >
              {copy.referrals.shareTelegram}
            </PrimaryButton>
          </div>
        </Card>

        <StatusBanner title={copy.referrals.loopTitle} tone={referralLink ? "success" : "info"}>
          {copy.referrals.loopBody}
        </StatusBanner>

        {errorMessage ? (
          <StatusBanner title={copy.referrals.shareError} tone="danger">
            {errorMessage}
          </StatusBanner>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.referrals.totalReferrals}
            </div>
            <div className="mt-3 text-xl font-semibold text-white">
              {dashboard.referrals.totalReferrals}
            </div>
          </Card>
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.referrals.activeReferrals}
            </div>
            <div className="mt-3 text-xl font-semibold text-white">
              {dashboard.referrals.activeReferrals}
            </div>
          </Card>
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.referrals.bonusEarned}
            </div>
            <div className="mt-3 text-xl font-semibold text-white">
              +{dashboard.referrals.referralBonusEarned} {copy.common.keys}
            </div>
          </Card>
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              {copy.referrals.rewardRule}
            </div>
            <div className="mt-3 text-sm leading-6 text-soft">
              {copy.referrals.rewardRuleBody}
            </div>
          </Card>
        </div>

        <Card className="rounded-[24px] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
            {copy.referrals.deepLinkFormat}
          </div>
          <p className="mt-3 text-sm leading-6 text-soft">
            {botUsernameConfigured
              ? copy.referrals.deepLinkConfigured
              : copy.referrals.deepLinkMissing}
          </p>
          <div className="mt-3 break-all rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white/[0.85]">
            {deepLinkPreview}
          </div>
        </Card>
      </section>

      <Modal
        description={copy.referrals.copiedBody}
        onClose={() => setCopied(false)}
        open={copied}
        title={copy.referrals.copiedTitle}
      />
    </>
  );
};
