"use client";

import Link from "next/link";
import HoloCard from "@/components/HoloCard";

export default function HomePricingTeaser() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 items-start">
      {/* Free */}
      <HoloCard className="rounded-2xl h-full" glowColor="rgba(var(--color-primary), 0.25)">
        <div className="bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-5 text-center h-full">
          <h3 className="text-base font-bold font-headline mb-1">Free</h3>
          <div className="text-2xl font-extrabold font-headline mb-1">$0</div>
          <p className="text-[11px] text-on-surface-variant/60">10 submissions/mo &middot; 100 MB</p>
        </div>
      </HoloCard>

      {/* Starter */}
      <HoloCard className="rounded-2xl h-full" glowColor="rgba(var(--color-primary), 0.25)">
        <div className="bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-5 text-center h-full">
          <h3 className="text-base font-bold font-headline mb-1">Starter</h3>
          <div className="text-2xl font-extrabold font-headline mb-1">$39<span className="text-sm font-normal text-on-surface-variant">/mo</span></div>
          <p className="text-[11px] text-on-surface-variant/60">50 submissions/mo &middot; 1 GB</p>
        </div>
      </HoloCard>

      {/* Pro (featured) */}
      <HoloCard className="rounded-2xl h-full" featured glowColor="rgba(var(--color-primary), 0.5)">
        <div className="gradient-border rounded-2xl h-full">
          <div className="relative glass-panel noise-overlay rounded-2xl p-5 text-center">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <h3 className="text-base font-bold font-headline mb-1 text-primary">Pro</h3>
            <div className="text-2xl font-extrabold font-headline gradient-text mb-1">$99<span className="text-sm font-normal text-on-surface-variant">/mo</span></div>
            <p className="text-[11px] text-on-surface-variant/60">Unlimited &middot; 100 GB</p>
          </div>
        </div>
      </HoloCard>

      {/* Agency */}
      <HoloCard className="rounded-2xl h-full" glowColor="rgba(var(--color-primary), 0.25)">
        <div className="bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-5 text-center h-full">
          <h3 className="text-base font-bold font-headline mb-1">Agency</h3>
          <div className="text-2xl font-extrabold font-headline mb-1">$249<span className="text-sm font-normal text-on-surface-variant">/mo</span></div>
          <p className="text-[11px] text-on-surface-variant/60">Unlimited &middot; 500 GB</p>
        </div>
      </HoloCard>
    </div>
  );
}
