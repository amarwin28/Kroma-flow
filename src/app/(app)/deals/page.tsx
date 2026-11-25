"use client";

import React, { useState } from "react";
import { Plus, Briefcase, Calendar, User } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, Textarea } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { DealStage, MockDeal } from "@/data/mockDeals";
import { formatINR, formatIndianDate } from "@/data/format";

const STAGES: DealStage[] = [
  "Discovery",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

export default function DealsPage() {
  const { state, addDeal, moveDealStage } = useDemoData();
  const [mobileStage, setMobileStage] = useState<DealStage>("Discovery");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: state.clients[0]?.company || "TechCorp Solutions",
    contactName: "",
    contactEmail: "",
    value: "180000",
    stage: "Discovery" as DealStage,
    probability: "25",
    expectedCloseDate: "2026-12-20",
    assignedTo: state.teamMembers[2]?.name || "Rohan Verma",
    notes: "",
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    addDeal({
      title: form.title,
      company: form.company,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      value: Number(form.value || 0),
      stage: form.stage,
      probability: Number(form.probability || 25),
      expectedCloseDate: form.expectedCloseDate,
      assignedTo: form.assignedTo,
      notes: form.notes,
    });
    setModalOpen(false);
    setForm({
      ...form,
      title: "",
      contactName: "",
      contactEmail: "",
      notes: "",
    });
  }

  const renderDealCard = (deal: MockDeal) => (
    <Card key={deal.id} className="p-3.5 space-y-2.5 bg-white">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-bold text-[#0b1f44] leading-snug">{deal.title}</h3>
        <Badge tone={deal.stage === "Won" ? "green" : deal.stage === "Lost" ? "red" : "blue"}>
          {deal.probability}%
        </Badge>
      </div>
      <p className="text-[11px] font-medium text-slate-600">{deal.company}</p>
      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        <User className="w-3 h-3" /> {deal.assignedTo}
      </p>
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="font-extrabold text-[#1d6bff]">{formatINR(deal.value)}</span>
        {deal.expectedCloseDate && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formatIndianDate(deal.expectedCloseDate)}
          </span>
        )}
      </div>
      <select
        aria-label={`Move ${deal.title} stage`}
        value={deal.stage}
        onChange={(e) => moveDealStage(deal.id, e.target.value as DealStage)}
        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#dce7f8] bg-[#f4f8ff] text-[#0b1f44] font-semibold cursor-pointer"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            Stage: {s}
          </option>
        ))}
      </select>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Deals Pipeline
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Interactive Kanban pipeline ({state.deals.length} deals) — move deals between stages.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Deal
        </Button>
      </div>

      {/* Mobile Stage Switcher */}
      <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1">
        {STAGES.map((s) => {
          const count = state.deals.filter((d) => d.stage === s).length;
          return (
            <button
              key={s}
              onClick={() => setMobileStage(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                mobileStage === s
                  ? "bg-[#1d6bff] text-white"
                  : "bg-white border border-[#dce7f8] text-[#0b1f44]"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Mobile Stage View */}
      <div className="lg:hidden space-y-3">
        {state.deals.filter((d) => d.stage === mobileStage).map(renderDealCard)}
      </div>

      {/* Desktop Kanban Columns */}
      <div className="hidden lg:grid grid-cols-6 gap-3 items-start">
        {STAGES.map((stage) => {
          const items = state.deals.filter((d) => d.stage === stage);
          const sum = items.reduce((s, d) => s + d.value, 0);
          return (
            <div
              key={stage}
              className="rounded-2xl bg-[#eff5ff]/70 border border-[#dce7f8] p-3 space-y-3 min-h-[420px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0b1f44]">{stage}</span>
                <Badge tone="slate">{items.length}</Badge>
              </div>
              <p className="text-[11px] font-bold text-[#1d6bff]">{formatINR(sum)}</p>
              <div className="space-y-2.5">{items.map(renderDealCard)}</div>
              {items.length === 0 && (
                <div className="py-8 text-center text-[11px] text-slate-400">
                  <Briefcase className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  No deals
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Deal">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Deal Name"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Client Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            >
              {state.clients.map((c) => (
                <option key={c.id} value={c.company}>
                  {c.company}
                </option>
              ))}
            </Select>
            <Input
              label="Deal Value (₹)"
              type="number"
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
            <Select
              label="Assigned Salesperson"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              {state.teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Stage"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Expected Close Date"
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
            />
          </div>
          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Deal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
