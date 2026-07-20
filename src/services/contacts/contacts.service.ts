import type { EmergencyContact } from "@/types/user";

export interface NewTrustedContact {
  readonly name: string;
  readonly phone: string;
  readonly relation?: string;
}

/**
 * Trusted (emergency) contacts — notified via SOS and trip sharing.
 * Interface-first so the mock swaps for Supabase without touching screens.
 */
export interface ITrustedContactsService {
  list(): Promise<readonly EmergencyContact[]>;
  add(contact: NewTrustedContact): Promise<EmergencyContact>;
  remove(id: string): Promise<void>;
}

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export class MockTrustedContactsService implements ITrustedContactsService {
  private contacts: EmergencyContact[] = [
    { id: "c_mum", name: "Mum", phone: "+254700111222", relation: "Mother" },
  ];

  async list() {
    await delay();
    return [...this.contacts];
  }

  async add(contact: NewTrustedContact) {
    await delay();
    const created: EmergencyContact = {
      id: crypto.randomUUID(),
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
    };
    this.contacts.push(created);
    return created;
  }

  async remove(id: string) {
    await delay();
    this.contacts = this.contacts.filter((c) => c.id !== id);
  }
}
