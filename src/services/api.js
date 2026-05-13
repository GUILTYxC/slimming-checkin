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
    console.log(`[API] 请求: ${options.method || 'GET'} ${url}`)
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`[API] 响应状态: ${response.status} ${response.statusText}`)
      
      const data = await response.json()
      console.log(`[API] 响应数据:`, data)

      if (!response.ok) {
        throw new Error(data.error || `请求失败 (${response.status})`)
      }

      return data
    } catch (error) {
      console.error(`[API] 请求失败:`, error)
      console.error(`[API] URL: ${url}`)
      console.error(`[API] 错误类型:`, error.name)
      console.error(`[API] 错误信息:`, error.message)
      throw error
    }
  }

  async register(username, password) {
    console.log(`[API] 尝试注册用户: ${username}`)
    try {
      const data = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      console.log(`[API] 注册成功:`, data)
      this.setToken(data.token)
      return data
    } catch (error) {
      console.error(`[API] 注册失败:`, error)
      throw error
    }
  }

  async login(username, password) {
    console.log(`[API] 尝试登录用户: ${username}`)
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      console.log(`[API] 登录成功:`, data)
      this.setToken(data.token)
      return data
    } catch (error) {
      console.error(`[API] 登录失败:`, error)
      throw error
    }
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