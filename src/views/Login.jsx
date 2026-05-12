import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('请填写所有字段')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度不能少于6个字符')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        await register(username.trim(), password)
      } else {
        await login(username.trim(), password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚖</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">减重追踪</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isRegister ? '创建账号以同步您的数据' : '登录以同步您的数据'}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="stat-label mb-1.5 block">用户名</label>
              <input
                type="text"
                className="input-field"
                placeholder="输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="stat-label mb-1.5 block">密码</label>
              <input
                type="password"
                className="input-field"
                placeholder={isRegister ? '至少6个字符' : '输入密码'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {isRegister && (
              <div>
                <label className="stat-label mb-1.5 block">确认密码</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-100 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
                setConfirmPassword('')
              }}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-400 mt-6">
          数据将自动同步到云端，离线时可正常使用
        </p>
      </div>
    </div>
  )
}