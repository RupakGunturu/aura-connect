import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Calendar,
  Pencil,
  Check,
  X,
  Shield,
  Key,
  Smartphone,
  Ban,
  Phone,
  Video,
  Mail,
  LogOut,
  Trash2,
  Search,
  Loader,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { connectSocket, disconnectSocket } from "@/lib/socket";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card rounded-3xl border border-border p-6 shadow-2xl">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EditableField({ label, value, onSave, type = "text", textarea, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  async function handleSave() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 hover:border-border">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-sm">{value || placeholder || "—"}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="ml-2 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-card/60 hover:text-foreground group-hover:opacity-100"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {textarea ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          maxLength={280}
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none"
        />
      ) : (
        <input
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      )}
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="grid size-7 place-items-center rounded-lg bg-brand text-brand-foreground disabled:opacity-50"
        >
          {saving ? <Loader className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ToggleField({ label, description, checked, onChange }) {
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    try {
      await onChange(!checked);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
          checked ? "bg-brand" : "bg-border"
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, destructive }) {
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

export default function Profile() {
  const { user, token, ready, updateUser, logout } = useAuth();
  const { handle } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [sessions, setSessions] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockSearch, setBlockSearch] = useState("");
  const [blockResults, setBlockResults] = useState([]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnProfile = !handle || handle === user?.profile?.handle;

  const profileId = profile?._id ?? profile?.id;
  const isOnline = onlineUsers.has(profileId);

  useEffect(() => {
    const s = connectSocket(token);
    s.emit("online");
    function onOnline({ userId }) {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    }
    function onOffline({ userId }) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
    s.on("userOnline", onOnline);
    s.on("userOffline", onOffline);
    return () => {
      s.emit("offline");
      s.off("userOnline", onOnline);
      s.off("userOffline", onOffline);
    };
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    if (!handle && isOwnProfile) {
      setProfile(user);
      setLoading(false);
      return;
    }
    if (!handle) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api(`/users/handle/${encodeURIComponent(handle)}`, { token })
      .then((data) => setProfile(data.user))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [handle, token, ready]);

  useEffect(() => {
    if (!isOwnProfile || !ready || !token) return;
    api("/auth/sessions", { token })
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {});
    api("/users/blocked", { token })
      .then((data) => setBlockedUsers(data.users ?? []))
      .catch(() => {});
  }, [isOwnProfile, token, ready]);

  async function saveProfile(field, value) {
    const data = await api("/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify({ profile: { [field]: value } }),
      token,
    });
    updateUser({ profile: data.profile.profile });
    toast.success(
      `${field === "name" ? "Name" : field === "handle" ? "Handle" : field === "bio" ? "Bio" : "Avatar"} updated`,
    );
  }

  async function saveSetting(key, value) {
    const data = await api("/users/me/settings", {
      method: "PATCH",
      body: JSON.stringify({ settings: { [key]: value } }),
      token,
    });
    updateUser({ settings: data.profile.settings });
    toast.success("Setting updated");
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === "string") {
        await saveProfile("avatarUrl", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      await api("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
        token,
      });
      toast.success("Password changed");
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  async function revokeSession(sessionId) {
    try {
      await api(`/auth/sessions/${sessionId}`, { method: "DELETE", token });
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Session revoked");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function unblock(targetUserId) {
    try {
      await api(`/users/blocked/${targetUserId}`, { method: "DELETE", token });
      setBlockedUsers((prev) => prev.filter((u) => u._id !== targetUserId));
      toast.success("User unblocked");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleBlockSearch(q) {
    setBlockSearch(q);
    if (!q.trim()) {
      setBlockResults([]);
      return;
    }
    try {
      const data = await api(`/users/search?q=${encodeURIComponent(q)}`, { token });
      setBlockResults(data.users ?? []);
    } catch {
      setBlockResults([]);
    }
  }

  async function blockTarget(targetUserId) {
    try {
      await api(`/users/blocked/${targetUserId}`, { method: "POST", token });
      setBlockedUsers((prev) => [...prev, { _id: targetUserId }]);
      setBlockSearch("");
      setBlockResults([]);
      toast.success("User blocked");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api("/auth/account", { method: "DELETE", token });
      disconnectSocket();
      logout();
      navigate("/login");
      toast.success("Account deleted permanently");
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <User className="mb-3 size-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">User not found</p>
      </div>
    );
  }

  const display = profile ?? user;
  const joined = new Date(display.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-6 pb-24 md:pb-6">
      {/* Profile Header */}
      <div className="glass-card rounded-3xl border border-border p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            {display.profile?.avatarUrl ? (
              <img
                src={display.profile.avatarUrl}
                alt={display.profile.handle}
                className="size-20 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="grid size-20 place-items-center rounded-full bg-card text-2xl font-semibold uppercase ring-2 ring-border">
                {display.profile?.handle?.slice(0, 2) ?? "?"}
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0.5 right-0.5 size-4 rounded-full border-2 border-background bg-green-500" />
            )}
            {isOwnProfile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-card text-muted-foreground ring-2 ring-background hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
              </>
            )}
          </div>
          <h1 className="text-xl font-semibold">{display.profile?.name}</h1>
          <p className="text-sm text-muted-foreground">@{display.profile?.handle}</p>
          {display.profile?.bio && (
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{display.profile.bio}</p>
          )}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Joined {joined}</span>
            {isOnline ? (
              <span className="ml-2 flex items-center gap-1 text-green-500">
                <span className="size-1.5 rounded-full bg-green-500" /> Online
              </span>
            ) : (
              <span className="ml-2 flex items-center gap-1 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" /> Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <>
          {/* Profile Section */}
          <Section title="Profile" icon={User}>
            <EditableField
              label="Name"
              value={display.profile?.name ?? ""}
              onSave={(v) => saveProfile("name", v)}
              placeholder="Your name"
            />
            <EditableField
              label="Username"
              value={display.profile?.handle ?? ""}
              onSave={(v) => saveProfile("handle", v)}
              placeholder="your_handle"
            />
            <EditableField
              label="Bio"
              value={display.profile?.bio ?? ""}
              onSave={(v) => saveProfile("bio", v)}
              textarea
              placeholder="Tell the world about yourself..."
            />
          </Section>

          {/* Privacy & Security */}
          <Section title="Privacy & Security" icon={Shield}>
            <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
              {showPasswordForm ? (
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Change Password
                  </p>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                    minLength={8}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold hover:bg-card/60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="flex-1 rounded-xl bg-brand py-2 text-xs font-semibold text-brand-foreground disabled:opacity-50"
                    >
                      {passwordSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex w-full items-center gap-3 text-left text-sm"
                >
                  <Key className="size-4 text-muted-foreground" />
                  <span>Change Password</span>
                </button>
              )}
            </div>

            {/* Active Sessions */}
            <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Active Sessions
              </p>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active sessions</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.sessionId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {s.deviceInfo || "Unknown device"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(s.lastActiveAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => revokeSession(s.sessionId)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-500/10"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blocked Users */}
            <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Blocked Users
              </p>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={blockSearch}
                  onChange={(e) => handleBlockSearch(e.target.value)}
                  placeholder="Search users to block..."
                  className="w-full rounded-lg border border-border bg-background/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand"
                />
              </div>
              {blockSearch && blockResults.length > 0 && (
                <div className="mb-2 space-y-1">
                  {blockResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => blockTarget(u._id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-card/60"
                    >
                      <Ban className="size-3.5 text-red-400" />
                      <span>@{u.profile.handle}</span>
                    </button>
                  ))}
                </div>
              )}
              {blockedUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No blocked users</p>
              ) : (
                <div className="space-y-1">
                  {blockedUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5"
                    >
                      <span className="text-xs">@{u.profile?.handle ?? "unknown"}</span>
                      <button
                        onClick={() => unblock(u._id)}
                        className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-card/60 hover:text-foreground"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Communication */}
          <Section title="Communication" icon={Phone}>
            <ToggleField
              label="Allow Voice Calls"
              description="Let others start voice calls with you"
              checked={display.settings?.allowVoiceCalls ?? true}
              onChange={(v) => saveSetting("allowVoiceCalls", v)}
            />
            <ToggleField
              label="Allow Video Calls"
              description="Let others start video calls with you"
              checked={display.settings?.allowVideoCalls ?? true}
              onChange={(v) => saveSetting("allowVideoCalls", v)}
            />
            <ToggleField
              label="Show Online Status"
              description="Let others see when you are online"
              checked={display.settings?.showOnlineStatus ?? true}
              onChange={(v) => saveSetting("showOnlineStatus", v)}
            />
          </Section>

          {/* Account */}
          <Section title="Account" icon={Mail}>
            <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </p>
              <p className="mt-0.5 text-sm">{display.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-left text-sm transition-colors hover:bg-card/60"
            >
              <LogOut className="size-4 text-muted-foreground" />
              <span>Logout</span>
            </button>
            <button
              onClick={() => setDeleteModal(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="size-4" />
              <span>Delete Account</span>
            </button>
          </Section>
        </>
      )}

      <ConfirmModal
        open={deleteModal}
        title="Delete Account"
        message="Do you want to permanently delete? This will remove all your data including conversations and messages."
        confirmLabel={deleting ? "Deleting..." : "Yes, delete permanently"}
        destructive
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}
