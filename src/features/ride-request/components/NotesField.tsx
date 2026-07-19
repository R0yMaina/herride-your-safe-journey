interface NotesFieldProps {
  readonly value: string;
  readonly max: number;
  readonly onChange: (v: string) => void;
}

export function NotesField({ value, max, onChange }: NotesFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Notes for driver
      </span>
      <div className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-xl">
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Gate 4, apartment 12, near the blue mural…"
          className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          aria-label="Notes for the driver"
        />
        <div className="flex justify-end text-[11px] text-muted-foreground">
          {value.length}/{max}
        </div>
      </div>
    </label>
  );
}
