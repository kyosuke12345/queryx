import type { ConnectionConfig, QueryResult, ColumnInfo } from '../main/db/types'

declare global {
  interface Window {
    api: {
      connection: {
        list(): Promise<Omit<ConnectionConfig, 'password'>[]>
        save(config: ConnectionConfig): Promise<{ success: boolean }>
        delete(id: string): Promise<{ success: boolean }>
        test(config: ConnectionConfig): Promise<{ success: boolean; error?: string }>
        connect(id: string): Promise<{ success: boolean; error?: string }>
        disconnect(id: string): Promise<{ success: boolean }>
      }
      query: {
        execute(connectionId: string, sql: string): Promise<{ success: boolean; result?: QueryResult; error?: string }>
        history(connectionId?: string): Promise<{ id: string; sql: string; executedAt: string; duration: number; error?: string }[]>
      }
      schema: {
        tables(connectionId: string): Promise<{ success: boolean; tables?: string[]; error?: string }>
        columns(connectionId: string, table: string): Promise<{ success: boolean; columns?: ColumnInfo[]; error?: string }>
      }
    }
  }
}
