import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SW_CLEANUP_FLAG = "ppp-sw-cleanup-complete";

const clearServiceWorkersAndReload = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) {
    sessionStorage.removeItem(SW_CLEANUP_FLAG);
    return;
  }

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }

  if (!sessionStorage.getItem(SW_CLEANUP_FLAG)) {
    sessionStorage.setItem(SW_CLEANUP_FLAG, "true");
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(SW_CLEANUP_FLAG);
};

clearServiceWorkersAndReload().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
