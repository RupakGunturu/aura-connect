export default function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, destructive }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass-card w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-card/60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] ${
              destructive ? "bg-red-600 shadow-red-600/20" : "bg-brand shadow-brand/10"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
