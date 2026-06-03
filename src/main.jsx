import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import "./styles.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
