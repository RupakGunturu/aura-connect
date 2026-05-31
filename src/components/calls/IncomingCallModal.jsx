import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "@/contexts/CallContext";

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-xs rounded-3xl border border-border p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-card text-2xl font-semibold uppercase ring-2 ring-border">
          {incomingCall.callerName?.slice(0, 2) ?? "?"}
        </div>
        <p className="text-lg font-semibold">{incomingCall.callerName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming {incomingCall.type} call...
        </p>
        <div className="mt-6 flex justify-center gap-6">
          <button
            onClick={rejectCall}
            className="grid size-14 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/20 transition-transform hover:scale-105"
          >
            <PhoneOff className="size-6" />
          </button>
          <button
            onClick={acceptCall}
            className="grid size-14 place-items-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/20 transition-transform hover:scale-105"
          >
            <Phone className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
