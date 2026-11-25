"use client";

import React, { useState } from "react";
import {
  Plus,
  CheckSquare,
  MessageSquare,
  Calendar as CalIcon,
  List,
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
import { MockTask, TaskStatus } from "@/data/mockTasks";
import { formatIndianDate, formatIndianDateTime } from "@/data/format";

const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Review", "Completed"];

export default function TasksPage() {
  const { state, addTask, updateTaskStatus, addTaskComment } = useDemoData();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: state.teamMembers[4]?.name || "Siddharth Joshi",
    relatedProject: state.projects[0]?.name || "Website Redesign",
    priority: "Medium" as MockTask["priority"],
    status: "To Do" as TaskStatus,
    dueDate: "2026-12-05",
  });

  const filtered = state.tasks.filter((t) => {
    const query = q.trim().toLowerCase();
    const matchesQ =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.relatedProject.toLowerCase().includes(query) ||
      t.assignedTo.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const commentTask = state.tasks.find((t) => t.id === commentTaskId) || null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    addTask(form);
    setModalOpen(false);
    setForm({ ...form, title: "", description: "" });
  }

  function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentTask || !newComment.trim()) return;
    addTaskComment(commentTask.id, newComment.trim());
    setNewComment("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Task Management
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {state.tasks.length} tasks connected to projects and team members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#dce7f8] bg-white p-1">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                view === "list" ? "bg-[#1d6bff] text-white" : "text-slate-600"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                view === "calendar" ? "bg-[#1d6bff] text-white" : "text-slate-600"
              }`}
            >
              <CalIcon className="w-3.5 h-3.5" /> Due Dates
            </button>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks by title, project, or assignee..."
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
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No matching tasks"
          description="Create a task or clear your search filter."
          action={<Button onClick={() => setModalOpen(true)}>Add Task</Button>}
        />
      ) : view === "list" ? (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[#0b1f44]">{t.title}</h3>
                  <Badge
                    tone={
                      t.priority === "High"
                        ? "red"
                        : t.priority === "Medium"
                        ? "amber"
                        : "slate"
                    }
                  >
                    {t.priority}
                  </Badge>
                </div>
                {t.description && <p className="text-xs text-slate-600">{t.description}</p>}
                <p className="text-[11px] text-slate-500">
                  Project: <strong className="text-[#0b1f44]">{t.relatedProject}</strong> ·
                  Assignee: <strong>{t.assignedTo}</strong> · Due{" "}
                  {formatIndianDate(t.dueDate)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setCommentTaskId(t.id)}>
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t.comments.length > 0 && <span>{t.comments.length}</span>}
                </Button>
                <select
                  aria-label={`Status for ${t.title}`}
                  value={t.status}
                  onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                  className="text-xs px-3 py-2 rounded-xl border border-[#dce7f8] bg-[#f4f8ff] font-semibold text-[#0b1f44] cursor-pointer"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge tone="blue">{formatIndianDate(t.dueDate)}</Badge>
                <Badge tone={t.status === "Completed" ? "green" : "amber"}>{t.status}</Badge>
              </div>
              <h3 className="text-sm font-bold text-[#0b1f44]">{t.title}</h3>
              <p className="text-xs text-slate-500">
                {t.relatedProject} · {t.assignedTo}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Task">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Task Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Related Project"
              value={form.relatedProject}
              onChange={(e) => setForm({ ...form, relatedProject: e.target.value })}
            >
              {state.projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.client})
                </option>
              ))}
            </Select>
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as MockTask["priority"] })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(commentTask)}
        onClose={() => setCommentTaskId(null)}
        title={`Comments · ${commentTask?.title || ""}`}
      >
        <div className="space-y-3">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {commentTask?.comments.length === 0 && (
              <p className="text-xs text-slate-500">No comments yet.</p>
            )}
            {commentTask?.comments.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-[#f4f8ff] border border-[#dce7f8]">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <strong className="text-[#0b1f44]">{c.authorName}</strong>
                  <span>{formatIndianDateTime(c.createdAt)}</span>
                </div>
                <p className="text-xs text-[#0b1f44]">{c.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={postComment} className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 min-h-[40px] px-3 rounded-xl border border-[#dce7f8] text-sm"
            />
            <Button type="submit" size="sm">
              Post
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
