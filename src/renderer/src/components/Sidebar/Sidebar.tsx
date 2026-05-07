import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { ConnectionModal } from '../ConnectionModal/ConnectionModal'

export function Sidebar(): JSX.Element {
  const {
    connections,
    activeConnectionId,
    connectedIds,
    tables,
    setConnections,
    setActiveConnectionId,
    addConnectedId,
    removeConnectedId,
    setTables,
    setError
  } = useAppStore()

  const [showModal, setShowModal] = useState(false)
  const [expandedConn, setExpandedConn] = useState<string | null>(null)

  const loadConnections = async (): Promise<void> => {
    const list = await window.api.connection.list()
    setConnections(list as typeof connections)
  }

  React.useEffect(() => {
    loadConnections()
  }, [])

  const handleConnect = async (id: string): Promise<void> => {
    if (connectedIds.has(id)) {
      await window.api.connection.disconnect(id)
      removeConnectedId(id)
      if (activeConnectionId === id) {
        setActiveConnectionId(null)
        setTables([])
      }
      return
    }
    const res = await window.api.connection.connect(id)
    if (res.success) {
      addConnectedId(id)
      setActiveConnectionId(id)
      setExpandedConn(id)
      const schemaRes = await window.api.schema.tables(id)
      if (schemaRes.success) setTables(schemaRes.tables ?? [])
      else setError(schemaRes.error ?? 'Failed to load tables')
    } else {
      setError(res.error ?? 'Connection failed')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.connection.delete(id)
    loadConnections()
  }

  const handleTableClick = async (table: string): Promise<void> => {
    if (!activeConnectionId) return
    const res = await window.api.schema.columns(activeConnectionId, table)
    if (!res.success) return
  }

  return (
    <div className="w-60 min-w-[180px] bg-gray-900 text-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-sm font-semibold">Connections</span>
        <button
          className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded"
          onClick={() => setShowModal(true)}
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {connections.map((conn) => {
          const connected = connectedIds.has(conn.id)
          const isActive = activeConnectionId === conn.id
          const expanded = expandedConn === conn.id

          return (
            <div key={conn.id}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-gray-800 ${isActive ? 'bg-gray-800' : ''}`}
                onClick={() => handleConnect(conn.id)}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className="text-sm truncate flex-1">{conn.name}</span>
                <span className="text-xs text-gray-500 uppercase">{conn.type === 'postgresql' ? 'pg' : conn.type}</span>
                <button
                  className="text-gray-600 hover:text-red-400 text-xs ml-1"
                  onClick={(e) => { e.stopPropagation(); handleDelete(conn.id) }}
                >
                  ✕
                </button>
              </div>

              {connected && expanded && isActive && (
                <div className="pl-6">
                  {tables.length === 0 ? (
                    <p className="text-xs text-gray-500 py-1 px-2">No tables</p>
                  ) : (
                    tables.map((t) => (
                      <div
                        key={t}
                        className="text-xs py-0.5 px-2 hover:bg-gray-700 cursor-pointer truncate"
                        onClick={() => handleTableClick(t)}
                      >
                        {t}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <ConnectionModal
          initial={null}
          onClose={() => setShowModal(false)}
          onSaved={loadConnections}
        />
      )}
    </div>
  )
}
