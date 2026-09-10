import { useState } from "react";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { storage } from "./lib/storage";

export default function App() {
  const demo = new URLSearchParams(location.search).get("demo") === "true";
  const [ready, setReady] = useState(() => demo || (storage.isOnboardingComplete() && Boolean(storage.getCalibration())));
  return ready ? <Dashboard /> : <Onboarding onComplete={() => setReady(true)} />;
}
