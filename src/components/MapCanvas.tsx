export function MapCanvas({ showRoute = false, className = "" }: { showRoute?: boolean; className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-noir ${className}`}>
      <svg viewBox="0 0 400 700" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.22 0.02 340)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="oklch(0.78 0.18 5 / 0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.94 0.04 10)" />
            <stop offset="100%" stopColor="oklch(0.72 0.20 5)" />
          </linearGradient>
        </defs>
        <rect width="400" height="700" fill="oklch(0.16 0.018 340)" />
        <rect width="400" height="700" fill="url(#grid)" opacity="0.5" />
        <rect width="400" height="700" fill="url(#glow)" />
        {/* roads */}
        <path d="M-20 200 Q 100 180 200 240 T 420 220" stroke="oklch(0.30 0.02 340)" strokeWidth="14" fill="none" strokeLinecap="round"/>
        <path d="M80 -20 Q 120 200 90 400 T 140 720" stroke="oklch(0.30 0.02 340)" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <path d="M320 -20 Q 280 250 340 480 T 280 720" stroke="oklch(0.30 0.02 340)" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <path d="M-20 520 Q 150 480 240 540 T 420 500" stroke="oklch(0.30 0.02 340)" strokeWidth="10" fill="none" strokeLinecap="round"/>
        {/* blocks */}
        {[[30,260,60,80],[160,280,90,90],[270,260,70,70],[40,420,80,60],[180,420,100,70],[300,400,80,80],[40,570,90,60],[200,580,120,60]].map((b,i)=>(
          <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="8" fill="oklch(0.20 0.018 340)" />
        ))}
        {showRoute && (
          <>
            <path d="M 80 580 Q 180 500 220 360 T 320 140" stroke="url(#route)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="0" className="doodle-glow" />
            <circle cx="80" cy="580" r="10" fill="oklch(0.94 0.04 10)" />
            <circle cx="80" cy="580" r="4" fill="oklch(0.15 0.02 340)" />
            <circle cx="320" cy="140" r="10" fill="oklch(0.72 0.20 5)" />
            <circle cx="320" cy="140" r="4" fill="oklch(0.98 0 0)" />
          </>
        )}
      </svg>
    </div>
  );
}