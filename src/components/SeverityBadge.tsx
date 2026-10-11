import { formatSeverity } from '../services/formatters'

interface SeverityBadgeProps {
  severity: string
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colorClass = {
    low: 'text-bg-success',
    medium: 'text-bg-warning',
    high: 'text-bg-danger',
    critical: 'text-bg-dark',
  }[severity] ?? 'text-bg-secondary'

  return <span className={`badge cr-badge cr-badge--severity cr-badge--${severity} ${colorClass}`}>{formatSeverity(severity)}</span>
}
