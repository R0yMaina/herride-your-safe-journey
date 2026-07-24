import { useState } from "react";
import { Phone, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, Section } from "@/components/common";
import {
  useAddTrustedContact,
  useRemoveTrustedContact,
  useTrustedContacts,
} from "../hooks/useTrustedContacts";
import { sanitizePhone, sanitizeText } from "@/lib/security/sanitize";

export function TrustedContactsSection() {
  const { data: contacts, isLoading } = useTrustedContacts();
  const addContact = useAddTrustedContact();
  const removeContact = useRemoveTrustedContact();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const submit = async () => {
    const cleanName = sanitizeText(name);
    const cleanPhone = sanitizePhone(phone);
    if (!cleanName || cleanPhone.length < 7) {
      toast.error("Enter a name and a valid phone number");
      return;
    }
    try {
      await addContact.mutateAsync({ name: cleanName, phone: cleanPhone });
      toast.success(`${cleanName} added as a trusted contact`);
      setName("");
      setPhone("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add contact");
    }
  };

  return (
    <Section title="Trusted contacts">
      <div className="space-y-2">
        {isLoading && (
          <GlassCard className="py-4 text-sm text-muted-foreground">Loading contacts…</GlassCard>
        )}
        {!isLoading && (contacts?.length ?? 0) === 0 && (
          <GlassCard className="py-4 text-sm text-muted-foreground">
            No trusted contacts yet. They're notified when you share a trip or trigger SOS.
          </GlassCard>
        )}
        {contacts?.map((contact) => (
          <GlassCard key={contact.id} className="flex items-center gap-4 py-4">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base text-foreground">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.phone}</p>
            </div>
            <button
              type="button"
              aria-label={`Remove ${contact.name}`}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
              onClick={() =>
                removeContact
                  .mutateAsync(contact.id)
                  .catch(() => toast.error("Could not remove contact"))
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </GlassCard>
        ))}

        {showForm ? (
          <GlassCard className="space-y-3 py-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000000"
                inputMode="tel"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={addContact.isPending}
                className="flex-1 rounded-2xl bg-gradient-pink py-2.5 text-sm font-semibold text-noir disabled:opacity-60"
              >
                {addContact.isPending ? "Adding…" : "Add contact"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-2xl border border-border/70 px-4 py-2.5 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </GlassCard>
        ) : (
          <button type="button" onClick={() => setShowForm(true)} className="w-full">
            <GlassCard className="flex items-center justify-center gap-2 py-3 text-sm text-primary">
              <Plus className="h-4 w-4" /> Add trusted contact
            </GlassCard>
          </button>
        )}
      </div>
    </Section>
  );
}
