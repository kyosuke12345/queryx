import mysql from 'mysql2/promise'
import type { DBConnection, QueryResult, ColumnInfo, ConnectionConfig } from './types'

export class MySQLConnection implements DBConnection {
  private connection: mysql.Connection | null = null
  private config: ConnectionConfig

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      multipleStatements: false
    })
  }

  async disconnect(): Promise<void> {
    await this.connection?.end()
    this.connection = null
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.connection) throw new Error('Not connected')
    const start = Date.now()
    const [rows, fields] = await this.connection.execute(sql)

    if (Array.isArray(rows)) {
      const columns = fields ? (fields as mysql.FieldPacket[]).map((f) => f.name) : []
      const resultRows = rows as Record<string, unknown>[]
      return { columns, rows: resultRows, rowCount: resultRows.length, duration: Date.now() - start }
    } else {
      const result = rows as mysql.ResultSetHeader
      return {
        columns: ['affected_rows'],
        rows: [{ affected_rows: result.affectedRows }],
        rowCount: result.affectedRows,
        duration: Date.now() - start
      }
    }
  }

  async getTables(): Promise<string[]> {
    if (!this.connection) throw new Error('Not connected')
    const [rows] = await this.connection.execute(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name'
    )
    return (rows as { table_name: string }[]).map((r) => r.table_name)
  }

  async getColumns(table: string): Promise<ColumnInfo[]> {
    if (!this.connection) throw new Error('Not connected')
    const [rows] = await this.connection.execute(
      'SELECT column_name, column_type, is_nullable, column_default, column_key FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ordinal_position',
      [table]
    )
    return (
      rows as {
        column_name: string
        column_type: string
        is_nullable: string
        column_default: string | null
        column_key: string
      }[]
    ).map((r) => ({
      name: r.column_name,
      type: r.column_type,
      nullable: r.is_nullable === 'YES',
      defaultValue: r.column_default,
      isPrimaryKey: r.column_key === 'PRI'
    }))
  }
}
