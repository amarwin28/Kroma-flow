"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, FileText, FolderKanban, Receipt, MessageSquare } from "lucide-react";
import { Badge, Button, Card, Textarea } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { formatINR, formatIndianDate } from "@/data/format";

export default function ClientPortalPage() {
  const { state, updateQuotationStatus } = useDemoData();
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState([
    {
      id: "fb-1",
      client: "TechCorp Solutions",
      comment: "Very responsive team — the new UI kit looks super clean on mobile.",
      rating: 5,
      createdAt: "2026-11-22",
    },
    {
      id: "fb-2",
      client: "Horizon FinTech",
      comment: "Smooth compliance portal sign-off and timely milestone delivery.",
      rating: 5,
      createdAt: "2026-11-18",
    },
  ]);
  const [toast, setToast] = useState("");

  function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setFeedback([
      {
        id: `fb-${Date.now()}`,
        client: "Demo Client",
        comment: comment.trim(),
        rating,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...feedback,
    ]);
    setComment("");
    setToast("Feedback submitted (Demo) — thank you!");
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0b1f44] to-[#1d6bff] text-white">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200">
            Client Portal · KROMAXZON TECHNOLOGIES
          </p>
          <Badge tone="amber">DEMO DATA</Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
          Shared Client Workspace
        </h1>
        <p className="text-xs sm:text-sm text-blue-100 mt-1">
          Approve quotations, track active project progress, and review invoices in INR.
        </p>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1d6bff]">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1d6bff]" /> Quotations for Review
          </h2>
          <div className="space-y-2.5">
            {state.quotations.slice(0, 5).map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-[#0b1f44]">
                    {q.quoteNumber} · {q.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {q.clientCompany} · {formatINR(q.total)} · Expires{" "}
                    {formatIndianDate(q.expiryDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    tone={
                      q.status === "Approved"
                        ? "green"
                        : q.status === "Rejected"
                        ? "red"
                        : "blue"
                    }
                  >
                    {q.status}
                  </Badge>
                  {q.status === "Sent" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateQuotationStatus(q.id, "Approved");
                          setToast(`${q.quoteNumber} approved!`);
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updateQuotationStatus(q.id, "Rejected");
                          setToast(`${q.quoteNumber} rejected.`);
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-[#1d6bff]" /> Active Client Projects
          </h2>
          <div className="space-y-3">
            {state.projects.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[#0b1f44]">
                    {p.name} ({p.client})
                  </strong>
                  <Badge tone={p.status === "Completed" ? "green" : "blue"}>{p.progress}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1d6bff]"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#1d6bff]" /> Recent Invoices
          </h2>
          <div className="divide-y divide-[#eff5ff]">
            {state.invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#0b1f44]">
                    {inv.invoiceNumber} — {inv.clientCompany}
                  </p>
                  <p className="text-slate-500">Due {formatIndianDate(inv.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1d6bff]">{formatINR(inv.total)}</p>
                  <Badge tone={inv.status === "Paid" ? "green" : "amber"}>{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0b1f44] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1d6bff]" /> Client Feedback
          </h2>
          <form onSubmit={submitFeedback} className="space-y-2.5">
            <Textarea
              label="Share feedback (Demo)"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#0b1f44]">Rating:</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#dce7f8]"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} ★
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm">
                Submit Feedback
              </Button>
            </div>
          </form>
          <div className="space-y-2 pt-2">
            {feedback.map((f) => (
              <div key={f.id} className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] text-xs">
                <div className="flex justify-between font-bold text-[#0b1f44]">
                  <span>{f.client}</span>
                  <span className="text-amber-600">{f.rating} ★</span>
                </div>
                <p className="text-slate-600 mt-1">{f.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
