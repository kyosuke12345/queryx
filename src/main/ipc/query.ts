import { ipcMain } from 'electron'
import Store from 'electron-store'
import { getConnection } from './connection'

interface HistoryEntry {
  id: string
  sql: string
  connectionId: string
  executedAt: string
  duration: number
  error?: string
}

const historyStore = new Store<{ history: HistoryEntry[] }>({
  name: 'query-history',
  defaults: { history: [] }
})

export function registerQueryHandlers(): void {
  ipcMain.handle('query:execute', async (_event, { connectionId, sql }: { connectionId: string; sql: string }) => {
    const conn = getConnection(connectionId)
    if (!conn) return { success: false, error: 'Not connected. Please connect first.' }

    try {
      const result = await conn.query(sql)
      addHistory({ sql, connectionId, duration: result.duration })
      return { success: true, result }
    } catch (err) {
      const message = (err as Error).message
      addHistory({ sql, connectionId, duration: 0, error: message })
      return { success: false, error: message }
    }
  })

  ipcMain.handle('query:history', (_event, connectionId?: string) => {
    const history = historyStore.get('history')
    if (connectionId) return history.filter((h) => h.connectionId === connectionId)
    return history
  })
}

function addHistory(entry: Omit<HistoryEntry, 'id' | 'executedAt'>): void {
  const history = historyStore.get('history')
  history.unshift({
    ...entry,
    id: Date.now().toString(),
    executedAt: new Date().toISOString()
  })
  if (history.length > 500) history.splice(500)
  historyStore.set('history', history)
}
