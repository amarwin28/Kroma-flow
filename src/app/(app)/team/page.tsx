"use client";

import React, { useState } from "react";
import { UserPlus, Shield, Briefcase, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select } from "@/components/ui";
import { useDemoData } from "@/context/DemoDataContext";
import { MockTeamMember } from "@/data/mockUsers";

const ROLES: MockTeamMember["role"][] = [
  "Admin",
  "Manager",
  "Sales Executive",
  "Developer",
  "Designer",
  "Project Manager",
  "Accountant",
];

export default function TeamPage() {
  const { state, inviteTeamMember, updateTeamMemberRole } = useDemoData();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<MockTeamMember["role"]>("Developer");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteTeamMember(name, email, role, jobTitle || role);
    setInviteOpen(false);
    setName("");
    setEmail("");
    setJobTitle("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f44]">
              Team, Roles & Workload
            </h1>
            <Badge tone="amber">DEMO DATA</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {state.teamMembers.length} employees across Executive, Sales, Engineering, Design, Delivery & Finance.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.teamMembers.map((m) => {
          const openTasks = state.tasks.filter(
            (t) => t.assignedTo === m.name && t.status !== "Completed"
          ).length;
          const managedProjects = state.projects.filter(
            (p) => p.projectManager === m.name
          ).length;

          return (
            <Card key={m.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full ${m.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0b1f44] truncate">{m.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                </div>
                <Badge tone={m.status === "Active" ? "green" : "amber"}>{m.status}</Badge>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-[#0b1f44]">{m.jobTitle}</strong> · {m.department}
                </p>
                <div className="flex items-center gap-4 pt-1 text-[11px]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1d6bff]" /> {openTasks} open tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {managedProjects} managed
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#eff5ff] flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Role
                </span>
                <select
                  aria-label={`Role for ${m.name}`}
                  value={m.role}
                  onChange={(e) =>
                    updateTeamMemberRole(m.id, e.target.value as MockTeamMember["role"])
                  }
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-[#dce7f8] bg-[#f4f8ff] font-semibold text-[#0b1f44] cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add Team Member">
        <form onSubmit={handleInvite} className="space-y-3">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Job Title"
            placeholder="e.g. Senior React Developer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as MockTeamMember["role"])}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
