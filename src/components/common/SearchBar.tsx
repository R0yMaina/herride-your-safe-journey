import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SearchBarProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchBar({ className, placeholder = "Where to?", ...props }: SearchBarProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 shadow-soft backdrop-blur-xl",
        className,
      )}
    >
      <Search className="h-4 w-4 text-primary" aria-hidden />
      <input
        {...props}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </label>
  );
}
