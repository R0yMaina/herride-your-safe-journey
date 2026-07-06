import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Container = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mx-auto w-full max-w-md px-5", className)} {...props} />
  ),
);
Container.displayName = "Container";