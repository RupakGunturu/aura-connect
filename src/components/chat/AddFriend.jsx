import { useState } from "react";
import { Search, ArrowLeft, UserPlus, Users } from "lucide-react";

/* ─── Design tokens (matches AuthForm / Onboarding / MessageBubble) ─── */
const t = {
  card:          "#13151a",
  input:         "#0f1116",
  border:        "rgba(255,255,255,0.06)",
  borderInput:   "rgba(255,255,255,0.09)",
  borderFocus:   "rgba(96,165,250,0.5)",
  text:          "#f0f2f5",
  textMuted:     "rgba(240,242,245,0.38)",
  textFaint:     "rgba(240,242,245,0.22)",
  rowHover:      "rgba(255,255,255,0.05)",
  iconBtnHover:  "rgba(255,255,255,0.07)",
  addBtnBg:      "rgba(29,78,216,0.12)",
  addBtnBorder:  "rgba(96,165,250,0.2)",
  addBtnHoverBg: "rgba(29,78,216,0.25)",
  addBtnHoverBd: "rgba(96,165,250,0.45)",
  addBtnIcon:    "#60a5fa",
  avatarBg:      "#1e2128",
  badgeBg:       "#ef4444",
  font:          "'SF Pro Text','Segoe UI',system-ui,sans-serif",
};

/* ─── Icon button ─── */
function IconBtn({ onClick, title, children, badge }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        width: 32, height: 32,
        borderRadius: 9,
        background: hover ? t.iconBtnHover : "transparent",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: hover ? t.text : "rgba(240,242,245,0.4)",
        transition: "background 0.15s, color 0.15s",
        fontFamily: t.font,
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: -2, right: -2,
          minWidth: 16, height: 16, borderRadius: 99,
          background: t.badgeBg,
          fontSize: 9, fontWeight: 700, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px",
          border: `1.5px solid ${t.card}`,
          fontFamily: t.font,
        }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

/* ─── Avatar ─── */
function Avatar({ user }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = user.profile.handle?.slice(0, 2)?.toUpperCase() ?? "?";

  if (user.profile.avatarUrl && !imgErr) {
    return (
      <img
        src={user.profile.avatarUrl}
        alt=""
        loading="lazy"
        onError={() => setImgErr(true)}
        style={{
          width: 34, height: 34, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: "0.5px solid rgba(255,255,255,0.1)",
        }}
      />
    );
  }

  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: t.avatarBg,
      border: "0.5px solid rgba(255,255,255,0.1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700,
      color: "rgba(240,242,245,0.5)",
      fontFamily: t.font,
    }}>
      {initials}
    </div>
  );
}

/* ─── Search result row ─── */
function ResultRow({ user, onStartConversation, onSendFriendRequest }) {
  const [rowHover, setRowHover] = useState(false);
  const [addHover, setAddHover] = useState(false);

  return (
    <div
      onClick={() => onStartConversation(user._id)}
      onMouseEnter={() => setRowHover(true)}
      onMouseLeave={() => setRowHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px",
        borderRadius: 11,
        background: rowHover ? t.rowHover : "transparent",
        cursor: "pointer",
        transition: "background 0.13s",
      }}
    >
      <Avatar user={user} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: t.text,
          margin: 0, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
          fontFamily: t.font,
        }}>
          {user.profile.name}
        </p>
        <p style={{
          fontSize: 11, color: t.textMuted,
          margin: "1px 0 0",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontFamily: t.font,
        }}>
          @{user.profile.handle}
        </p>
      </div>

      {onSendFriendRequest && (
        <button
          onClick={(e) => { e.stopPropagation(); onSendFriendRequest(user._id); }}
          title="Add friend"
          onMouseEnter={() => setAddHover(true)}
          onMouseLeave={() => setAddHover(false)}
          style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: addHover ? t.addBtnHoverBg : t.addBtnBg,
            border: `0.5px solid ${addHover ? t.addBtnHoverBd : t.addBtnBorder}`,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: t.addBtnIcon,
            transition: "background 0.15s, border-color 0.15s",
          }}
        >
          <UserPlus size={13} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

/* ─── Main component ─── */
export default function AddFriend({
  show,
  onToggle,
  searchQuery,
  onSearch,
  searchResults,
  onStartConversation,
  onSendFriendRequest,
  onShowFriends,
  friendRequestCount,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 14px",
        borderBottom: `0.5px solid ${t.border}`,
        fontFamily: t.font,
      }}>
        <span style={{
          fontSize: 15, fontWeight: 700, color: t.text,
          letterSpacing: "-0.01em",
        }}>
          Chats
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconBtn onClick={onShowFriends} title="Friends" badge={friendRequestCount}>
            <Users size={15} strokeWidth={1.9} />
          </IconBtn>
          <IconBtn onClick={onToggle} title={show ? "Close" : "Add friend"}>
            {show
              ? <ArrowLeft size={15} strokeWidth={1.9} />
              : <UserPlus size={15} strokeWidth={1.9} />
            }
          </IconBtn>
        </div>
      </div>

      {/* ── Search panel ── */}
      {show && (
        <div style={{
          borderBottom: `0.5px solid ${t.border}`,
          padding: "12px 12px 10px",
          fontFamily: t.font,
        }}>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 11, top: "50%",
              transform: "translateY(-50%)",
              color: t.textFaint, pointerEvents: "none",
              display: "flex", alignItems: "center",
            }}>
              <Search size={14} strokeWidth={2} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by handle or email…"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: "100%",
                background: t.input,
                border: `0.5px solid ${focused ? t.borderFocus : t.borderInput}`,
                borderRadius: 11,
                padding: "10px 14px 10px 34px",
                fontSize: 13, color: t.text,
                fontFamily: t.font,
                outline: "none",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
              {searchResults.map((u) => (
                <ResultRow
                  key={u._id}
                  user={u}
                  onStartConversation={onStartConversation}
                  onSendFriendRequest={onSendFriendRequest}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {searchQuery.length > 0 && searchResults.length === 0 && (
            <p style={{
              fontSize: 12, color: t.textMuted,
              textAlign: "center", padding: "14px 0 4px",
              fontFamily: t.font,
            }}>
              No users found for "{searchQuery}"
            </p>
          )}
        </div>
      )}
    </>
  );
}