import { useState } from "react";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { StatusBanner } from "../components/common/StatusBanner";
import { useAuth } from "../hooks/useAuth";
import { appConfig, botUsernameConfigured } from "../lib/config";
import { copyText, openTelegramShare } from "../lib/telegram";

export const ReferralsPage = () => {
  const { dashboard } = useAuth();
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
      setErrorMessage(
        "Referral link is not available until VITE_TELEGRAM_BOT_USERNAME and TELEGRAM_BOT_USERNAME are configured."
      );
      return;
    }

    try {
      await copyText(referralLink);
      setCopied(true);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not copy referral link."
      );
    }
  };

  const handleShare = () => {
    if (!referralLink) {
      setErrorMessage(
        "Telegram sharing stays disabled until the bot username is configured."
      );
      return;
    }

    try {
      openTelegramShare(referralLink);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not open Telegram sharing."
      );
    }
  };

  return (
    <>
      <section className="panel-grid">
        <Card className="bg-vault-grid p-5">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
            Invite Raiders
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            Grow your vault network
          </div>
          <p className="mt-3 text-sm leading-6 text-soft">
            Invite a new player and earn 2 Keys. They start with +1 Key too.
          </p>
          <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              Your referral code
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {dashboard.profile.referralCode}
            </div>
            <div className="mt-3 break-all text-sm text-soft">
              {referralLink ??
                "Configure your Telegram bot username to unlock the real referral link."}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PrimaryButton disabled={!referralLink} onClick={handleCopy}>
              Copy Link
            </PrimaryButton>
            <PrimaryButton
              disabled={!referralLink}
              onClick={handleShare}
              variant="secondary"
            >
              Share in Telegram
            </PrimaryButton>
          </div>
        </Card>

        <StatusBanner title="Referral Loop" tone={referralLink ? "success" : "info"}>
          Every qualified join credits the inviter with 2 Keys and the invitee with 1
          Key. Only the first valid referral counts, self-referrals are blocked, and
          the bonus is granted once server-side.
        </StatusBanner>

        {errorMessage ? (
          <StatusBanner title="Share Error" tone="danger">
            {errorMessage}
          </StatusBanner>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              Total referrals
            </div>
            <div className="mt-3 text-xl font-semibold text-white">
              {dashboard.referrals.totalReferrals}
            </div>
          </Card>
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              Active referrals
            </div>
            <div className="mt-3 text-xl font-semibold text-white">
              {dashboard.referrals.activeReferrals}
            </div>
          </Card>
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              Bonus earned
            </div>
            <div className="mt-3 text-xl font-semibold text-white">
              +{dashboard.referrals.referralBonusEarned} Keys
            </div>
          </Card>
          <Card className="rounded-[20px] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              Reward rule
            </div>
            <div className="mt-3 text-sm leading-6 text-soft">
              Inviter +2 Keys, invitee +1 Key on first valid join.
            </div>
          </Card>
        </div>

        <Card className="rounded-[24px] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
            Deep link format
          </div>
          <p className="mt-3 text-sm leading-6 text-soft">
            {botUsernameConfigured
              ? "Your bot username is configured. Keep the ref_CODE pattern intact when wiring bot deep links."
              : "Set your live bot username in both frontend and Edge Function env vars, then keep the ref_CODE pattern intact."}
          </p>
          <div className="mt-3 break-all rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white/[0.85]">
            {deepLinkPreview}
          </div>
        </Card>
      </section>

      <Modal
        description="Your referral link is copied and ready to drop into chats."
        onClose={() => setCopied(false)}
        open={copied}
        title="Referral link copied"
      />
    </>
  );
};
