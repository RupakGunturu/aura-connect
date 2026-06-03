import { API_URL } from "./api";

let swRegistration = null;
let registered = false;

export async function registerPush(token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (registered) return;
  try {
    swRegistration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const existing = await swRegistration.pushManager.getSubscription();
    if (existing) {
      const sub = existing.toJSON();
      await fetch(`${API_URL}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sub),
      }).catch(() => {});
      registered = true;
      return;
    }

    const resp = await fetch(`${API_URL}/push/vapid-public-key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { publicKey } = await resp.json();
    if (!publicKey) return;

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch(`${API_URL}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(subscription.toJSON()),
    }).catch(() => {});
    registered = true;
  } catch (err) {
    console.warn("Push registration failed:", err);
  }
}

export async function unregisterPush(token) {
  registered = false;
  if (!swRegistration) return;
  try {
    const sub = await swRegistration.pushManager.getSubscription();
    if (sub) {
      const json = sub.toJSON();
      await fetch(`${API_URL}/push/subscribe`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: json.endpoint }),
      }).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {}
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
