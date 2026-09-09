import type { CaseStudy } from "../../data/projects";

/**
 * Abstract marks instead of stock photography or screenshots we do not have.
 * Each one says something about the product: a route, a signal, a grid of
 * listings. Drawn in the site's own two colours, on navy.
 */
export function ProjectMotif({ motif }: { motif: CaseStudy["motif"] }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="size-full"
      role="presentation"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={`ft-dots-${motif}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-ft-cream/10" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill={`url(#ft-dots-${motif})`} />

      {motif === "route" && (
        <g className="transition-transform duration-700 group-hover:translate-x-1">
          <path
            d="M70 214 C 130 214, 120 155, 190 155 S 270 105, 330 92"
            fill="none"
            stroke="var(--ft-gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 8"
          />
          <circle cx="70" cy="214" r="7" className="fill-ft-cream" />
          <circle cx="330" cy="92" r="7" fill="var(--ft-gold)" />
          <circle cx="190" cy="155" r="4" className="fill-ft-cream/50" />
        </g>
      )}

      {motif === "pulse" && (
        <g>
          {[34, 62, 92].map((r, i) => (
            <circle
              key={r}
              cx="200"
              cy="150"
              r={r}
              fill="none"
              stroke="var(--ft-gold)"
              strokeWidth="1"
              opacity={0.55 - i * 0.16}
            />
          ))}
          <circle cx="200" cy="150" r="10" fill="var(--ft-gold)" />
          <path
            d="M120 150 H165 L178 122 L196 178 L212 140 L224 150 H280"
            fill="none"
            stroke="var(--ft-cream)"
            strokeOpacity="0.75"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-opacity duration-500 group-hover:opacity-100"
          />
        </g>
      )}

      {motif === "grid" && (
        <g className="transition-transform duration-700 group-hover:-translate-y-1">
          {[0, 1, 2].map((col) =>
            [0, 1].map((row) => {
              const x = 70 + col * 92;
              const y = 92 + row * 74;
              const highlighted = col === 1 && row === 0;
              return (
                <g key={`${col}-${row}`}>
                  <rect
                    x={x}
                    y={y}
                    width="72"
                    height="54"
                    rx="6"
                    fill={highlighted ? "var(--ft-gold)" : "transparent"}
                    fillOpacity={highlighted ? 0.16 : 1}
                    stroke={highlighted ? "var(--ft-gold)" : "var(--ft-cream)"}
                    strokeOpacity={highlighted ? 0.9 : 0.28}
                    strokeWidth="1.5"
                  />
                  <rect
                    x={x + 12}
                    y={y + 34}
                    width={highlighted ? 40 : 28}
                    height="4"
                    rx="2"
                    fill={highlighted ? "var(--ft-gold)" : "var(--ft-cream)"}
                    fillOpacity={highlighted ? 0.9 : 0.3}
                  />
                </g>
              );
            }),
          )}
        </g>
      )}
    </svg>
  );
}
