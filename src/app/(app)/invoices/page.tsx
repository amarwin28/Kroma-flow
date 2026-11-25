"use client";

import React, { useState } from "react";
import { Plus, Receipt, CreditCard, Printer, Search } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  StatCard,
} from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { MockInvoice } from "@/data/mockInvoices";
import { formatINR, formatIndianDate } from "@/data/format";

export default function InvoicesPage() {
  const { state, addInvoice, updateInvoiceStatus, recordInvoicePayment } = useDemoData();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<MockInvoice | null>(null);
  const [printInv, setPrintInv] = useState<MockInvoice | null>(null);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    clientName: state.clients[0]?.contactPerson || "Priya Sharma",
    clientEmail: state.clients[0]?.email || "",
    clientCompany: state.clients[0]?.company || "TechCorp Solutions",
    description: "Consulting & SaaS Delivery",
    amount: "75000",
    taxPercent: "18",
    dueDate: "2026-12-15",
  });

  const [payAmount, setPayAmount] = useState("");

  const filtered = state.invoices.filter((inv) => {
    const query = q.trim().toLowerCase();
    const matchesQ =
      !query ||
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.clientCompany.toLowerCase().includes(query) ||
      inv.clientName.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const totalBilled = state.invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = state.invoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = Math.max(0, totalBilled - totalCollected);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    addInvoice({
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientCompany: form.clientCompany,
      description: form.description,
      amount: Number(form.amount || 0),
      taxPercent: Number(form.taxPercent || 18),
      dueDate: form.dueDate,
    });
    setCreateOpen(false);
    setToast("New demo invoice issued.");
  }

  function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payInvoice) return;
    recordInvoicePayment(payInvoice.id, Number(payAmount || 0));
    setToast(`Recorded payment for ${payInvoice.invoiceNumber}`);
    setPayInvoice(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Invoices & Payments
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {state.invoices.length} invoices in Indian Rupees (₹) with interactive status updates.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Issue Invoice
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Billed (Demo)"
          value={formatINR(totalBilled)}
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          label="Collected"
          value={formatINR(totalCollected)}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          label="Outstanding"
          value={formatINR(outstanding)}
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search invoices by number (e.g. INV-1043) or client..."
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
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Overdue">Overdue</option>
        </Select>
      </Card>

      <div className="space-y-3">
        {filtered.map((inv) => (
          <Card
            key={inv.id}
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-[#0b1f44]">
                  {inv.invoiceNumber}
                </span>
                <Badge
                  tone={
                    inv.status === "Paid"
                      ? "green"
                      : inv.status === "Overdue"
                      ? "red"
                      : inv.status === "Partial"
                      ? "blue"
                      : "amber"
                  }
                >
                  {inv.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                <strong>{inv.clientCompany}</strong> ({inv.clientName}) · Issued{" "}
                {formatIndianDate(inv.issuedAt)} · Due {formatIndianDate(inv.dueDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-left md:text-right mr-1">
                <p className="text-sm font-extrabold text-[#1d6bff]">{formatINR(inv.total)}</p>
                <p className="text-[11px] text-slate-400">
                  Paid: {formatINR(inv.amountPaid)}
                </p>
              </div>

              <select
                aria-label={`Change status for ${inv.invoiceNumber}`}
                value={inv.status}
                onChange={(e) => {
                  const s = e.target.value as MockInvoice["status"];
                  updateInvoiceStatus(inv.id, s);
                  setToast(`${inv.invoiceNumber} marked as ${s}`);
                }}
                className="text-xs px-2.5 py-2 rounded-xl border border-[#dce7f8] bg-[#f4f8ff] font-semibold text-[#0b1f44] cursor-pointer"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
              </select>

              {inv.status !== "Paid" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPayInvoice(inv);
                    setPayAmount(String(inv.total - inv.amountPaid));
                  }}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setPrintInv(inv)}>
                <Printer className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Issue Invoice (INR)">
        <form onSubmit={handleCreate} className="space-y-3">
          <Select
            label="Client"
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
          <Input
            label="Line Item Description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Subtotal (₹)"
              type="number"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Input
              label="GST (%)"
              type="number"
              value={form.taxPercent}
              onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Issue Invoice</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(payInvoice)}
        onClose={() => setPayInvoice(null)}
        title={`Record Demo Payment · ${payInvoice?.invoiceNumber || ""}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-3">
          <Input
            label="Payment Amount (₹)"
            type="number"
            required
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayInvoice(null)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Payment (Demo)</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(printInv)}
        onClose={() => setPrintInv(null)}
        title={`Invoice Preview · ${printInv?.invoiceNumber || ""}`}
      >
        {printInv && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-[#dce7f8] pb-3">
              <div>
                <p className="font-extrabold text-sm text-[#0b1f44]">KROMAXZON TECHNOLOGIES</p>
                <p className="text-slate-500">DEMO TAX INVOICE (INR)</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#1d6bff]">{printInv.invoiceNumber}</p>
                <p>Due: {formatIndianDate(printInv.dueDate)}</p>
              </div>
            </div>
            <p>
              Billed To: <strong>{printInv.clientCompany}</strong> ({printInv.clientName})
            </p>
            <div className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] space-y-1">
              {printInv.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.description}</span>
                  <strong>{formatINR(it.unitPrice)}</strong>
                </div>
              ))}
              <div className="border-t border-[#dce7f8] pt-1 flex justify-between font-extrabold text-[#0b1f44]">
                <span>Total (incl. {printInv.taxPercent}% GST)</span>
                <span className="text-[#1d6bff]">{formatINR(printInv.total)}</span>
              </div>
            </div>
            <div className="flex justify-end">
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
