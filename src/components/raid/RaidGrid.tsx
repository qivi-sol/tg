import { cn } from "../../lib/cn";
import type { ActiveRaid } from "../../types/game";

interface RaidGridProps {
  disabled?: boolean;
  onReveal: (cellIndex: number) => void;
  pendingCellIndex?: number | null;
  raid: ActiveRaid;
}

const cellTone: Record<string, string> = {
  bomb: "border-accent-danger/40 bg-accent-danger/10 text-accent-danger",
  coin: "border-accent-gold/40 bg-accent-gold/10 text-accent-gold",
  multiplier: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
  shard: "border-accent-green/40 bg-accent-green/10 text-accent-green"
};

export const RaidGrid = ({
  disabled = false,
  onReveal,
  pendingCellIndex = null,
  raid
}: RaidGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {raid.cells.map((cell) => {
        const isPending = pendingCellIndex === cell.cellIndex && !cell.revealed;

        return (
          <button
            key={cell.cellIndex}
            className={cn(
              "glass-card flex aspect-square items-center justify-center rounded-[20px] border text-center transition duration-200",
              !cell.revealed &&
                "border-white/10 bg-surface-900/90 text-lg font-semibold text-white hover:border-accent-cyan/30",
              cell.revealed && cell.cellType && cellTone[cell.cellType],
              isPending && "animate-pulse border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
              !cell.revealed && !disabled && "active:scale-[0.97]",
              disabled && "cursor-not-allowed opacity-70"
            )}
            disabled={disabled || cell.revealed}
            onClick={() => onReveal(cell.cellIndex)}
          >
            {cell.revealed ? (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/[0.45]">
                  {cell.cellType}
                </div>
                <div className="text-sm font-semibold text-white">{cell.label}</div>
              </div>
            ) : isPending ? (
              <div className="space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full border border-accent-cyan/30 bg-accent-cyan/10" />
                <div className="text-[10px] uppercase tracking-[0.26em] text-accent-cyan">
                  Scanning
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full border border-white/10 bg-white/5" />
                <div className="text-[10px] uppercase tracking-[0.26em] text-white/[0.35]">
                  Tap
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
