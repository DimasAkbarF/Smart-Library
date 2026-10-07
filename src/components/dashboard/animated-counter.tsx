export function AnimatedCounter({
  value,
  formatter,
}: {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}) {
  const formatted = formatter
    ? formatter(value)
    : value.toLocaleString("id-ID");

  return <span className="tabular-nums font-mono">{formatted}</span>;
}
