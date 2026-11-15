export function CountBadge({ count, className = "" }: { count: number; className?: string }) {
  const label = `${count} ${count === 1 ? "profile" : "profiles"}`;
  return (
    <span className={`count-badge ${className}`} aria-label={label} title={label}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
