"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }
      router.push(data.user.role === "client" ? "/portal" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error while signing in");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      setInfo(
        data.demoResetToken
          ? `Reset token generated (dev preview): ${data.demoResetToken}`
          : data.message
      );
      if (data.demoResetToken) {
        setResetToken(data.demoResetToken);
        setMode("reset");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      setInfo("Password updated! You can now sign in.");
      setMode("login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f8ff] via-white to-[#dbeafe]/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h1 className="text-xl font-extrabold text-[#0b1f44]">
              {mode === "login"
                ? "Sign in to KROMA FLOW"
                : mode === "forgot"
                ? "Forgot Password"
                : "Set New Password"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              From Lead to Payment — Seamlessly.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}
          {info && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-[#1d6bff] break-all">
              {info}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Work Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@kromaxzon.com"
              />
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[#1d6bff] font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
                <Link href="/signup" className="text-slate-600 hover:text-[#0b1f44] font-medium">
                  Create organisation
                </Link>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Sign In
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <Input
                label="Account Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <Button type="submit" loading={loading} className="w-full">
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-xs text-slate-600 font-semibold hover:text-[#0b1f44] cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="Reset Token"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
              <Input
                label="New Password (min 8 chars)"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full">
                Update Password
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-[#dce7f8] space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Demo Workspace Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEmail("alex@kromaxzon.com");
                  setPassword("KromaFlow@2026");
                  setMode("login");
                }}
              >
                Owner Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail("client@apexretail.com");
                  setPassword("KromaFlow@2026");
                  setMode("login");
                }}
              >
                Client Portal Demo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
