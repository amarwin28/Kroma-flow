import { AppShell } from "@/components/AppShell";
import { DemoDataProvider } from "@/context/DemoDataContext";
import { DEMO_CURRENT_USER } from "@/data/mockUsers";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoDataProvider>
      <AppShell user={DEMO_CURRENT_USER}>{children}</AppShell>
    </DemoDataProvider>
  );
}
