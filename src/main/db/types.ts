export type DBType = 'sqlite' | 'mysql' | 'postgresql'

export interface ConnectionConfig {
  id: string
  name: string
  type: DBType
  host?: string
  port?: number
  user?: string
  password?: string
  database: string
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  duration: number
}

export interface DBConnection {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(sql: string): Promise<QueryResult>
  getTables(): Promise<string[]>
  getColumns(table: string): Promise<ColumnInfo[]>
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
}
