import { Card } from "./Card";
import { formatCompactNumber } from "../../lib/format";

interface ResourceCardProps {
  accent: string;
  label: string;
  value: number;
}

export const ResourceCard = ({ accent, label, value }: ResourceCardProps) => {
  return (
    <Card className="rounded-[20px] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-white/[0.45]">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {label}
      </div>
      <div className="text-xl font-semibold text-white">{formatCompactNumber(value)}</div>
    </Card>
  );
};
