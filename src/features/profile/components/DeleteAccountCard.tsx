import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/common";
import { ROUTES } from "@/constants/routes";
import { userService } from "@/services/auth";

/**
 * The right to erasure, exercisable without emailing anyone.
 *
 * Two-step on purpose: this is irreversible, and a single tap next to "Sign
 * out" is a mis-tap waiting to happen. Typing DELETE is friction placed
 * exactly where friction belongs.
 */
export function DeleteAccountCard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await userService.deleteAccount();
      toast.success("Your account has been deleted");
      void navigate({ to: ROUTES.welcome, replace: true });
    } catch (e) {
      // The server refuses while a trip is live or a balance is outstanding,
      // and its message says which — pass it through rather than flattening it
      // into "something went wrong".
      toast.error(e instanceof Error ? e.message : "Could not delete your account");
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        <GlassCard className="flex items-center gap-4 py-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base text-foreground">Delete my account</span>
            <span className="block text-xs text-muted-foreground">
              Erases your personal data permanently
            </span>
          </span>
        </GlassCard>
      </button>
    );
  }

  return (
    <GlassCard className="space-y-3 border-destructive/40 py-4">
      <p className="font-display text-base text-foreground">Delete my account</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        This destroys your name, phone number, saved places, trusted contacts, message content and
        any identity documents. Your trips and payments survive without your name attached, because
        we&apos;re required to keep financial records — they can no longer be traced to you.
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Withdraw any wallet balance first, and finish or cancel an active trip. This cannot be
        undone.
      </p>
      <label className="block">
        <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Type DELETE to confirm
        </span>
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1 w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus:border-destructive"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmation("");
          }}
          className="flex-1 rounded-full border border-border/60 px-4 py-2 text-sm text-foreground"
        >
          Keep my account
        </button>
        <button
          type="button"
          disabled={confirmation.trim().toUpperCase() !== "DELETE" || busy}
          onClick={remove}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Deleting…" : "Delete forever"}
        </button>
      </div>
    </GlassCard>
  );
}
