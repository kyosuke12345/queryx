import React, { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import type { ColDef } from 'ag-grid-community'
import type { QueryResult } from '../../store/appStore'

interface Props {
  result: QueryResult
  duration: number
}

export function ResultGrid({ result, duration }: Props): JSX.Element {
  const columnDefs: ColDef[] = useMemo(
    () =>
      result.columns.map((col) => ({
        field: col,
        headerName: col,
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 80
      })),
    [result.columns]
  )

  const exportCsv = (): void => {
    const header = result.columns.join(',')
    const body = result.rows
      .map((row) =>
        result.columns
          .map((c) => {
            const v = row[c]
            const s = v == null ? '' : String(v)
            return s.includes(',') || s.includes('"') || s.includes('\n')
              ? `"${s.replace(/"/g, '""')}"`
              : s
          })
          .join(',')
      )
      .join('\n')
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'result.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b text-xs text-gray-600">
        <span>
          {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} · {duration}ms
        </span>
        <button className="px-2 py-0.5 bg-white border rounded hover:bg-gray-50" onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={result.rows}
          defaultColDef={{ resizable: true, sortable: true }}
          domLayout="normal"
          enableCellTextSelection
        />
      </div>
    </div>
  )
}
