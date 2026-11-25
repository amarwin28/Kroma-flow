"use client";

import React, { useState } from "react";
import {
  Plus,
  FileText,
  Printer,
  FolderPlus,
  Receipt,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { MockQuotation, MockQuoteItem } from "@/data/mockQuotations";
import { formatINR, formatIndianDate } from "@/data/format";

export default function QuotationsPage() {
  const {
    state,
    addQuotation,
    updateQuotationStatus,
    convertQuotationToProject,
    convertQuotationToInvoice,
  } = useDemoData();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [printQuote, setPrintQuote] = useState<MockQuotation | null>(null);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    title: "",
    clientName: state.clients[0]?.contactPerson || "Priya Sharma",
    clientEmail: state.clients[0]?.email || "priya.sharma@techcorpsolutions.in",
    clientCompany: state.clients[0]?.company || "TechCorp Solutions",
    discountPercent: "5",
    taxPercent: "18",
    expiryDate: "2026-12-25",
    notes: "",
  });
  const [items, setItems] = useState<MockQuoteItem[]>([
    { description: "Platform Implementation & Setup", quantity: 1, unitPrice: 120000 },
  ]);

  const filtered = state.quotations.filter((item) => {
    const query = q.trim().toLowerCase();
    const matchesQ =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.quoteNumber.toLowerCase().includes(query) ||
      item.clientCompany.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const total = Math.round(
    subtotal *
      (1 - Number(form.discountPercent || 0) / 100) *
      (1 + Number(form.taxPercent || 0) / 100)
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    addQuotation({
      title: form.title,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientCompany: form.clientCompany,
      items,
      discountPercent: Number(form.discountPercent || 0),
      taxPercent: Number(form.taxPercent || 18),
      expiryDate: form.expiryDate,
      notes: form.notes,
    });
    setModalOpen(false);
    setForm({ ...form, title: "", notes: "" });
    setToast("Quotation created & saved locally.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Quotations & Proposals
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Create quotes in INR (GST & discounts) and convert to projects or invoices.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Quotation
        </Button>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1d6bff] flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast("")} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search quotations by number, title, or client..."
            className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-[#dce7f8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30"
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No matching quotations"
          description="Create a quotation or clear your filters."
          action={<Button onClick={() => setModalOpen(true)}>Create Quotation</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((qt) => (
            <Card key={qt.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#1d6bff]">{qt.quoteNumber}</p>
                  <h2 className="text-base font-bold text-[#0b1f44]">{qt.title}</h2>
                  <p className="text-xs text-slate-500">
                    {qt.clientCompany} · {qt.clientName}
                  </p>
                </div>
                <Badge
                  tone={
                    qt.status === "Approved"
                      ? "green"
                      : qt.status === "Rejected"
                      ? "red"
                      : qt.status === "Sent"
                      ? "blue"
                      : "slate"
                  }
                >
                  {qt.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                <span>
                  Issued: {formatIndianDate(qt.issueDate)} · Expires:{" "}
                  {formatIndianDate(qt.expiryDate)}
                </span>
                <span className="text-base font-extrabold text-[#0b1f44]">
                  {formatINR(qt.total)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#eff5ff]">
                {qt.status !== "Approved" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      updateQuotationStatus(qt.id, "Approved");
                      setToast(`${qt.quoteNumber} marked as Approved`);
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    convertQuotationToProject(qt.id);
                    setToast(`Converted ${qt.quoteNumber} to Project!`);
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5" /> To Project
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    convertQuotationToInvoice(qt.id);
                    setToast(`Converted ${qt.quoteNumber} to Invoice!`);
                  }}
                >
                  <Receipt className="w-3.5 h-3.5" /> To Invoice
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPrintQuote(qt)}>
                  <Printer className="w-3.5 h-3.5" /> Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Quotation">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Quotation Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Select
            label="Select Client"
            value={form.clientCompany}
            onChange={(e) => {
              const c = state.clients.find((x) => x.company === e.target.value);
              setForm({
                ...form,
                clientCompany: e.target.value,
                clientName: c?.contactPerson || "",
                clientEmail: c?.email || "",
              });
            }}
          >
            {state.clients.map((c) => (
              <option key={c.id} value={c.company}>
                {c.company} ({c.contactPerson})
              </option>
            ))}
          </Select>

          <div className="space-y-2">
            <p className="text-xs font-bold text-[#0b1f44]">Line Items (INR)</p>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input
                  className="col-span-6 px-3 py-2 rounded-xl border border-[#dce7f8] text-xs"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx].description = e.target.value;
                    setItems(copy);
                  }}
                />
                <input
                  type="number"
                  className="col-span-2 px-2 py-2 rounded-xl border border-[#dce7f8] text-xs"
                  value={item.quantity}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx].quantity = Number(e.target.value);
                    setItems(copy);
                  }}
                />
                <input
                  type="number"
                  className="col-span-4 px-2 py-2 rounded-xl border border-[#dce7f8] text-xs"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx].unitPrice = Number(e.target.value);
                    setItems(copy);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setItems([...items, { description: "Additional Service", quantity: 1, unitPrice: 25000 }])
              }
            >
              + Add Line Item
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Discount (%)"
              type="number"
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            />
            <Input
              label="GST / Tax (%)"
              type="number"
              value={form.taxPercent}
              onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>

          <div className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] flex justify-between items-center text-sm font-bold text-[#0b1f44]">
            <span>Estimated Total (incl. GST)</span>
            <span className="text-[#1d6bff]">{formatINR(total)}</span>
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
            <Button type="submit">Create Quotation</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(printQuote)}
        onClose={() => setPrintQuote(null)}
        title={`Quotation Preview · ${printQuote?.quoteNumber || ""}`}
      >
        {printQuote && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-[#dce7f8] pb-3">
              <div>
                <p className="font-extrabold text-sm text-[#0b1f44]">KROMAXZON TECHNOLOGIES</p>
                <p className="text-slate-500">KROMA FLOW · DEMO QUOTATION</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#1d6bff]">{printQuote.quoteNumber}</p>
                <p>Expires: {formatIndianDate(printQuote.expiryDate)}</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-[#0b1f44]">Prepared For:</p>
              <p>
                {printQuote.clientName} — {printQuote.clientCompany}
              </p>
              <p className="text-slate-500">{printQuote.clientEmail}</p>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#dce7f8] text-left text-slate-500">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {printQuote.items.map((it, i) => (
                  <tr key={i} className="border-b border-[#eff5ff]">
                    <td className="py-2 font-medium text-[#0b1f44]">{it.description}</td>
                    <td className="py-2 text-right">{it.quantity}</td>
                    <td className="py-2 text-right">{formatINR(it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 text-right">
              <p>Subtotal: {formatINR(printQuote.subtotal)}</p>
              <p>Discount: {printQuote.discountPercent}%</p>
              <p>GST / Tax: {printQuote.taxPercent}%</p>
              <p className="text-base font-extrabold text-[#1d6bff]">
                Total: {formatINR(printQuote.total)}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
