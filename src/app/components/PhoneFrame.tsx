import type { ReactNode } from "react";

export function PhoneFrame({ children, darkMode }: { children:ReactNode; darkMode:boolean }) {
  return (
    <div style={{
      minHeight:"100vh", background: darkMode ? "#050411" : "#e8e0f0",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    }}>
      {/* Phone chassis */}
      <div style={{
        width:393, flexShrink:0,
        height:852, borderRadius:55, padding:12, position:"relative",
        background: "linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)",
        boxShadow: "0 0 0 1px #555, 0 40px 100px rgba(0,0,0,0.7), inset 0 0 0 2px #606060",
      }}>
        {/* Power button */}
        <div style={{ position:"absolute", top:140, right:-3, width:4, height:64, borderRadius:"0 3px 3px 0", background:"#333", boxShadow:"inset -1px 0 2px rgba(0,0,0,0.5)" }} />
        {/* Volume buttons */}
        <div style={{ position:"absolute", top:130, left:-3, width:4, height:36, borderRadius:"3px 0 0 3px", background:"#333" }} />
        <div style={{ position:"absolute", top:180, left:-3, width:4, height:36, borderRadius:"3px 0 0 3px", background:"#333" }} />
        <div style={{ position:"absolute", top:92, left:-3, width:4, height:28, borderRadius:"3px 0 0 3px", background:"#333" }} />

        {/* Screen */}
        <div style={{
          width:"100%", height:"100%", borderRadius:44, overflow:"hidden",
          background:"var(--background)", position:"relative", display:"flex", flexDirection:"column",
        }}>
          {/* Dynamic island */}
          <div style={{
            position:"absolute", top:13, left:"50%", transform:"translateX(-50%)",
            width:128, height:38, background:"#000", borderRadius:20, zIndex:50,
            boxShadow:"0 0 0 1px rgba(255,255,255,0.1)",
          }}>
            {/* Tiny camera dot */}
            <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", width:10, height:10, borderRadius:"50%", background:"#1a1a1a", border:"1px solid #333" }} />
          </div>

          {/* Safe area top (below island) */}
          <div style={{ height:60, shrink:0, flexShrink:0 }} />

          {/* App content */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{ height:30, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <div style={{ width:120, height:5, borderRadius:3, background:"rgba(128,128,128,0.35)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
