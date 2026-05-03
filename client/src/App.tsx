import { BuzzDebugOverlay } from "./hid/buzz-debug-overlay";
import { PhoneClient } from "./phone/phone-client";
import { HostClient } from "./host/host-client";
import { getCurrentRoute } from "./router";

export function App() {
  const route = getCurrentRoute();
  if (route === "debug-hid") return <BuzzDebugOverlay />;
  if (route === "phone") return <PhoneClient />;
  return <HostClient />;
}
