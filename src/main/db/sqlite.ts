import Database from 'better-sqlite3'
import type { DBConnection, QueryResult, ColumnInfo, ConnectionConfig } from './types'

export class SQLiteConnection implements DBConnection {
  private db: Database.Database | null = null
  private config: ConnectionConfig

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    this.db = new Database(this.config.database)
  }

  async disconnect(): Promise<void> {
    this.db?.close()
    this.db = null
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')
    const start = Date.now()

    const stmt = this.db.prepare(sql)
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT') ||
                     sql.trim().toUpperCase().startsWith('WITH') ||
                     sql.trim().toUpperCase().startsWith('PRAGMA')

    if (isSelect) {
      const rows = stmt.all() as Record<string, unknown>[]
      const columns = rows.length > 0 ? Object.keys(rows[0]) : stmt.columns().map((c) => c.name)
      return { columns, rows, rowCount: rows.length, duration: Date.now() - start }
    } else {
      const info = stmt.run()
      return {
        columns: ['affected_rows'],
        rows: [{ affected_rows: info.changes }],
        rowCount: info.changes,
        duration: Date.now() - start
      }
    }
  }

  async getTables(): Promise<string[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[]
    return rows.map((r) => r.name)
  }

  async getColumns(table: string): Promise<ColumnInfo[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare(`PRAGMA table_info(${table})`).all() as {
      name: string
      type: string
      notnull: number
      dflt_value: string | null
      pk: number
    }[]
    return rows.map((r) => ({
      name: r.name,
      type: r.type,
      nullable: r.notnull === 0,
      defaultValue: r.dflt_value,
      isPrimaryKey: r.pk > 0
    }))
  }
}
