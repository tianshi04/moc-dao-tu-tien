const METRICS = [
  { key: 'soil_moisture', label: 'Độ ẩm đất',  unit: '%',   color: '#3fa03f' },
  { key: 'temperature',   label: 'Nhiệt độ',    unit: '°C',  color: '#e67e22' },
  { key: 'light',         label: 'Ánh sáng',    unit: 'lux', color: '#f1c40f' },
  { key: 'humidity',      label: 'Độ ẩm KK',    unit: '%',   color: '#3498db' },
]

function SingleMetricChart({ metric, logs }) {
  // If the log is -999.0, it's an error and shouldn't be graphed as a 0 or -999 spike.
  // We can just filter out -999 values from the chart points.
  const validLogs = logs.filter(l => l[metric.key] != null && l[metric.key] !== -999.0 && l[metric.key] !== -999)
  const values = validLogs.map(l => l[metric.key])
  
  if (values.length === 0) {
    return (
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, color: metric.color, marginBottom: 12, paddingLeft: 4 }}>
          {metric.label} ({metric.unit})
        </h4>
        <div style={{
          height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', border: '1px dashed var(--border)'
        }}>
          Không có dữ liệu hợp lệ (hoặc cảm biến đang mất kết nối)
        </div>
      </div>
    )
  }

  const W = 640, H = 160
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1 || 1)) * innerW,
    y: PAD.top + (1 - (v - min) / range) * innerH,
    v,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length-1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`

  // Y axis labels
  const yLabels = [min, min + range * 0.5, max].map(v => ({
    y: PAD.top + (1 - (v - min) / range) * innerH,
    label: v.toFixed(0),
  }))

  // X axis labels (show first, mid, last timestamps from validLogs)
  const xSamples = [0, Math.floor(validLogs.length / 2), validLogs.length - 1]
    .filter((i, _, arr) => arr.indexOf(i) === arr.lastIndexOf(i) || i < validLogs.length)
    .map(i => ({
      x: PAD.left + (i / (validLogs.length - 1 || 1)) * innerW,
      label: validLogs[i]?.recorded_at
        ? new Date(validLogs[i].recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '',
    }))

  return (
    <div style={{ marginBottom: 32 }}>
      <h4 style={{ fontSize: 14, fontWeight: 500, color: metric.color, marginBottom: 12, paddingLeft: 4 }}>
        {metric.label} ({metric.unit})
      </h4>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metric.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yl.y} x2={PAD.left + innerW} y2={yl.y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={yl.y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">{yl.label}</text>
          </g>
        ))}
        
        {/* X axis labels */}
        {xSamples.map((xs, i) => (
          <text key={i} x={xs.x} y={PAD.top + innerH + 18} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{xs.label}</text>
        ))}
        
        {/* Area fill & Line */}
        {pts.length > 1 && <path d={areaD} fill={`url(#grad-${metric.key})`} />}
        {pts.length > 1 && <path d={pathD} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
        
        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={metric.color} stroke="white" strokeWidth="1.5">
            <title>{p.v.toFixed(1)} {metric.unit}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

export default function SensorChart({ logs }) {
  if (!logs || logs.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
          Lịch sử cảm biến
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {METRICS.map(m => (
          <SingleMetricChart key={m.key} metric={m} logs={logs} />
        ))}
      </div>
    </div>
  )
}
