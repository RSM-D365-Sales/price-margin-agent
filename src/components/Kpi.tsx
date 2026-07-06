interface KpiProps {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'red' | 'sage'
}

export function Kpi({ label, value, sub, tone = 'default' }: KpiProps) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${tone !== 'default' ? ' ' + tone : ''}`}>{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  )
}
