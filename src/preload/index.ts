import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  connection: {
    list: () => ipcRenderer.invoke('connection:list'),
    save: (config: unknown) => ipcRenderer.invoke('connection:save', config),
    delete: (id: string) => ipcRenderer.invoke('connection:delete', id),
    test: (config: unknown) => ipcRenderer.invoke('connection:test', config),
    connect: (id: string) => ipcRenderer.invoke('connection:connect', id),
    disconnect: (id: string) => ipcRenderer.invoke('connection:disconnect', id)
  },
  query: {
    execute: (connectionId: string, sql: string) =>
      ipcRenderer.invoke('query:execute', { connectionId, sql }),
    history: (connectionId?: string) => ipcRenderer.invoke('query:history', connectionId)
  },
  schema: {
    tables: (connectionId: string) => ipcRenderer.invoke('schema:tables', connectionId),
    columns: (connectionId: string, table: string) =>
      ipcRenderer.invoke('schema:columns', { connectionId, table })
  }
})
