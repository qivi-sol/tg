interface BombBlastOverlayProps {
  label: string;
  open: boolean;
}

export const BombBlastOverlay = ({ label, open }: BombBlastOverlayProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div className="bomb-blast-backdrop absolute inset-0" />
      <div className="bomb-shockwave absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-danger/30" />
      <div className="bomb-core absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-surface-950/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.34em] text-white shadow-glow">
        {label}
      </div>
    </div>
  );
};
