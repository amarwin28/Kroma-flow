"use client";

import React, { useState } from "react";
import { Plus, Calendar as CalIcon, Clock, MapPin, Download } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, Textarea } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { MockCalendarEvent } from "@/data/mockCalendar";
import { formatIndianDateTime } from "@/data/format";

const EVENT_TYPES: MockCalendarEvent["type"][] = [
  "Client Meeting",
  "Project Deadline",
  "Team Meeting",
  "Follow-up Reminder",
  "Invoice Due",
];

export default function CalendarPage() {
  const { state, addCalendarEvent } = useDemoData();
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Client Meeting" as MockCalendarEvent["type"],
    startAt: "2026-12-01T11:00",
    endAt: "2026-12-01T12:00",
    location: "Google Meet",
    reminderMinutes: "15",
  });

  const filtered = state.calendarEvents.filter(
    (ev) => !typeFilter || ev.type === typeFilter
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    addCalendarEvent({
      title: form.title,
      description: form.description,
      type: form.type,
      startAt: form.startAt,
      endAt: form.endAt,
      location: form.location,
      reminderMinutes: Number(form.reminderMinutes || 15),
    });
    setModalOpen(false);
    setForm({ ...form, title: "", description: "" });
  }

  function exportIcs() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KROMAXZON TECHNOLOGIES//KROMA FLOW//EN",
      ...state.calendarEvents.flatMap((ev) => [
        "BEGIN:VEVENT",
        `UID:${ev.id}@kromaflow`,
        `SUMMARY:${ev.title}`,
        `DESCRIPTION:${ev.description}`,
        `LOCATION:${ev.location}`,
        `DTSTART:${ev.startAt.replace(/[-:]/g, "").slice(0, 15)}`,
        `DTEND:${ev.endAt.replace(/[-:]/g, "").slice(0, 15)}`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kroma-flow-schedule.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Calendar & Scheduling
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {state.calendarEvents.length} scheduled client meetings, deadlines, follow-ups & invoice reminders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Filter event type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-44"
          >
            <option value="">All Event Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={exportIcs}>
            <Download className="w-4 h-4" /> Export .ics
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ev) => (
          <Card key={ev.id} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Badge
                tone={
                  ev.type === "Project Deadline" || ev.type === "Invoice Due"
                    ? "red"
                    : ev.type === "Client Meeting"
                    ? "blue"
                    : "amber"
                }
              >
                {ev.type}
              </Badge>
              <span className="text-[11px] text-slate-400">
                {ev.reminderMinutes}m reminder
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#0b1f44]">{ev.title}</h3>
            {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}
            <div className="text-[11px] text-slate-500 space-y-1 pt-1">
              <p className="flex items-center gap-1.5">
                <CalIcon className="w-3.5 h-3.5 text-[#1d6bff]" />
                {formatIndianDateTime(ev.startAt)}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {ev.location}
              </p>
              {ev.projectName && (
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Project: {ev.projectName}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Event">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Event Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Select
            label="Event Type"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as MockCalendarEvent["type"] })
            }
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start"
              type="datetime-local"
              required
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
            <Input
              label="End"
              type="datetime-local"
              required
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </div>
          <Input
            label="Location / Meeting Link"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
