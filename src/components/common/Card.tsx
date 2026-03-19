import { cn } from "../../lib/cn";
import type { PropsWithChildren } from "react";

export const Card = ({
  children,
  className
}: PropsWithChildren<{ className?: string }>) => {
  return (
    <section className={cn("glass-card rounded-[24px] p-4", className)}>
      {children}
    </section>
  );
};
