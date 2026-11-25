// DEMO DATA ONLY — Sample team members for KROMAXZON TECHNOLOGIES.

export interface MockTeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  jobTitle: string;
  department: string;
  role: "Admin" | "Manager" | "Sales Executive" | "Developer" | "Designer" | "Project Manager" | "Accountant";
  status: "Active" | "On Leave";
  avatarColor: string;
}

export const mockUsers: MockTeamMember[] = [
  {
    id: "usr-1",
    name: "Aarav Kulkarni",
    initials: "AK",
    email: "aarav.kulkarni@kromaxzon.in",
    jobTitle: "Founder & Chief Executive",
    department: "Executive",
    role: "Admin",
    status: "Active",
    avatarColor: "bg-[#1d6bff]",
  },
  {
    id: "usr-2",
    name: "Ananya Deshmukh",
    initials: "AD",
    email: "ananya.deshmukh@kromaxzon.in",
    jobTitle: "VP of Operations",
    department: "Operations",
    role: "Manager",
    status: "Active",
    avatarColor: "bg-[#0b1f44]",
  },
  {
    id: "usr-3",
    name: "Rohan Verma",
    initials: "RV",
    email: "rohan.verma@kromaxzon.in",
    jobTitle: "Senior Sales Executive",
    department: "Sales",
    role: "Sales Executive",
    status: "Active",
    avatarColor: "bg-emerald-600",
  },
  {
    id: "usr-4",
    name: "Meera Krishnan",
    initials: "MK",
    email: "meera.krishnan@kromaxzon.in",
    jobTitle: "Enterprise Sales Lead",
    department: "Sales",
    role: "Sales Executive",
    status: "Active",
    avatarColor: "bg-indigo-600",
  },
  {
    id: "usr-5",
    name: "Siddharth Joshi",
    initials: "SJ",
    email: "siddharth.joshi@kromaxzon.in",
    jobTitle: "Lead Full-Stack Developer",
    department: "Engineering",
    role: "Developer",
    status: "Active",
    avatarColor: "bg-sky-600",
  },
  {
    id: "usr-6",
    name: "Kavya Menon",
    initials: "KM",
    email: "kavya.menon@kromaxzon.in",
    jobTitle: "Senior UI/UX Designer",
    department: "Design",
    role: "Designer",
    status: "Active",
    avatarColor: "bg-violet-600",
  },
  {
    id: "usr-7",
    name: "Aditya Rao",
    initials: "AR",
    email: "aditya.rao@kromaxzon.in",
    jobTitle: "Technical Project Manager",
    department: "Delivery",
    role: "Project Manager",
    status: "Active",
    avatarColor: "bg-amber-600",
  },
  {
    id: "usr-8",
    name: "Neha Kapoor",
    initials: "NK",
    email: "neha.kapoor@kromaxzon.in",
    jobTitle: "Delivery Project Manager",
    department: "Delivery",
    role: "Project Manager",
    status: "Active",
    avatarColor: "bg-teal-600",
  },
  {
    id: "usr-9",
    name: "Karthik Subramanian",
    initials: "KS",
    email: "karthik.s@kromaxzon.in",
    jobTitle: "Mobile & Cloud Developer",
    department: "Engineering",
    role: "Developer",
    status: "Active",
    avatarColor: "bg-cyan-700",
  },
  {
    id: "usr-10",
    name: "Pooja Bansal",
    initials: "PB",
    email: "pooja.bansal@kromaxzon.in",
    jobTitle: "Senior Finance & GST Accountant",
    department: "Finance",
    role: "Accountant",
    status: "Active",
    avatarColor: "bg-rose-600",
  },
];

export const DEMO_CURRENT_USER = {
  id: "usr-1",
  orgId: "org-kromaxzon",
  email: "aarav.kulkarni@kromaxzon.in",
  name: "Aarav Kulkarni",
  role: "Admin",
  jobTitle: "Founder & Chief Executive",
  orgName: "KROMAXZON TECHNOLOGIES",
  orgLogoUrl: "/logo-kmx.jpg",
  orgPlan: "Enterprise Demo",
};
