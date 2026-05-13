import { useState, useEffect } from 'react'
import api from '../services/api'

export default function DebugPanel({ isOpen, onClose }) {
  const [logs, setLogs] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('testing')

  useEffect(() => {
    if (isOpen) {
      testConnection()
    }
  }, [isOpen])

  const testConnection = async () => {
    setConnectionStatus('testing')
    addLog('开始测试后端连接...')
    
    try {
      // 测试健康检查端点
      const healthUrl = `${api.baseUrl}/health`
      addLog(`测试健康检查: ${healthUrl}`)
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        addLog(`✅ 后端连接成功: ${JSON.stringify(data)}`)
        setConnectionStatus('connected')
      } else {
        addLog(`❌ 后端响应错误: ${response.status} ${response.statusText}`)
        setConnectionStatus('error')
      }
    } catch (error) {
      addLog(`❌ 连接失败: ${error.message}`)
      addLog(`错误类型: ${error.name}`)
      if (error.message.includes('Failed to fetch')) {
        addLog('可能原因:')
        addLog('1. 后端服务未启动')
        addLog('2. 网络连接问题')
        addLog('3. CORS配置问题')
        addLog('4. 防火墙阻止连接')
      }
      setConnectionStatus('error')
    }
  }

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message }])
  }

  const clearLogs = () => {
    setLogs([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-zinc-800">调试面板</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={testConnection}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              测试连接
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1.5 text-sm bg-zinc-500 text-white rounded-lg hover:bg-zinc-600"
            >
              清除日志
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-zinc-600">连接状态:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : connectionStatus === 'error' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
              {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'error' ? '连接失败' : '测试中...'}
            </span>
          </div>
          <div className="mt-2 text-sm text-zinc-500">
            API地址: {api.baseUrl}
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                <span className="text-zinc-400">[{log.timestamp}]</span>
                <span className="ml-2 text-zinc-700">{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-sm text-zinc-500 text-center py-8">
                点击"测试连接"开始诊断
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-zinc-50 rounded-b-xl">
          <div className="text-sm text-zinc-600">
            <p className="font-medium mb-2">调试提示:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-500">
              <li>按F12或Ctrl+Shift+I打开开发者工具</li>
              <li>在Console标签页查看详细日志</li>
              <li>在Network标签页查看网络请求</li>
              <li>检查后端服务是否运行在端口3001</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}