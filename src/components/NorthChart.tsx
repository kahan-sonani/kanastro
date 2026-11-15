import { SHORT, SIGNS } from "../astro/types.ts";
import type { Chart } from "../astro/types.ts";
import { mod, vargaSign } from "../astro/rules.ts";
const CENTRES = [
  [250, 125],
  [135, 57],
  [57, 135],
  [125, 250],
  [57, 365],
  [135, 443],
  [250, 375],
  [365, 443],
  [443, 365],
  [375, 250],
  [443, 135],
  [365, 57],
];
export function NorthChart({
  chart,
  division = 1,
  decorative = false,
}: {
  chart?: Chart;
  division?: number;
  decorative?: boolean;
}) {
  const lagna = chart
    ? vargaSign(chart.ascendant.longitude, division, chart.settings.d60)
    : 0;
  return (
    <svg
      className={`north-chart ${decorative ? "decorative-chart" : ""}`}
      viewBox="0 0 500 500"
      role={decorative ? "presentation" : "img"}
      aria-label={
        decorative
          ? undefined
          : `North Indian D${division} chart. Houses are fixed; numbers indicate zodiac signs.`
      }
    >
      {!decorative && <title>North Indian D{division} chart</title>}
      <rect
        x="20"
        y="20"
        width="460"
        height="460"
        rx="3"
        fill="var(--chart-bg, #fffdf8)"
        stroke="var(--chart-line, #c2ac7f)"
        strokeWidth="1.3"
      />
      <path
        d="M20 20 480 480 M480 20 20 480 M250 20 480 250 250 480 20 250Z"
        fill="none"
        stroke="var(--chart-line, #c2ac7f)"
        strokeWidth="1.3"
      />
      {CENTRES.map(([x, y], h) => {
        const sign = mod(lagna + h, 12);
        const planets =
          chart?.planets.filter(
            (p) =>
              vargaSign(p.longitude, division, chart.settings.d60) === sign,
          ) ?? [];
        const rows = Math.ceil(planets.length / 3);
        return (
          <g key={h}>
            <title>{`House ${h + 1}, ${SIGNS[sign]}${planets.length ? ": " + planets.map((p) => p.name).join(", ") : ""}`}</title>
            <text
              x={x}
              y={y - (planets.length ? 20 : 0)}
              textAnchor="middle"
              className="chart-sign"
            >
              {sign + 1}
            </text>
            {h === 0 && (
              <text x="250" y="207" textAnchor="middle" className="chart-lagna">
                LAGNA
              </text>
            )}
            {planets.map((p, i) => {
              const rowSize = Math.min(
                3,
                planets.length - Math.floor(i / 3) * 3,
              );
              return (
                <text
                  key={p.name}
                  x={x + ((i % 3) - (rowSize - 1) / 2) * 27}
                  y={y + 3 + Math.floor(i / 3) * 17 - (rows > 2 ? 7 : 0)}
                  textAnchor="middle"
                  className={`chart-planet planet-${p.name.toLowerCase()}`}
                >
                  {SHORT[p.name]}
                  {p.retrograde && (
                    <tspan fontSize="8" dy="-5">
                      R
                    </tspan>
                  )}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
