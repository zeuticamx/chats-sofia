import { Suspense } from "react";
import { LiveDashboard } from "./components/live-dashboard";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center font-mono text-xs text-text-600">
          cargando panel…
        </div>
      }
    >
      <LiveDashboard />
    </Suspense>
  );
}
