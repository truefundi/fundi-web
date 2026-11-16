import { Suspense } from "react";
import { AuditLogsView } from "./AuditLogsView";

export default function AuditLogsPage() {
  return (
    <Suspense>
      <AuditLogsView />
    </Suspense>
  );
}