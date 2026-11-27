import { Suspense } from "react";
import { UsersView } from "./UsersView";

export default function UsersPage() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}