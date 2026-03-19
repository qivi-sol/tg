import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

const navItems = [
  { to: "/", label: "Home", short: "HM" },
  { to: "/raid", label: "Raid", short: "RD" },
  { to: "/referrals", label: "Refs", short: "RF" },
  { to: "/leaderboard", label: "Ranks", short: "LB" },
  { to: "/shop", label: "Shop", short: "SP" }
];

export const BottomNav = () => {
  return (
    <nav className="glass-card fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-24px)] max-w-[460px] -translate-x-1/2 items-center justify-between rounded-[24px] px-2 py-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-white/[0.45] transition",
              isActive && "bg-white/[0.08] text-white"
            )
          }
        >
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-[0.18em]">
            {item.short}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
