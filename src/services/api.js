const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE
    this.token = localStorage.getItem('auth_token') || null
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken() {
    return this.token
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`)
    }

    return data
  }

  async register(username, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    this.setToken(data.token)
    return data
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    this.setToken(data.token)
    return data
  }

  async getMe() {
    return this.request('/auth/me')
  }

  async pullData(since) {
    const query = since ? `?since=${encodeURIComponent(since)}` : ''
    return this.request(`/sync/pull${query}`)
  }

  async pushData(payload) {
    return this.request('/sync/push', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async healthCheck() {
    return this.request('/health')
  }

  logout() {
    this.setToken(null)
    localStorage.removeItem('last_sync_time')
  }

  isLoggedIn() {
    return !!this.token
  }
}

const api = new ApiClient()
export default api