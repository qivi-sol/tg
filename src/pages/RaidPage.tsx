import { useMemo, useState } from "react";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { StatusBanner } from "../components/common/StatusBanner";
import { RaidGrid } from "../components/raid/RaidGrid";
import { useAuth } from "../hooks/useAuth";
import { useSound } from "../hooks/useSound";
import { hapticImpact, hapticNotice } from "../lib/telegram";
import type { ActiveRaid } from "../types/game";
import { gameService } from "../services/game-service";

interface ResultState {
  description: string;
  open: boolean;
  title: string;
}

export const RaidPage = () => {
  const { dashboard, sessionToken, updateDashboard } = useAuth();
  const { play } = useSound();
  const [busy, setBusy] = useState(false);
  const [pendingRevealIndex, setPendingRevealIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<{
    body: string;
    tone: "info" | "success" | "danger";
  } | null>(null);
  const [result, setResult] = useState<ResultState>({
    description: "",
    open: false,
    title: ""
  });

  const activeRaid = dashboard?.activeRaid ?? null;

  const raidStats = useMemo(() => {
    if (!activeRaid) {
      return [];
    }

    return [
      { label: "Coins in bag", value: `${activeRaid.temporaryCoins}` },
      { label: "Shards in bag", value: `${activeRaid.temporaryShards}` },
      { label: "Multiplier", value: `x${activeRaid.multiplierFactor.toFixed(2)}` },
      { label: "Safe opens", value: `${activeRaid.openedCellsCount}/8` }
    ];
  }, [activeRaid]);

  if (!dashboard || !sessionToken) {
    return null;
  }

  const openResult = (title: string, description: string) => {
    setResult({ description, open: true, title });
  };

  const handleStartRaid = async () => {
    try {
      setBusy(true);
      setNotice(null);
      const response = await gameService.startRaid(sessionToken);
      updateDashboard(response.dashboard);
      setNotice({
        body: "A fresh vault is live. Open a safe cell to start stacking the bag.",
        tone: "info"
      });
      hapticImpact("medium");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start raid.";
      setNotice({
        body: message,
        tone: "danger"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReveal = async (cellIndex: number) => {
    if (!activeRaid) {
      return;
    }

    try {
      setBusy(true);
      setPendingRevealIndex(cellIndex);
      setNotice({
        body: "Scanning vault cell...",
        tone: "info"
      });
      const response = await gameService.revealCell(sessionToken, activeRaid.id, cellIndex);
      updateDashboard(response.dashboard);
      play(response.status === "lost" ? "fail" : "reveal");

      if (response.rewardDelta) {
        setNotice({
          body: `Revealed ${response.rewardDelta.label}. Current bag: ${response.raid?.temporaryCoins ?? 0} coins, ${response.raid?.temporaryShards ?? 0} shards.`,
          tone: response.status === "won" ? "success" : "info"
        });
      }

      if (response.status === "lost") {
        hapticNotice("error");
        setNotice({
          body: "The bomb triggered and this run paid nothing.",
          tone: "danger"
        });
        openResult("Vault detonated", "The bomb wiped this run. Your current raid loot is gone.");
      }

      if (response.status === "won") {
        hapticNotice("success");
        setNotice({
          body: "Every safe cell is clear. The full raid payout was auto-banked.",
          tone: "success"
        });
        openResult(
          "Vault cleared",
          "You opened every safe cell and auto-banked the full reward."
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cell reveal failed.";
      setNotice({
        body: message,
        tone: "danger"
      });
    } finally {
      setBusy(false);
      setPendingRevealIndex(null);
    }
  };

  const handleCashOut = async (raid: ActiveRaid) => {
    try {
      setBusy(true);
      setNotice({
        body: "Locking in your bag...",
        tone: "info"
      });
      const response = await gameService.cashOutRaid(sessionToken, raid.id);
      updateDashboard(response.dashboard);
      play("success");
      hapticNotice("success");
      setNotice({
        body: `Reward locked in: ${raid.temporaryCoins} coins and ${raid.temporaryShards} shards.`,
        tone: "success"
      });
      openResult(
        "Reward banked",
        `You secured ${raid.temporaryCoins} coins and ${raid.temporaryShards} shards.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cash out failed.";
      setNotice({
        body: message,
        tone: "danger"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRiskMore = () => {
    document.getElementById("raid-grid")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    hapticImpact("light");
  };

  return (
    <>
      <section className="panel-grid">
        <Card className="overflow-hidden bg-vault-grid p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/[0.45]">
                Raid Loop
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Open cells. Dodge the bomb. Take the bag.
              </div>
              <p className="mt-3 text-sm leading-6 text-soft">
                Each raid costs 1 Key. Cash out whenever the run feels rich enough.
              </p>
            </div>
            <div className="rounded-full border border-accent-gold/20 bg-accent-gold/10 px-3 py-1 text-xs font-semibold text-accent-gold">
              {dashboard.profile.keys} keys
            </div>
          </div>
          <PrimaryButton
            className="mt-5"
            disabled={busy || dashboard.profile.keys < 1 || Boolean(activeRaid)}
            onClick={handleStartRaid}
          >
            {busy && !activeRaid
              ? "Spending Key..."
              : dashboard.profile.keys < 1
                ? "No Keys Available"
                : activeRaid
                  ? "Raid In Progress"
                  : "Spend 1 Key"}
          </PrimaryButton>
          {dashboard.profile.keys < 1 ? (
            <p className="mt-3 text-sm text-accent-danger">
              Claim your daily reward or use referrals to get more keys.
            </p>
          ) : null}
        </Card>

        {notice ? (
          <StatusBanner title="Vault Feed" tone={notice.tone}>
            {notice.body}
          </StatusBanner>
        ) : null}

        {activeRaid ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {raidStats.map((item) => (
                <Card key={item.label} className="rounded-[20px] p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                    {item.label}
                  </div>
                  <div className="mt-3 text-xl font-semibold text-white">{item.value}</div>
                </Card>
              ))}
            </div>

            <div id="raid-grid">
              <RaidGrid
                disabled={busy}
                onReveal={handleReveal}
                pendingCellIndex={pendingRevealIndex}
                raid={activeRaid}
              />
            </div>

            <Card className="rounded-[24px] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
                    Decision point
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">Take reward or risk more</div>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    You can keep tapping unopened cells, but one hidden bomb ends the run.
                  </p>
                </div>
                <div className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
                  Live raid
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <PrimaryButton
                  disabled={busy || activeRaid.openedCellsCount < 1}
                  onClick={() => handleCashOut(activeRaid)}
                >
                  {busy ? "Locking Reward..." : "Take Reward"}
                </PrimaryButton>
                <PrimaryButton disabled={busy} onClick={handleRiskMore} variant="secondary">
                  Risk More
                </PrimaryButton>
              </div>
            </Card>
          </>
        ) : (
          <Card className="rounded-[24px] p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">
              How it works
            </div>
            <div className="mt-3 text-lg font-semibold text-white">
              1 bomb. 8 safe cells. Your call every tap.
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-soft">
              <p>Coins stack your current run.</p>
              <p>Multipliers boost the bag you are holding.</p>
              <p>Rare shard cells feed future airdrop utility.</p>
              <p>If you hit the bomb, that raid pays nothing.</p>
            </div>
          </Card>
        )}
      </section>

      <Modal
        description={result.description}
        onClose={() => setResult((current) => ({ ...current, open: false }))}
        open={result.open}
        title={result.title}
      />
    </>
  );
};
