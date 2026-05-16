import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-noir flex items-center justify-center md:p-8">
      <div className="relative w-full md:w-[400px] md:h-[840px] h-screen md:rounded-[48px] overflow-hidden bg-background md:border-[10px] md:border-noir md:shadow-soft">
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}