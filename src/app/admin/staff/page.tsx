import { Suspense } from "react";
import { StaffView } from "./StaffView";

export default function StaffPage() {
  return (
    <Suspense>
      <StaffView />
    </Suspense>
  );
}