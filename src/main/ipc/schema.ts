import { ipcMain } from 'electron'
import { getConnection } from './connection'

export function registerSchemaHandlers(): void {
  ipcMain.handle('schema:tables', async (_event, connectionId: string) => {
    const conn = getConnection(connectionId)
    if (!conn) return { success: false, error: 'Not connected' }
    try {
      const tables = await conn.getTables()
      return { success: true, tables }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('schema:columns', async (_event, { connectionId, table }: { connectionId: string; table: string }) => {
    const conn = getConnection(connectionId)
    if (!conn) return { success: false, error: 'Not connected' }
    try {
      const columns = await conn.getColumns(table)
      return { success: true, columns }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}
