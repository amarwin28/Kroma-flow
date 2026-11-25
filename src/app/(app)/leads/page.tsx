"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  ArrowRightLeft,
  Building2,
  Mail,
  Phone,
  Users,
  Trash2,
  Pencil,
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
import { LeadStatus, MockLead } from "@/data/mockLeads";
import { formatINR, formatIndianDate } from "@/data/format";

const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Converted",
  "Lost",
];

function statusTone(status: string) {
  if (status === "Converted") return "green";
  if (status === "Lost") return "red";
  if (status === "Negotiation" || status === "Proposal") return "amber";
  return "blue";
}

export default function LeadsPage() {
  const { state, addLead, updateLead, deleteLead, convertLeadToDeal } = useDemoData();
  const [tab, setTab] = useState<"leads" | "clients">("leads");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<MockLead | null>(null);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "Website",
    status: "New" as LeadStatus,
    priority: "Medium" as "Low" | "Medium" | "High",
    assignedTo: state.teamMembers[2]?.name || "Rohan Verma",
    followUpDate: "2026-12-01",
    estimatedValue: "150000",
    notes: "",
  });

  const filteredLeads = state.leads.filter((l) => {
    const query = q.trim().toLowerCase();
    const matchesQ =
      !query ||
      l.name.toLowerCase().includes(query) ||
      l.company.toLowerCase().includes(query) ||
      l.email.toLowerCase().includes(query) ||
      l.leadCode.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || l.status === statusFilter;
    const matchesPriority = !priorityFilter || l.priority === priorityFilter;
    return matchesQ && matchesStatus && matchesPriority;
  });

  const filteredClients = state.clients.filter((c) => {
    const query = q.trim().toLowerCase();
    return (
      !query ||
      c.company.toLowerCase().includes(query) ||
      c.contactPerson.toLowerCase().includes(query) ||
      c.industry.toLowerCase().includes(query)
    );
  });

  function openCreate() {
    setSelectedLead(null);
    setForm({
      name: "",
      email: "",
      phone: "+91 ",
      company: "",
      source: "Website",
      status: "New",
      priority: "Medium",
      assignedTo: state.teamMembers[2]?.name || "Rohan Verma",
      followUpDate: "2026-12-01",
      estimatedValue: "150000",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(lead: MockLead) {
    setSelectedLead(lead);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      assignedTo: lead.assignedTo,
      followUpDate: lead.followUpDate,
      estimatedValue: String(lead.estimatedValue),
      notes: lead.notes,
    });
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      source: form.source,
      status: form.status,
      priority: form.priority,
      assignedTo: form.assignedTo,
      followUpDate: form.followUpDate,
      estimatedValue: Number(form.estimatedValue || 0),
      notes: form.notes,
    };
    if (selectedLead) {
      updateLead(selectedLead.id, payload);
      setToast(`Updated lead ${payload.name}`);
    } else {
      addLead(payload);
      setToast(`Added lead ${payload.name}`);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              CRM, Leads & Clients
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage {state.leads.length} sample leads and {state.clients.length} client profiles locally.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#dce7f8] bg-white p-1">
            <button
              onClick={() => setTab("leads")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                tab === "leads" ? "bg-[#1d6bff] text-white" : "text-slate-600"
              }`}
            >
              Leads ({state.leads.length})
            </button>
            <button
              onClick={() => setTab("clients")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                tab === "clients" ? "bg-[#1d6bff] text-white" : "text-slate-600"
              }`}
            >
              Clients ({state.clients.length})
            </button>
          </div>
          {tab === "leads" && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Lead
            </Button>
          )}
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1d6bff] flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast("")} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              tab === "leads"
                ? "Search leads by name, company, ID, or email..."
                : "Search clients by company, contact, or industry..."
            }
            className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-[#dce7f8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30"
          />
        </div>
        {tab === "leads" && (
          <>
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-44"
            >
              <option value="">All Statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="sm:w-36"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </>
        )}
      </Card>

      {tab === "leads" ? (
        filteredLeads.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No matching leads"
            description="Adjust your search or add a new lead to the demo CRM."
            action={<Button onClick={openCreate}>Add Lead</Button>}
          />
        ) : (
          <>
            {/* Desktop Responsive Table */}
            <Card className="hidden lg:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f4f8ff] border-b border-[#dce7f8] text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Company & Source</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Owner & Follow-up</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eff5ff]">
                    {filteredLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-[#f4f8ff]/60">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#0b1f44]">
                            {l.name}{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              {l.leadCode}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">{l.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#0b1f44]">{l.company}</p>
                          <p className="text-xs text-slate-500">{l.source}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              l.priority === "High"
                                ? "red"
                                : l.priority === "Medium"
                                ? "amber"
                                : "slate"
                            }
                          >
                            {l.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0b1f44]">
                          {formatINR(l.estimatedValue)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p className="font-semibold text-[#0b1f44]">{l.assignedTo}</p>
                          <p>{formatIndianDate(l.followUpDate)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {l.status !== "Converted" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  convertLeadToDeal(l.id);
                                  setToast(`Converted ${l.name} to Deal!`);
                                }}
                                title="Convert to Deal"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                deleteLead(l.id);
                                setToast(`Deleted lead ${l.name}`);
                              }}
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile & Tablet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
              {filteredLeads.map((l) => (
                <Card key={l.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-[#1d6bff]">{l.leadCode}</p>
                      <h3 className="font-bold text-[#0b1f44]">{l.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {l.company} · {l.source}
                      </p>
                    </div>
                    <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {l.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {l.phone}
                    </p>
                    <p>
                      Assigned: <strong>{l.assignedTo}</strong> · Follow-up:{" "}
                      {formatIndianDate(l.followUpDate)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#eff5ff]">
                    <span className="text-sm font-extrabold text-[#1d6bff]">
                      {formatINR(l.estimatedValue)}
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                        Edit
                      </Button>
                      {l.status !== "Converted" && (
                        <Button size="sm" onClick={() => convertLeadToDeal(l.id)}>
                          Convert
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => deleteLead(l.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )
      ) : (
        /* Clients Directory Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((c) => (
            <Card key={c.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#0b1f44]">{c.company}</h3>
                  <p className="text-xs text-slate-500">
                    {c.industry} · {c.city}
                  </p>
                </div>
                <Badge tone={c.status === "Active" || c.status === "Retainer" ? "green" : "blue"}>
                  {c.status}
                </Badge>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Contact: <strong className="text-[#0b1f44]">{c.contactPerson}</strong>
                </p>
                <p className="truncate">{c.email}</p>
                <p>{c.phone}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#eff5ff] text-xs">
                <span className="text-slate-500">
                  Active Projects: <strong className="text-[#0b1f44]">{c.activeProjects}</strong>
                </span>
                <span className="font-extrabold text-[#1d6bff]">
                  {formatINR(c.totalRevenue)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedLead ? `Edit Lead (${selectedLead.leadCode})` : "Add New Lead"}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Company"
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as "Low" | "Medium" | "High" })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
            <Input
              label="Est. Value (₹)"
              type="number"
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
            <Select
              label="Assigned Employee"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              {state.teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Input
              label="Follow-up Date"
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
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
            <Button type="submit">Save Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
