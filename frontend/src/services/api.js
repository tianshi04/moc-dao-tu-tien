import axios from 'axios'

// Prefix /api được Vite proxy forward sang backend FastAPI (giữ nguyên /api).
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: BASE_URL,
})

// Gắn access token vào mọi request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tự refresh khi gặp 401 (một lần), rồi retry request gốc
let refreshing = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // Không xử lý nếu không phải 401, đã retry, hoặc chính request refresh bị 401
    if (
      status !== 401 ||
      original?._retry ||
      original?.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) {
      tokenStore.clear()
      return Promise.reject(error)
    }

    original._retry = true
    try {
      // Gộp nhiều request 401 cùng lúc vào 1 lần refresh
      refreshing =
        refreshing ||
        axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
      const { data } = await refreshing
      refreshing = null

      tokenStore.set(data.access_token, data.refresh_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (e) {
      refreshing = null
      tokenStore.clear()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(e)
    }
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
// Backend: POST /api/auth/google { id_token } → { access_token, refresh_token }
export const authApi = {
  loginWithGoogle: (idToken) => api.post('/auth/google', { id_token: idToken }),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
}

// ─── Plants (hỗ trợ 1 user = N cây) ──────────────────────────────────────────
export const plantsApi = {
  // GET /api/plants/types → danh sách loại cây để chọn khi liên kết
  getPlantTypes: () => api.get('/plants/types'),

  // GET /api/plants → lấy danh sách tất cả các cây của user
  listPlants: () => api.get('/plants'),

  // GET /api/plants/{plant_id}/dashboard → chỉ số, Tu Vi, Cảnh Giới, sensors hiện tại
  getDashboard: (plantId) => api.get(`/plants/${plantId}/dashboard`),

  // GET /api/plants/{plant_id}/history?sensor_key=&hours= → time series 1 loại cảm biến
  getHistory: (plantId, sensorKey, hours = 24) =>
    api.get(`/plants/${plantId}/history`, { params: { sensor_key: sensorKey, hours } }),

  // POST /api/plants/pair { plant_code, verify_code, name, plant_type_id }
  pairPlant: ({ plant_code, verify_code, name, plant_type_id }) =>
    api.post('/plants/pair', { plant_code, verify_code, name, plant_type_id }),

  // PUT /api/plants/{plant_id} { name?, plant_type_id? }
  updatePlant: (plantId, payload) => api.put(`/plants/${plantId}`, payload),
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboardApi = {
  getLeaderboard: (limit = 20) => api.get('/leaderboard', { params: { limit } }),
}

// ─── Admin (yêu cầu role = "admin") ───────────────────────────────────────────
export const adminApi = {
  // GET /api/admin/dashboard → thống kê tổng quan hệ thống
  getDashboard: () => api.get('/admin/dashboard'),

  // Quản lý thiết bị IoT
  listDevices: () => api.get('/admin/devices'),
  createDevice: () => api.post('/admin/devices'), // tự sinh Plant Code + Verify Code
  updateDevice: (deviceId, isActive) =>
    api.put(`/admin/devices/${deviceId}`, { is_active: isActive }),

  // Quản lý loại cây & ngưỡng lý tưởng
  listPlantTypes: () => api.get('/admin/plant-types'),
  createPlantType: (payload) => api.post('/admin/plant-types', payload),
  updatePlantType: (typeId, payload) =>
    api.put(`/admin/plant-types/${typeId}`, payload),
  deletePlantType: (typeId) => api.delete(`/admin/plant-types/${typeId}`),

  // Cấu hình hệ số Tu Vi (EXP)
  getExpConfig: () => api.get('/admin/exp-config'),
  updateExpConfig: (configs) => api.put('/admin/exp-config', { configs }),

  // Cấu hình mốc Cảnh Giới (Rank)
  getRankConfig: () => api.get('/admin/rank-config'),
  updateRankConfig: (ranks) => api.put('/admin/rank-config', { ranks }),
}

// ─── SSE (Server-Sent Events) ─────────────────────────────────────────────────
// Trả về URL stream real-time cho 1 cây. EventSource không gửi được header Auth
// nên endpoint /api/events/{plant_id} ở backend không yêu cầu JWT.
export const sseUrl = (plantId) => `${BASE_URL}/events/${plantId}`
