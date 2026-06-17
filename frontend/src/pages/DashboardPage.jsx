import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { plantsApi, sseUrl } from '../services/api.js'
import toast from 'react-hot-toast'
import Navbar from '../components/ui/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import SensorCard from '../components/dashboard/SensorCard.jsx'
import SensorChart from '../components/dashboard/SensorChart.jsx'
import TuViBadge from '../components/plant/TuViBadge.jsx'

// Backend dùng sensor_key "light"; biểu đồ/Card dùng "light_level" → map qua lại.
const SENSOR_KEYS = ['soil_moisture', 'temperature', 'light', 'humidity']

export default function DashboardPage() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)
  const [sensorLogs, setSensorLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [live, setLive] = useState(false) // trạng thái kết nối SSE

  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newPlantName, setNewPlantName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const handleRename = async (e) => {
    e.preventDefault()
    if (!newPlantName.trim()) return
    setRenaming(true)
    try {
      await plantsApi.updatePlant({ name: newPlantName })
      toast.success('Đổi tên cây thành công!')
      setShowRenameModal(false)
      fetchData(true)
    } catch (error) {
      toast.error('Đổi tên thất bại')
    } finally {
      setRenaming(false)
    }
  }

  // Gộp lịch sử 4 cảm biến thành các hàng theo timestamp để vẽ chart
  const buildLogs = (histories) => {
    const byTime = new Map()
    const fieldOf = { soil_moisture: 'soil_moisture', temperature: 'temperature', light: 'light_level', humidity: 'humidity' }
    SENSOR_KEYS.forEach((key, idx) => {
      const res = histories[idx]
      if (res.status !== 'fulfilled') return
      const readings = res.value.data?.readings || []
      readings.forEach((r) => {
        const t = r.created_at
        const row = byTime.get(t) || { recorded_at: t }
        row[fieldOf[key]] = r.value
        byTime.set(t, row)
      })
    })
    return [...byTime.values()].sort(
      (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
    )
  }

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data } = await plantsApi.getDashboard()
      setDashboard(data)

      const histories = await Promise.allSettled(
        SENSOR_KEYS.map((key) => plantsApi.getHistory(key, 24))
      )
      setSensorLogs(buildLogs(histories).slice(-40))
    } catch (err) {
      const status = err.response?.status
      // 404 = chưa liên kết cây → chuyển sang trang claim
      if (status === 404) {
        navigate('/claim', { replace: true })
        return
      }
      if (!silent) toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Tải dữ liệu ban đầu (dashboard + lịch sử cho chart)
  useEffect(() => {
    fetchData()
  }, [])

  // Áp dụng 1 event SSE vào state (thay cho polling 30s trước đây)
  const applySensorUpdate = (payload) => {
    const fieldOf = { soil_moisture: 'soil_moisture', temperature: 'temperature', light: 'light_level', humidity: 'humidity' }
    const ts = payload.device_last_seen || new Date().toISOString()

    // 1. Cập nhật chỉ số hiện tại trên các SensorCard
    setDashboard((prev) => {
      if (!prev) return prev
      const sensors = [...(prev.sensors || [])]
      Object.entries(payload.sensors || {}).forEach(([key, { value, quality }]) => {
        const idx = sensors.findIndex((s) => s.sensor_key === key)
        const entry = { sensor_key: key, value, quality, updated_at: ts }
        if (idx >= 0) sensors[idx] = entry
        else sensors.push(entry)
      })
      return {
        ...prev,
        sensors,
        overall_quality: payload.overall_quality ?? prev.overall_quality,
        device_online: true,
        device_last_seen: ts,
      }
    })

    // 2. Thêm 1 điểm mới vào biểu đồ xu hướng
    setSensorLogs((prev) => {
      const row = { recorded_at: ts }
      Object.entries(payload.sensors || {}).forEach(([key, { value }]) => {
        row[fieldOf[key] || key] = value
      })
      return [...prev, row].slice(-40)
    })
  }

  const applyExpUpdate = (payload) => {
    setDashboard((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        total_exp: payload.total_exp ?? prev.total_exp,
        current_rank: prev.current_rank
          ? { ...prev.current_rank, name: payload.rank_name ?? prev.current_rank.name, order: payload.rank_order ?? prev.current_rank.order }
          : prev.current_rank,
      }
    })
    if (payload.breakthrough) {
      toast.success(`🌟 Đột phá Cảnh Giới: ${payload.rank_name}!`)
    }
  }

  // Kết nối SSE real-time khi đã biết plant_id
  const plantId = dashboard?.plant_id
  useEffect(() => {
    if (!plantId) return

    const es = new EventSource(sseUrl(plantId))

    es.onopen = () => setLive(true)
    es.onerror = () => setLive(false) // EventSource sẽ tự kết nối lại

    es.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)
        if (event === 'sensor_update') applySensorUpdate(data)
        else if (event === 'exp_update') applyExpUpdate(data)
      } catch {
        // Bỏ qua message không hợp lệ / heartbeat
      }
    }

    return () => es.close()
  }, [plantId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <div style={{ paddingTop: 80 }}>
        <Spinner fullscreen />
      </div>
    </div>
  )

  // Map sensors[] → tra cứu nhanh theo sensor_key
  const sensorMap = {}
  ;(dashboard?.sensors || []).forEach((s) => { sensorMap[s.sensor_key] = s })
  const lastUpdated = (dashboard?.sensors || [])
    .map((s) => s.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1)

  // Tính thanh EXP
  const totalExp = dashboard?.total_exp ?? 0
  const currentRankMinExp = dashboard?.current_rank?.min_exp ?? 0
  const nextRankMinExp = dashboard?.next_rank?.min_exp ?? null
  const expProgress = nextRankMinExp !== null
    ? Math.min(100, ((totalExp - currentRankMinExp) / (nextRankMinExp - currentRankMinExp)) * 100)
    : 100
  const expToNext = dashboard?.exp_to_next_rank ?? null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px', animation: 'fadeUp 0.4s ease both' }}>

        {/* Plant header card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 28px 24px',
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Top row: plant info + actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 64, height: 64,
                background: 'var(--green-50)',
                border: '1.5px solid var(--green-200)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30,
                flexShrink: 0,
              }}>
                🪴
              </div>
              <div>
                <h1 style={{ fontSize: 26, marginBottom: 4, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {dashboard?.plant_name || 'Chậu cây của tôi'}
                  <button
                    onClick={() => { setNewPlantName(dashboard?.plant_name || ''); setShowRenameModal(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: 'var(--text-muted)' }}
                    title="Đổi tên cây"
                  >
                    ✏️
                  </button>
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'var(--green-50)',
                    border: '1px solid var(--green-200)',
                    color: 'var(--text-secondary)',
                    borderRadius: 20,
                    padding: '2px 10px',
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}>
                    {dashboard?.plant_type?.name || 'Không rõ loài'}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-soft)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}>
                    Cảnh giới: {dashboard?.current_rank?.name || '—'}
                  </span>
                  <span style={{
                    fontSize: 11.5,
                    color: dashboard?.device_online ? 'var(--green-600)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: dashboard?.device_online ? 'var(--green-500)' : '#c0392b',
                      display: 'inline-block',
                    }} />
                    {dashboard?.device_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 11.5,
                color: live ? 'var(--green-600)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
                title={live ? 'Đang nhận dữ liệu real-time (SSE)' : 'Mất kết nối real-time, đang thử lại…'}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: live ? 'var(--green-500)' : 'var(--text-muted)',
                  display: 'inline-block',
                  animation: live ? 'pulse 1.6s ease-in-out infinite' : 'none',
                }} />
                {live ? 'Live' : 'Offline'}
              </span>
              <TuViBadge value={dashboard?.total_exp || 0} />
              <button
                onClick={() => fetchData(true)}
                title="Làm mới dữ liệu"
                style={{
                  width: 36, height: 36,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-400)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
                  <path d="M13.6 2.4A7 7 0 1 0 14.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <polyline points="10,0 14.5,2.5 12,7" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {/* EXP bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                Tu Vi (EXP)
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {totalExp.toLocaleString('vi-VN')}
                {nextRankMinExp !== null && (
                  <> / {nextRankMinExp.toLocaleString('vi-VN')} EXP</>
                )}
              </span>
            </div>
            <div style={{
              position: 'relative',
              height: 10,
              background: 'var(--bg-soft)',
              borderRadius: 99,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: `${expProgress}%`,
                background: nextRankMinExp === null
                  ? 'linear-gradient(90deg, var(--green-400), var(--green-600))'
                  : 'linear-gradient(90deg, var(--green-300), var(--green-500))',
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {dashboard?.current_rank?.name || '—'}
              </span>
              {nextRankMinExp !== null ? (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {expToNext !== null && expToNext > 0
                    ? `Còn ${expToNext.toLocaleString('vi-VN')} EXP → `
                    : ''}
                  {dashboard?.next_rank?.name}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--green-600)', fontWeight: 500 }}>
                  Cảnh giới tối cao ✦
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sensor cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}>
          <SensorCard
            label="Độ ẩm đất" value={sensorMap.soil_moisture?.value ?? null}
            quality={sensorMap.soil_moisture?.quality}
            unit="%" icon="💧" min={0} max={100}
          />
          <SensorCard
            label="Nhiệt độ" value={sensorMap.temperature?.value ?? null}
            quality={sensorMap.temperature?.quality}
            unit="°C" icon="🌡️" min={10} max={45}
          />
          <SensorCard
            label="Ánh sáng" value={sensorMap.light?.value ?? null}
            quality={sensorMap.light?.quality}
            unit="lux" icon="☀️" min={0} max={10000}
          />
          <SensorCard
            label="Độ ẩm KK" value={sensorMap.humidity?.value ?? null}
            quality={sensorMap.humidity?.quality}
            unit="%" icon="🌫️" min={0} max={100}
          />
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'right' }}>
            Cập nhật lần cuối: {new Date(lastUpdated).toLocaleString('vi-VN')}
          </p>
        )}

        {/* Sensor chart */}
        {sensorLogs.length > 0 && <SensorChart logs={sensorLogs} />}

        {(dashboard?.sensors || []).length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', marginBottom: 6 }}>
              Chưa có dữ liệu cảm biến
            </p>
            <p style={{ fontSize: 13 }}>Thiết bị IoT chưa gửi dữ liệu về máy chủ</p>
          </div>
        )}

        {/* Plant info footer */}
        <div style={{
          marginTop: 24,
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
          fontSize: 12.5, color: 'var(--text-muted)',
        }}>
          <span>
            Thiết bị: {dashboard?.device_last_seen
              ? new Date(dashboard.device_last_seen).toLocaleString('vi-VN')
              : 'chưa kết nối'}
          </span>
        </div>
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-surface)', padding: 24, borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 18, color: 'var(--text-primary)' }}>Đổi tên cây</h3>
            <form onSubmit={handleRename}>
              <input
                type="text"
                value={newPlantName}
                onChange={e => setNewPlantName(e.target.value)}
                placeholder="Nhập tên mới..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', marginBottom: 20,
                  fontSize: 15, background: 'var(--bg-base)', color: 'var(--text-primary)'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  style={{
                    padding: '8px 16px', background: 'var(--bg-soft)', color: 'var(--text-primary)',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={renaming || !newPlantName.trim()}
                  style={{
                    padding: '8px 16px', background: 'var(--accent)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    opacity: (renaming || !newPlantName.trim()) ? 0.7 : 1
                  }}
                >
                  {renaming ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
