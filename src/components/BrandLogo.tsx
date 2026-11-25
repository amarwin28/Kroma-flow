"use client";

import React from "react";

interface BrandLogoProps {
  logoUrl?: string;
  orgName?: string;
  variant?: "light" | "dark";
  compact?: boolean;
}

export function BrandLogo({
  logoUrl = "/logo-kmx.jpg",
  orgName = "KROMAXZON TECHNOLOGIES",
  variant = "dark",
  compact = false,
}: BrandLogoProps) {
  const isCustom = Boolean(logoUrl && logoUrl !== "/brand/kromaxzon-logo.svg");

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {isCustom ? (
        <img
          src={logoUrl || "/logo-kmx.jpg"}
          alt={orgName}
          className="h-9 w-9 rounded-xl object-cover bg-white shrink-0 border border-[#dce7f8] shadow-xs"
        />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1d6bff] to-[#0b1f44] flex items-center justify-center shrink-0 shadow-sm border border-white/15">
          <svg
            viewBox="0 0 32 32"
            className="w-5 h-5"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 7V25M9 16L20 7M14 13L23 25"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="8" r="2.5" fill="#60A5FA" />
          </svg>
        </div>
      )}
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p
            className={`text-[10px] font-bold tracking-[0.14em] uppercase truncate ${
              variant === "light" ? "text-blue-200" : "text-slate-500"
            }`}
          >
            {orgName}
          </p>
          <p
            className={`text-sm font-extrabold tracking-tight truncate ${
              variant === "light" ? "text-white" : "text-[#0b1f44]"
            }`}
          >
            KROMA FLOW
          </p>
        </div>
      )}
    </div>
  );
}
