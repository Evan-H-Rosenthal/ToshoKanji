import type { ReactNode } from "react";

export function PhoneFrame({ children, darkMode }: { children: ReactNode; darkMode: boolean }) {
  return (
    <div
      style={{
        minHeight: "var(--app-height, 100dvh)",
        height: "var(--app-height, 100dvh)",
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
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
