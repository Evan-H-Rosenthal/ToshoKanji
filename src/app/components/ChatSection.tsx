import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MessageCircle, Send } from "lucide-react";
import { QUICK_PROMPTS, getAIReply } from "../data/kanjiData";
import type { ChatMsg } from "../types";

export function ChatSection({ entryKey, msgs, onSend }: {
  entryKey: string; msgs: ChatMsg[]; onSend: (key:string, text:string, reply:string) => void;
}) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, thinking]);

  const send = useCallback((text: string) => {
    if (!text.trim() || thinking) return;
    setInput("");
    setThinking(true);
    setTimeout(() => {
      onSend(entryKey, text, getAIReply(text.toLowerCase()));
      setThinking(false);
    }, 900 + Math.random() * 600);
  }, [thinking, entryKey, onSend]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={15} className="text-primary" />
        <span style={{ fontFamily:"var(--ui-font)", fontWeight:800, fontSize:14 }} className="text-foreground">Chat with AI</span>
      </div>

      {/* Messages */}
      {msgs.length > 0 && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {msgs.map(m => (
            <div key={m.id} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth:"82%", padding:"8px 12px", borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role==="user" ? "var(--primary)" : "var(--secondary)",
                color: m.role==="user" ? "#fff" : "var(--foreground)",
                fontFamily:"var(--ui-font)", fontSize:13, fontWeight:500, lineHeight:1.45,
              }}>{m.text}</div>
            </div>
          ))}
          {thinking && (
            <div style={{ display:"flex", justifyContent:"flex-start" }}>
              <div style={{ padding:"8px 14px", borderRadius:"16px 16px 16px 4px", background:"var(--secondary)" }}>
                <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ duration:1, repeat:Infinity }} style={{ fontFamily:"var(--ui-font)", fontSize:18, letterSpacing:4 }}>...</motion.span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={()=>send(p)} disabled={thinking}
            style={{
              fontFamily:"var(--ui-font)", fontSize:11, fontWeight:700,
              padding:"5px 10px", borderRadius:20,
              background:"var(--secondary)", color:"var(--secondary-foreground)",
              border:"1px solid var(--border)", cursor:"pointer",
              opacity: thinking ? 0.5 : 1, transition:"opacity 0.2s",
            }}>{p}</button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && send(input)}
          placeholder="Ask anything about this kanji..."
          disabled={thinking}
          style={{
            flex:1, background:"var(--input-background)", borderRadius:12,
            padding:"8px 12px", fontFamily:"var(--ui-font)", fontSize:13,
            border:"1px solid var(--border)", outline:"none", color:"var(--foreground)",
          }} />
        <button onClick={()=>send(input)} disabled={!input.trim()||thinking}
          style={{
            width:36, height:36, borderRadius:10, border:"none", cursor:"pointer",
            background: "var(--primary)", display:"flex", alignItems:"center", justifyContent:"center",
            opacity: (!input.trim()||thinking) ? 0.4 : 1, transition:"opacity 0.2s",
          }}>
          <Send size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── Kanji Entry Page ────────────────────────────────────────────────────────────
