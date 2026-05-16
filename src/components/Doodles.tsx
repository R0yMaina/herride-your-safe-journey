// Hand-drawn feminine + ride-themed doodles for splash & accents
export function Doodles({ className = "" }: { className?: string }) {
  const s = "stroke-primary-glow doodle-glow";
  return (
    <svg viewBox="0 0 400 700" className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* high heel top-left */}
      <g className={s} transform="translate(20,40)">
        <path d="M0 30 Q 10 10 40 12 L 60 14 Q 70 20 60 26 L 20 40 Q 8 42 0 38 Z" />
        <path d="M55 26 L 70 50" />
      </g>
      {/* lipstick top-right */}
      <g className={s} transform="translate(330,30)">
        <rect x="0" y="20" width="22" height="34" rx="3" />
        <path d="M4 20 L 4 4 Q 11 -2 18 4 L 18 20" />
      </g>
      {/* heart */}
      <g className={s} transform="translate(60,140)">
        <path d="M14 22 C 0 12 4 -2 14 4 C 24 -2 28 12 14 22 Z" />
      </g>
      {/* sparkle */}
      <g className={s} transform="translate(320,150)">
        <path d="M12 0 L 14 10 L 24 12 L 14 14 L 12 24 L 10 14 L 0 12 L 10 10 Z" />
      </g>
      {/* flower */}
      <g className={s} transform="translate(30,520)">
        <circle cx="14" cy="14" r="4" />
        <circle cx="14" cy="4" r="5" />
        <circle cx="14" cy="24" r="5" />
        <circle cx="4" cy="14" r="5" />
        <circle cx="24" cy="14" r="5" />
      </g>
      {/* bow */}
      <g className={s} transform="translate(330,520)">
        <path d="M0 10 L 12 4 L 12 16 Z" />
        <path d="M24 10 L 12 4 L 12 16 Z" />
        <circle cx="12" cy="10" r="2" />
      </g>
      {/* gps pin */}
      <g className={s} transform="translate(60,620)">
        <path d="M10 0 C 18 0 20 6 20 12 C 20 20 10 28 10 28 C 10 28 0 20 0 12 C 0 6 2 0 10 0 Z" />
        <circle cx="10" cy="12" r="3" />
      </g>
      {/* steering wheel */}
      <g className={s} transform="translate(320,620)">
        <circle cx="14" cy="14" r="13" />
        <circle cx="14" cy="14" r="3" />
        <path d="M14 17 L 14 27" />
        <path d="M11 13 L 2 8" />
        <path d="M17 13 L 26 8" />
      </g>
      {/* scooter */}
      <g className={s} transform="translate(160,30)">
        <circle cx="6" cy="22" r="5" />
        <circle cx="34" cy="22" r="5" />
        <path d="M6 22 L 18 22 L 28 8 L 34 8" />
        <path d="M28 8 L 34 22" />
      </g>
      {/* sunglasses */}
      <g className={s} transform="translate(200,640)">
        <circle cx="6" cy="6" r="6" />
        <circle cx="22" cy="6" r="6" />
        <path d="M12 6 L 16 6" />
      </g>
      {/* coffee cup */}
      <g className={s} transform="translate(20,300)">
        <path d="M2 4 L 18 4 L 16 24 L 4 24 Z" />
        <path d="M18 8 Q 24 10 22 16 Q 20 18 17 18" />
        <path d="M6 0 Q 8 -3 10 0" />
        <path d="M12 0 Q 14 -3 16 0" />
      </g>
      {/* sparkle 2 */}
      <g className={s} transform="translate(340,330)">
        <path d="M8 0 L 10 6 L 16 8 L 10 10 L 8 16 L 6 10 L 0 8 L 6 6 Z" />
      </g>
      {/* handbag */}
      <g className={s} transform="translate(330,440)">
        <path d="M0 8 L 24 8 L 22 26 L 2 26 Z" />
        <path d="M6 8 Q 6 -2 12 -2 Q 18 -2 18 8" />
      </g>
      {/* route swoosh */}
      <g className={s} transform="translate(40,420)">
        <path d="M0 10 Q 20 -8 40 6 T 80 8" strokeDasharray="2 4" />
      </g>
    </svg>
  );
}