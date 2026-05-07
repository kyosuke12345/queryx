import { ipcMain, safeStorage } from 'electron'
import Store from 'electron-store'
import { createConnection } from '../db'
import type { ConnectionConfig, DBConnection } from '../db'

const store = new Store<{ connections: ConnectionConfig[] }>({
  defaults: { connections: [] }
})

const activeConnections = new Map<string, DBConnection>()

export function registerConnectionHandlers(): void {
  ipcMain.handle('connection:list', () => {
    return store.get('connections').map((c) => ({ ...c, password: undefined }))
  })

  ipcMain.handle('connection:save', (_event, config: ConnectionConfig) => {
    const connections = store.get('connections')
    const encryptedConfig = { ...config }
    if (config.password && safeStorage.isEncryptionAvailable()) {
      encryptedConfig.password = safeStorage.encryptString(config.password).toString('base64')
    }
    const idx = connections.findIndex((c) => c.id === config.id)
    if (idx >= 0) {
      connections[idx] = encryptedConfig
    } else {
      connections.push(encryptedConfig)
    }
    store.set('connections', connections)
    return { success: true }
  })

  ipcMain.handle('connection:delete', (_event, id: string) => {
    const connections = store.get('connections').filter((c) => c.id !== id)
    store.set('connections', connections)
    const conn = activeConnections.get(id)
    if (conn) {
      conn.disconnect().catch(() => {})
      activeConnections.delete(id)
    }
    return { success: true }
  })

  ipcMain.handle('connection:test', async (_event, config: ConnectionConfig) => {
    const conn = createConnection(config)
    try {
      await conn.connect()
      await conn.disconnect()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('connection:connect', async (_event, id: string) => {
    const connections = store.get('connections')
    const stored = connections.find((c) => c.id === id)
    if (!stored) return { success: false, error: 'Connection not found' }

    const config = { ...stored }
    if (config.password && safeStorage.isEncryptionAvailable()) {
      try {
        config.password = safeStorage.decryptString(Buffer.from(config.password, 'base64'))
      } catch {
        // password may not be encrypted (legacy)
      }
    }

    if (activeConnections.has(id)) {
      await activeConnections.get(id)!.disconnect()
      activeConnections.delete(id)
    }

    const conn = createConnection(config)
    try {
      await conn.connect()
      activeConnections.set(id, conn)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('connection:disconnect', async (_event, id: string) => {
    const conn = activeConnections.get(id)
    if (conn) {
      await conn.disconnect()
      activeConnections.delete(id)
    }
    return { success: true }
  })
}

export function getConnection(id: string): DBConnection | undefined {
  return activeConnections.get(id)
}
