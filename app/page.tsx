import { Suspense } from "react";
import HomePage from "./HomePage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <span className="auth-spinner" />
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
