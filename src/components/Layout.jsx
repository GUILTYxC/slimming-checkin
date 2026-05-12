import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import syncService from '../services/sync'
import TitleBar from './TitleBar'

export default function Layout() {
  const location = useLocation()
  const match = location.pathname.match(/\/period\/(\d+)/)
  const periodId = match ? match[1] : null
  const { user, logout } = useAuth()
  const [syncState, setSyncState] = useState({ syncing: false, error: null, lastSync: null })

  useEffect(() => {
    const unsubscribe = syncService.onSyncStateChange(setSyncState)
    syncService.startAutoSync()
    return () => {
      unsubscribe()
      syncService.stopAutoSync()
    }
  }, [])

  const handleLogout = () => {
    syncService.stopAutoSync()
    logout()
  }

  const handleManualSync = () => {
    syncService.sync()
  }

  const formatSyncTime = (time) => {
    if (!time) return '从未同步'
    const d = new Date(time)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return '刚刚同步'
    if (diffMin < 60) return `${diffMin}分钟前同步`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}小时前同步`
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-50">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-52 bg-white border-r border-zinc-100 flex flex-col flex-shrink-0 min-h-0">
          <div className="px-5 py-4 flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2.5 truncate">
              <span className="text-xl flex-shrink-0">⚖</span>
              <h1 className="text-sm font-bold text-zinc-700 tracking-tight truncate">减重追踪</h1>
            </NavLink>
          </div>

          <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto overflow-x-hidden min-h-0">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 truncate ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                }`
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="truncate">首页</span>
            </NavLink>

            {periodId && (
              <>
                <div className="pt-3 pb-1 flex-shrink-0">
                  <p className="px-3 text-[10px] font-medium text-zinc-400 uppercase tracking-wider truncate">
                    当前计划
                  </p>
                </div>

                <NavLink
                  to={`/period/${periodId}`}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 truncate ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                    }`
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span className="truncate">仪表盘</span>
                </NavLink>

                <NavLink
                  to={`/period/${periodId}/daily`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 truncate ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                    }`
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  <span className="truncate">每日打卡</span>
                </NavLink>

                <NavLink
                  to={`/period/${periodId}/weekly`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 truncate ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                    }`
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span className="truncate">周总结</span>
                </NavLink>

                <NavLink
                  to={`/period/${periodId}/stats`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 truncate ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                    }`
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span className="truncate">统计</span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="px-4 py-3 border-t border-zinc-50 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={syncState.syncing}
                className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
                title="手动同步"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`flex-shrink-0 ${syncState.syncing ? 'animate-spin' : ''}`}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                <span>{syncState.syncing ? '同步中...' : '同步'}</span>
              </button>
              {syncState.error && (
                <span className="text-[10px] text-rose-400 truncate" title={syncState.error}>失败</span>
              )}
            </div>
            <p className="text-[10px] text-zinc-300 truncate">{formatSyncTime(syncState.lastSync)}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 truncate">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="text-[11px] text-zinc-400 hover:text-rose-500 transition-colors flex-shrink-0"
              >
                退出
              </button>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="p-6 w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}