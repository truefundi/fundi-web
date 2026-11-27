import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";

// The root layout's title template only applies to child routes, so set the full title here.
export const metadata: Metadata = {
  title: { absolute: "Dashboard | Fundi Admin" },
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Explore platform performance by period, service, and business area."
      />
      <DashboardWorkspace />
    </>
  );
}
