export const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      {Icon && <Icon size={21} className="mt-1 shrink-0 text-accent-blue" />}
      <div>
        <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
)

export const StatCard = ({ icon: Icon, label, value, detail, tone = 'bg-[linear-gradient(135deg,#4f7df3,#8b5cf6)]' }) => (
  <div className="glass-card min-h-[112px] p-5">
    <div className="flex items-center gap-4">
      {Icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={22} color="white" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-1 text-2xl font-extrabold">{value}</p>
      </div>
    </div>
    {detail && <p className="mt-3 text-xs text-text-muted">{detail}</p>}
  </div>
)

export const StatusPill = ({ children, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-[rgba(79,125,243,0.12)] text-accent-blue border-[rgba(79,125,243,0.25)]',
    cyan: 'bg-[rgba(6,214,160,0.12)] text-accent-cyan border-[rgba(6,214,160,0.25)]',
    orange: 'bg-[rgba(245,158,11,0.12)] text-accent-orange border-[rgba(245,158,11,0.25)]',
    red: 'bg-[rgba(239,68,68,0.12)] text-accent-red border-[rgba(239,68,68,0.25)]',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.blue}`}>
      {children}
    </span>
  )
}

export const EmptyState = ({ title, detail }) => (
  <div className="rounded-lg border border-[rgba(79,125,243,0.12)] bg-bg-secondary px-4 py-8 text-center">
    <p className="font-semibold">{title}</p>
    {detail && <p className="mt-1 text-sm text-text-muted">{detail}</p>}
  </div>
)

export const IconButton = ({ icon: Icon, label, tone = 'blue', ...props }) => {
  const tones = {
    blue: 'border-[rgba(79,125,243,0.2)] bg-bg-secondary text-accent-blue hover:border-accent-blue',
    cyan: 'border-[rgba(6,214,160,0.25)] bg-[rgba(6,214,160,0.1)] text-accent-cyan hover:border-accent-cyan',
    orange: 'border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.1)] text-accent-orange hover:border-accent-orange',
    red: 'border-red-500/25 bg-red-500/10 text-accent-red hover:border-accent-red',
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`rounded-md border p-2 transition-colors ${tones[tone] || tones.blue}`}
      {...props}
    >
      <Icon size={16} />
    </button>
  )
}

export const BarChart = ({ data, color = 'bg-[linear-gradient(135deg,#4f7df3,#06d6a0)]' }) => {
  const max = Math.max(...data.map(item => item.value), 1)

  return (
    <div className="grid gap-4">
      {data.map(item => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-text-secondary">{item.label}</span>
            <span className="font-bold">{item.display || item.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-bg-card">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
