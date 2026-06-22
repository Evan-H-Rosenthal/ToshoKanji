import { useEffect, useState } from "react";

function isStandalonePwa() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function InstallPwaHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem("toshokanji:pwa-hint-dismissed") === "true";
    setVisible(!dismissed && !isStandalonePwa());
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: 34,
        zIndex: 35,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(21,17,45,0.9)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
        color: "#fff",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <p style={{ flex: 1, fontFamily: "var(--ui-font)", fontSize: 11, fontWeight: 800, lineHeight: 1.25 }}>
        Best in app mode. Add ToshoKanji to your Home Screen for the intended layout.
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem("toshokanji:pwa-hint-dismissed", "true");
          setVisible(false);
        }}
        style={{
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(255,255,255,0.12)",
          color: "#fff",
          borderRadius: 10,
          padding: "6px 9px",
          fontFamily: "var(--ui-font)",
          fontSize: 10,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        OK
      </button>
    </div>
  );
}
