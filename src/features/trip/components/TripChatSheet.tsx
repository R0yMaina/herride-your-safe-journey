import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { chatService, QUICK_REPLIES, type RideMessage } from "@/services/chat";
import { useAuth } from "@/hooks/useAuth";

interface TripChatSheetProps {
  readonly rideId: string;
  readonly counterpartyName: string;
  readonly onClose: () => void;
}

/**
 * In-ride chat (Uber/Bolt style): full-screen sheet with message history,
 * live incoming messages over Realtime, one-tap quick replies, and a compose
 * bar. Phone numbers never change hands — everything stays in-app.
 */
export function TripChatSheet({ rideId, counterpartyName, onClose }: TripChatSheetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<readonly RideMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void chatService
      .list(rideId)
      .then((history) => active && setMessages(history))
      .catch(() => {});
    const sub = chatService.subscribe(rideId, (message) => {
      if (!active) return;
      setMessages((cur) => (cur.some((m) => m.id === message.id) ? cur : [...cur, message]));
    });
    return () => {
      active = false;
      sub.unsubscribe();
    };
  }, [rideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const message = await chatService.send(rideId, body);
      setMessages((cur) => (cur.some((m) => m.id === message.id) ? cur : [...cur, message]));
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const mine = (m: RideMessage) => (user ? m.senderId === user.id : m.senderId === "mock-user");

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex flex-col bg-background"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <button type="button" onClick={onClose} aria-label="Close chat" className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <p className="font-display text-base text-foreground">{counterpartyName}</p>
          <p className="text-[11px] text-muted-foreground">
            Messages stay in the app — your number is never shared
          </p>
        </div>
      </div>

      {/* History */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            Say hello — quick replies below.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${mine(m) ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                mine(m)
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border/60"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void send(q)}
            className="shrink-0 rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Compose */}
      <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send(draft)}
          maxLength={500}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full border border-border/70 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void send(draft)}
          disabled={!draft.trim() || sending}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-pink text-noir disabled:opacity-50"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
