import type { ReactNode } from "react";

export function PhoneFrame({ children, darkMode }: { children: ReactNode; darkMode: boolean }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        background: darkMode ? "#050411" : "#e8e0f0",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          height: "100%",
          position: "relative",
          background: "var(--background)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "calc(env(safe-area-inset-top) + 10px)",
            left: "50%",
            width: 126,
            height: 36,
            borderRadius: 999,
            background: "rgba(0,0,0,0.92)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            paddingTop: 52,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
