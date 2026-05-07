import type { ConnectionConfig, DBConnection } from './types'
import { SQLiteConnection } from './sqlite'
import { MySQLConnection } from './mysql'
import { PostgreSQLConnection } from './postgres'

export function createConnection(config: ConnectionConfig): DBConnection {
  switch (config.type) {
    case 'sqlite':
      return new SQLiteConnection(config)
    case 'mysql':
      return new MySQLConnection(config)
    case 'postgresql':
      return new PostgreSQLConnection(config)
    default:
      throw new Error(`Unsupported database type: ${config.type}`)
  }
}

export type { ConnectionConfig, DBConnection, QueryResult, ColumnInfo, DBType } from './types'
