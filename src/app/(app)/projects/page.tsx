"use client";

import React, { useState } from "react";
import { Plus, FolderKanban, CheckSquare, Square, Calendar, Search } from "lucide-react";
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
import { MockProject } from "@/data/mockProjects";
import { formatINR, formatIndianDate } from "@/data/format";

export default function ProjectsPage() {
  const {
    state,
    addProject,
    updateProjectProgress,
    addProjectMilestone,
    toggleProjectMilestone,
  } = useDemoData();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [milestoneInputs, setMilestoneInputs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    client: state.clients[0]?.company || "TechCorp Solutions",
    clientEmail: state.clients[0]?.email || "",
    projectManager: "Aditya Rao",
    budget: "250000",
    startDate: "2026-11-25",
    deadline: "2027-01-15",
    priority: "High" as MockProject["priority"],
    status: "Planning" as MockProject["status"],
  });

  const filtered = state.projects.filter((p) => {
    const query = q.trim().toLowerCase();
    const matchesQ =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      p.projectCode.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    addProject({
      name: form.name,
      description: form.description,
      client: form.client,
      clientEmail: form.clientEmail,
      projectManager: form.projectManager,
      teamMembers: ["Siddharth Joshi", "Kavya Menon"],
      budget: Number(form.budget || 0),
      startDate: form.startDate,
      deadline: form.deadline,
      progress: form.status === "Completed" ? 100 : 15,
      priority: form.priority,
      status: form.status,
    });
    setModalOpen(false);
    setForm({ ...form, name: "", description: "" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Projects & Milestones
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {state.projects.length} delivery projects connected to clients and engineering teams.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Project
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects by name, ID, or client..."
            className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-[#dce7f8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d6bff]/30"
          />
        </div>
        <Select
          aria-label="Filter projects by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="">All Statuses</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title="No matching projects"
          description="Try clearing filters or create a new project."
          action={<Button onClick={() => setModalOpen(true)}>Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#1d6bff]">{p.projectCode}</span>
                    <Badge
                      tone={
                        p.priority === "High"
                          ? "red"
                          : p.priority === "Medium"
                          ? "amber"
                          : "slate"
                      }
                    >
                      {p.priority}
                    </Badge>
                  </div>
                  <h2 className="text-base font-bold text-[#0b1f44] mt-0.5">{p.name}</h2>
                  <p className="text-xs text-slate-500">
                    Client: <strong className="text-[#0b1f44]">{p.client}</strong> · PM:{" "}
                    {p.projectManager}
                  </p>
                </div>
                <Badge
                  tone={
                    p.status === "Completed"
                      ? "green"
                      : p.status === "In Progress"
                      ? "blue"
                      : "amber"
                  }
                >
                  {p.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-600">{p.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {p.teamMembers.map((tm) => (
                  <span
                    key={tm}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#eff5ff] text-[#0b1f44] font-medium"
                  >
                    {tm}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0b1f44]">Progress</span>
                  <span className="font-bold text-[#1d6bff]">{p.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={p.progress}
                  onChange={(e) => updateProjectProgress(p.id, Number(e.target.value))}
                  className="w-full accent-[#1d6bff] cursor-pointer"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatIndianDate(p.startDate)} →{" "}
                    {formatIndianDate(p.deadline)}
                  </span>
                  <span className="font-bold text-[#0b1f44]">Budget: {formatINR(p.budget)}</span>
                </div>
              </div>

              <div className="border-t border-[#eff5ff] pt-3 space-y-2">
                <p className="text-xs font-bold text-[#0b1f44]">Milestones</p>
                <div className="space-y-1.5">
                  {p.milestones.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleProjectMilestone(p.id, m.id)}
                      className="w-full flex items-center gap-2 text-left text-xs p-2 rounded-xl hover:bg-[#f4f8ff] cursor-pointer"
                    >
                      {m.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={m.completed ? "line-through text-slate-400" : "text-[#0b1f44]"}
                      >
                        {m.title}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    value={milestoneInputs[p.id] || ""}
                    onChange={(e) =>
                      setMilestoneInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    placeholder="Add milestone..."
                    className="flex-1 min-h-[36px] px-3 rounded-xl border border-[#dce7f8] text-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const val = milestoneInputs[p.id]?.trim();
                      if (!val) return;
                      addProjectMilestone(p.id, val);
                      setMilestoneInputs((prev) => ({ ...prev, [p.id]: "" }));
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Project">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Project Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Client"
              value={form.client}
              onChange={(e) => {
                const c = state.clients.find((x) => x.company === e.target.value);
                setForm({
                  ...form,
                  client: e.target.value,
                  clientEmail: c?.email || "",
                });
              }}
            >
              {state.clients.map((c) => (
                <option key={c.id} value={c.company}>
                  {c.company}
                </option>
              ))}
            </Select>
            <Select
              label="Project Manager"
              value={form.projectManager}
              onChange={(e) => setForm({ ...form, projectManager: e.target.value })}
            >
              {state.teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Budget (₹)"
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as MockProject["priority"] })
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as MockProject["status"] })
              }
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
