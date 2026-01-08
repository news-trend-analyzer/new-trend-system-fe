interface TrendMiniChartProps {
  data: number[];
}

export default function TrendMiniChart({ data }: TrendMiniChartProps) {
  return (
    <svg width="80" height="30" className="text-teal-500 stroke-current fill-none">
      <polyline
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={data.map((val, i) => `${(i * 15)},${30 - (val / 100 * 25)}`).join(' ')}
      />
    </svg>
  );
}

