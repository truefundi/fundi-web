import { Suspense } from "react";
import { PaymentsView } from "./PaymentsView";

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsView />
    </Suspense>
  );
}