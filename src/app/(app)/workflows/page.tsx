"use client";

import React, { useState } from "react";
import { Plus, Workflow as WfIcon, Play, ArrowRight } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select } from "@/components/ui";

interface DemoWorkflow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  actionSummary: string;
  enabled: boolean;
  runCount: number;
}

const INITIAL_WORKFLOWS: DemoWorkflow[] = [
  {
    id: "wf-1",
    name: "High-Priority Lead Instant Alert",
    description: "Notifies sales manager when a lead ≥ ₹2,00,000 is created.",
    triggerType: "lead.created",
    actionSummary: "Send notification + assign follow-up reminder",
    enabled: true,
    runCount: 42,
  },
  {
    id: "wf-2",
    name: "Quotation Approved → Project Kickoff",
    description: "Automatically creates a Planning project when a client approves a quote.",
    triggerType: "quotation.approved",
    actionSummary: "Create Project + notify Delivery PM",
    enabled: true,
    runCount: 19,
  },
  {
    id: "wf-3",
    name: "Invoice Overdue Gentle Reminder",
    description: "Triggers a follow-up reminder 3 days after invoice due date.",
    triggerType: "invoice.overdue",
    actionSummary: "Create Calendar Reminder + notify Accountant",
    enabled: true,
    runCount: 14,
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<DemoWorkflow[]>(INITIAL_WORKFLOWS);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("lead.created");
  const [toast, setToast] = useState("");

  function toggleEnabled(id: string) {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  }

  function runDemo(wf: DemoWorkflow) {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wf.id ? { ...w, runCount: w.runCount + 1 } : w))
    );
    setToast(`Simulated execution of "${wf.name}" completed.`);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setWorkflows([
      {
        id: `wf-${Date.now()}`,
        name,
        description,
        triggerType,
        actionSummary: "Send workspace notification",
        enabled: true,
        runCount: 0,
      },
      ...workflows,
    ]);
    setModalOpen(false);
    setName("");
    setDescription("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Workflow Automations
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Simulated trigger-action automations across CRM, quotations, and invoicing.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Automation
        </Button>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1d6bff]">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <Card key={wf.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <WfIcon className="w-4 h-4 text-[#1d6bff]" />
                <h2 className="text-sm font-bold text-[#0b1f44]">{wf.name}</h2>
              </div>
              <Badge tone={wf.enabled ? "green" : "slate"}>
                {wf.enabled ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">{wf.description}</p>
            <div className="p-2.5 rounded-xl bg-[#f4f8ff] border border-[#dce7f8] text-xs flex items-center gap-2 text-[#0b1f44]">
              <span className="font-mono font-semibold text-[#1d6bff]">{wf.triggerType}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span>{wf.actionSummary}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">{wf.runCount} simulated runs</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleEnabled(wf.id)}>
                  {wf.enabled ? "Pause" : "Enable"}
                </Button>
                <Button size="sm" onClick={() => runDemo(wf)}>
                  <Play className="w-3.5 h-3.5" /> Test Run
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Automation">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Automation Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Select label="Trigger" value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
            <option value="lead.created">lead.created</option>
            <option value="deal.won">deal.won</option>
            <option value="quotation.approved">quotation.approved</option>
            <option value="invoice.overdue">invoice.overdue</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
