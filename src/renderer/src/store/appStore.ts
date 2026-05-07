import { create } from 'zustand'

export interface Connection {
  id: string
  name: string
  type: 'sqlite' | 'mysql' | 'postgresql'
  host?: string
  port?: number
  user?: string
  database: string
}

export interface QueryTab {
  id: string
  title: string
  sql: string
  connectionId: string | null
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  duration: number
}

interface AppState {
  connections: Connection[]
  activeConnectionId: string | null
  connectedIds: Set<string>
  tables: string[]
  tabs: QueryTab[]
  activeTabId: string
  results: QueryResult | null
  error: string | null
  isExecuting: boolean

  setConnections: (connections: Connection[]) => void
  setActiveConnectionId: (id: string | null) => void
  addConnectedId: (id: string) => void
  removeConnectedId: (id: string) => void
  setTables: (tables: string[]) => void
  addTab: () => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabSql: (id: string, sql: string) => void
  setResults: (results: QueryResult | null) => void
  setError: (error: string | null) => void
  setIsExecuting: (v: boolean) => void
}

let tabCounter = 1

export const useAppStore = create<AppState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  connectedIds: new Set(),
  tables: [],
  tabs: [{ id: '1', title: 'Query 1', sql: '', connectionId: null }],
  activeTabId: '1',
  results: null,
  error: null,
  isExecuting: false,

  setConnections: (connections) => set({ connections }),
  setActiveConnectionId: (id) => set({ activeConnectionId: id }),
  addConnectedId: (id) =>
    set((s) => ({ connectedIds: new Set([...s.connectedIds, id]) })),
  removeConnectedId: (id) =>
    set((s) => {
      const next = new Set(s.connectedIds)
      next.delete(id)
      return { connectedIds: next }
    }),
  setTables: (tables) => set({ tables }),

  addTab: () => {
    tabCounter++
    const id = String(tabCounter)
    const activeConn = get().activeConnectionId
    set((s) => ({
      tabs: [...s.tabs, { id, title: `Query ${tabCounter}`, sql: '', connectionId: activeConn }],
      activeTabId: id
    }))
  },
  closeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id)
      if (tabs.length === 0) {
        tabCounter++
        const newId = String(tabCounter)
        return {
          tabs: [{ id: newId, title: `Query ${tabCounter}`, sql: '', connectionId: s.activeConnectionId }],
          activeTabId: newId
        }
      }
      const activeTabId =
        s.activeTabId === id ? tabs[Math.max(0, s.tabs.findIndex((t) => t.id === id) - 1)].id : s.activeTabId
      return { tabs, activeTabId }
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  updateTabSql: (id, sql) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, sql } : t)) })),
  setResults: (results) => set({ results }),
  setError: (error) => set({ error }),
  setIsExecuting: (v) => set({ isExecuting: v })
}))
