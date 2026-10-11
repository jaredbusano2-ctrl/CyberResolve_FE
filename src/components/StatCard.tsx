interface StatCardProps {
  title: string
  value: number | string
  icon: string
  accent?: 'info' | 'success' | 'warning' | 'danger'
}

export function StatCard({ title, value, icon, accent = 'info' }: StatCardProps) {
  return (
    <article className={`metric-card metric-card--${accent} cr-metric-card`}>
      <div className="cr-metric-card__copy">
        <p className="metric-card__label">{title}</p>
        <h3 className="metric-card__value">{value}</h3>
      </div>
      <span className="metric-card__icon cr-metric-card__icon">
        <i className={`bi ${icon}`} />
      </span>
    </article>
  )
}