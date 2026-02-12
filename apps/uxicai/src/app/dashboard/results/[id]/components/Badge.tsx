import { getSeverityStyles } from "../lib/utils";

interface BadgeProps {
  severity: string;
  children: React.ReactNode;
}

export function Badge({ severity, children }: BadgeProps) {
  const styles = getSeverityStyles(severity);

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${styles.badge}`}
    >
      {children}
    </span>
  );
}
