import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

interface StatusBannerProps {
  className?: string;
  title?: string;
  tone?: "info" | "success" | "danger";
}

const toneMap: Record<NonNullable<StatusBannerProps["tone"]>, string> = {
  info: "border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan",
  success: "border-accent-green/20 bg-accent-green/10 text-accent-green",
  danger: "border-accent-danger/20 bg-accent-danger/10 text-accent-danger"
};

export const StatusBanner = ({
  children,
  className,
  title,
  tone = "info"
}: PropsWithChildren<StatusBannerProps>) => {
  return (
    <div className={cn("rounded-[18px] border px-4 py-3", toneMap[tone], className)}>
      {title ? (
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
          {title}
        </div>
      ) : null}
      <div className="whitespace-pre-line text-sm leading-6 text-white">{children}</div>
    </div>
  );
};
