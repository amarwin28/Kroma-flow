"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Button, Card, Input } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [joinMode, setJoinMode] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          organisationName: joinMode ? undefined : organisationName,
          inviteToken: joinMode ? inviteToken : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account");
        return;
      }
      if (data.verificationTokenPreview) {
        setVerifyToken(data.verificationTokenPreview);
        setStep("verify");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error during signup");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Verification failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
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
          {step === "signup" ? (
            <>
              <div>
                <h1 className="text-xl font-extrabold text-[#0b1f44]">
                  {joinMode ? "Join an Organisation" : "Create Your Workspace"}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Start managing leads, projects, and invoices on KROMA FLOW.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#f4f8ff] border border-[#dce7f8]">
                <button
                  type="button"
                  onClick={() => setJoinMode(false)}
                  className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    !joinMode ? "bg-white text-[#1d6bff] shadow-xs" : "text-slate-600"
                  }`}
                >
                  New Organisation
                </button>
                <button
                  type="button"
                  onClick={() => setJoinMode(true)}
                  className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    joinMode ? "bg-white text-[#1d6bff] shadow-xs" : "text-slate-600"
                  }`}
                >
                  Have Invite Token
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-3.5">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Taylor"
                />
                <Input
                  label="Work Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                />
                <Input
                  label="Password (min 8 chars)"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {!joinMode ? (
                  <Input
                    label="Organisation Name"
                    required
                    value={organisationName}
                    onChange={(e) => setOrganisationName(e.target.value)}
                    placeholder="Acme Enterprise Ltd."
                  />
                ) : (
                  <Input
                    label="Invitation Token"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="kfx_..."
                  />
                )}
                <Button type="submit" loading={loading} className="w-full">
                  {joinMode ? "Join Workspace" : "Create Organisation"}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1d6bff] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <h1 className="text-xl font-extrabold text-[#0b1f44]">Verify Your Email</h1>
              <p className="text-xs text-slate-600">
                We generated a verification token for your account. Confirm below to activate your workspace.
              </p>
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}
              <Input
                label="Verification Token"
                required
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" loading={loading} className="flex-1">
                  Verify & Continue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
