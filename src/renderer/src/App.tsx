import React from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Editor } from './components/Editor/Editor'
import { ResultGrid } from './components/ResultGrid/ResultGrid'
import { useAppStore } from './store/appStore'

export default function App(): JSX.Element {
  const {
    tabs,
    activeTabId,
    activeConnectionId,
    results,
    error,
    isExecuting,
    addTab,
    closeTab,
    setActiveTab,
    updateTabSql,
    setResults,
    setError,
    setIsExecuting
  } = useAppStore()

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const executeQuery = async (): Promise<void> => {
    if (!activeTab || !activeConnectionId) {
      setError('Please connect to a database first.')
      return
    }
    const sql = activeTab.sql.trim()
    if (!sql) return

    setIsExecuting(true)
    setError(null)
    setResults(null)

    const res = await window.api.query.execute(activeConnectionId, sql)
    if (res.success && res.result) {
      setResults(res.result)
    } else {
      setError(res.error ?? 'Unknown error')
    }
    setIsExecuting(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab bar */}
        <div className="flex items-center bg-gray-100 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-2 text-sm text-gray-800 cursor-pointer border-r whitespace-nowrap ${
                tab.id === activeTabId ? 'bg-white font-medium' : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.title}</span>
              <button
                className="text-gray-400 hover:text-gray-700 leading-none"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-200"
            onClick={addTab}
          >
            +
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b text-sm text-gray-800">
          <button
            className={`px-3 py-1 rounded text-white text-xs font-medium ${
              isExecuting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
            onClick={executeQuery}
            disabled={isExecuting}
          >
            {isExecuting ? 'Running…' : '▶ Run  (Ctrl+Enter)'}
          </button>
          {!activeConnectionId && (
            <span className="text-xs text-amber-600">No connection selected</span>
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="h-1/2 min-h-[120px]">
            {activeTab && (
              <Editor
                key={activeTab.id}
                tabId={activeTab.id}
                sql={activeTab.sql}
                onChange={(sql) => updateTabSql(activeTab.id, sql)}
                onExecute={executeQuery}
              />
            )}
          </div>

          {/* Result area */}
          <div className="h-1/2 min-h-[80px] border-t overflow-hidden">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm font-mono whitespace-pre-wrap">{error}</div>
            )}
            {results && !error && (
              <ResultGrid result={results} duration={results.duration} />
            )}
            {!results && !error && !isExecuting && (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Run a query to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
