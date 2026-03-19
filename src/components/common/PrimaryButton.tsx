import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export const PrimaryButton = ({
  children,
  className,
  disabled,
  variant = "primary",
  ...props
}: PropsWithChildren<PrimaryButtonProps>) => {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-accent-cyan to-accent-gold text-surface-950 shadow-glow active:scale-[0.98]",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white active:scale-[0.98]",
        variant === "ghost" && "bg-transparent text-white/75",
        variant === "danger" &&
          "bg-gradient-to-r from-accent-danger to-red-400 text-white active:scale-[0.98]",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
