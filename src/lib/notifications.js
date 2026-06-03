let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function resumeAudio() {
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

if (typeof document !== "undefined") {
  const onInteraction = () => { resumeAudio(); document.removeEventListener("click", onInteraction); };
  document.addEventListener("click", onInteraction, { once: true });
}

function playTone(frequency, duration, type = "sine") {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // audio not available
  }
}

export function playMessageSound() {
  resumeAudio();
  playTone(800, 0.1, "sine");
}

export function playCallRingtone() {
  resumeAudio();
  try {
    const ctx = getAudioCtx();
    function ring() {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.value = 0.2;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
    ring();
    setTimeout(ring, 600);
    setTimeout(ring, 1200);
  } catch {
    // audio not available
  }
}

export function playFriendRequestSound() {
  resumeAudio();
  playTone(600, 0.15, "triangle");
  setTimeout(() => playTone(900, 0.15, "triangle"), 200);
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "denied";
  }
}

export function getNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function showNotification(title, options = {}) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notif = new Notification(title, {
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "securechat",
      renotify: true,
      ...options,
    });

    if (options.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick();
        notif.close();
      };
    }

    return notif;
  } catch {
    // notification not available
  }
}
