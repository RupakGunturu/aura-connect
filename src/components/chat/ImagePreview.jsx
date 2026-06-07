import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

const s = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    zIndex: 10,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
    transition: "background 0.15s",
  },
  imgWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    minHeight: 0,
    width: "100%",
  },
  img: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: 8,
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  nav: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  counter: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "'SF Pro Text','Segoe UI',system-ui,sans-serif",
  },
};

export default function ImagePreview({ images, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={s.backdrop}
        onClick={onClose}
      >
        <div style={s.topBar}>
          <div style={s.counter}>
            {images.length > 1 ? `${index + 1} / ${images.length}` : ""}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={current.url}
              download={current.name}
              onClick={(e) => e.stopPropagation()}
              style={s.btn}
              title="Download"
            >
              <Download size={16} strokeWidth={2} />
            </a>
            <button
              onClick={onClose}
              style={s.btn}
              title="Close (Esc)"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div style={s.imgWrap} onClick={(e) => e.stopPropagation()}>
          <img src={current.url} alt={current.name} style={s.img} draggable={false} />
        </div>

        {images.length > 1 && index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => i - 1); }}
            style={{ ...s.nav, left: 16 }}
            title="Previous (←)"
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
        )}
        {images.length > 1 && index < images.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => i + 1); }}
            style={{ ...s.nav, right: 16 }}
            title="Next (→)"
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
