"use client";

import React from "react";
import { Loader2, X } from "lucide-react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#dce7f8] shadow-[0_2px_12px_-4px_rgba(11,31,68,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const variants = {
    primary:
      "bg-[#1d6bff] hover:bg-[#1558d6] text-white shadow-sm shadow-blue-600/20 focus-visible:ring-2 focus-visible:ring-[#1d6bff] focus-visible:ring-offset-2",
    secondary:
      "bg-[#eff5ff] hover:bg-[#dbeafe] text-[#0b1f44] border border-[#dce7f8]",
    outline:
      "bg-white hover:bg-[#f4f8ff] text-[#0b1f44] border border-[#dce7f8]",
    ghost: "bg-transparent hover:bg-[#eff5ff] text-[#0b1f44]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
  };
  const sizes = {
    sm: "min-h-[36px] px-3 py-1.5 text-xs",
    md: "min-h-[42px] px-4 py-2 text-sm",
    lg: "min-h-[48px] px-5 py-2.5 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "navy";
}) {
  const tones = {
    blue: "bg-blue-50 text-[#1d6bff] border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    navy: "bg-[#0b1f44] text-white border-[#0b1f44]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Input({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-[#0b1f44]">
          {label}
        </label>
      )}
      <input
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border bg-white text-sm text-[#0b1f44] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30 focus:border-[#1d6bff] transition ${
          error ? "border-rose-400" : "border-[#dce7f8]"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-[#0b1f44]">
          {label}
        </label>
      )}
      <select
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#dce7f8] bg-white text-sm text-[#0b1f44] focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30 focus:border-[#1d6bff] ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-[#0b1f44]">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3.5 py-2.5 rounded-xl border border-[#dce7f8] bg-white text-sm text-[#0b1f44] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30 focus:border-[#1d6bff] ${className}`}
        {...props}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#081633]/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-t-2xl sm:rounded-2xl border border-[#dce7f8] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dce7f8] bg-[#f4f8ff]/60">
          <h2 className="text-base font-bold text-[#0b1f44]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#dce7f8]/60 text-slate-600 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-[#1d6bff]" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-[#dce7f8] bg-[#f4f8ff]/50">
      <div className="w-12 h-12 rounded-2xl bg-[#eff5ff] text-[#1d6bff] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-[#0b1f44]">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5 hover:border-[#1d6bff]/40 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#0b1f44] mt-1 truncate">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1 truncate">{subtext}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eff5ff] to-[#dbeafe] text-[#1d6bff] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}
