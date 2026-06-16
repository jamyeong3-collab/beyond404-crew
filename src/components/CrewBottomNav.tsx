"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, House, Truck } from "lucide-react";

const navItems = [
  { href: "/", icon: House, label: "홈", match: (pathname: string) => pathname === "/" },
  {
    href: "/calls",
    icon: ClipboardList,
    label: "요청",
    match: (pathname: string) => pathname === "/calls",
  },
  {
    href: "/active",
    icon: Truck,
    label: "진행",
    match: (pathname: string) => pathname === "/active",
  },
];

export function CrewBottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))] md:absolute md:bottom-4 md:px-5 md:pb-0">
      <nav className="pointer-events-auto grid w-full max-w-[392px] grid-cols-3 rounded-[26px] border border-white/80 bg-white/95 px-3 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.10)] backdrop-blur">
        {navItems.map((item) => (
          <NavItem key={item.href} active={item.match(pathname)} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </nav>
    </div>
  );
}

function NavItem({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: typeof House;
  label: string;
}) {
  return (
    <Link
      className={`mx-auto flex min-w-[82px] flex-col items-center gap-1 rounded-[14px] px-4 py-2 text-[11px] font-bold transition ${
        active ? "bg-lgred/10 text-lgred" : "text-slate-400"
      }`}
      href={href}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
