import { Client } from 'pg'
import type { DBConnection, QueryResult, ColumnInfo, ConnectionConfig } from './types'

export class PostgreSQLConnection implements DBConnection {
  private client: Client | null = null
  private config: ConnectionConfig

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    this.client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database
    })
    await this.client.connect()
  }

  async disconnect(): Promise<void> {
    await this.client?.end()
    this.client = null
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.client) throw new Error('Not connected')
    const start = Date.now()
    const result = await this.client.query(sql)
    const columns = result.fields.map((f) => f.name)
    return {
      columns,
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
      duration: Date.now() - start
    }
  }

  async getTables(): Promise<string[]> {
    if (!this.client) throw new Error('Not connected')
    const result = await this.client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    )
    return result.rows.map((r) => r.tablename)
  }

  async getColumns(table: string): Promise<ColumnInfo[]> {
    if (!this.client) throw new Error('Not connected')
    const result = await this.client.query(
      `SELECT c.column_name, c.data_type, c.is_nullable, c.column_default,
              (SELECT COUNT(*) FROM information_schema.table_constraints tc
               JOIN information_schema.constraint_column_usage ccu USING (constraint_schema, constraint_name)
               WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1 AND ccu.column_name = c.column_name) > 0 AS is_pk
       FROM information_schema.columns c
       WHERE c.table_name = $1 AND c.table_schema = 'public'
       ORDER BY c.ordinal_position`,
      [table]
    )
    return result.rows.map((r) => ({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === 'YES',
      defaultValue: r.column_default,
      isPrimaryKey: r.is_pk
    }))
  }
}
