"use client";

import type { ReactNode } from "react";

export function CrewPhoneShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] justify-center bg-white md:bg-[#202124] md:px-3 md:py-8">
      <section className="relative flex min-h-[100dvh] w-full flex-col bg-white md:min-h-[874px] md:w-[min(100%,424px)] md:overflow-hidden md:rounded-[28px] md:shadow-phone">
        {children}
      </section>
    </main>
  );
}
