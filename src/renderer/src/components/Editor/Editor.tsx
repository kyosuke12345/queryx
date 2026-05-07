import React, { useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'
import { useAppStore } from '../../store/appStore'

interface Props {
  tabId: string
  sql: string
  onChange: (sql: string) => void
  onExecute: () => void
}

export function Editor({ tabId, sql, onChange, onExecute }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const { tables } = useAppStore()

  useEffect(() => {
    if (!containerRef.current) return

    const editor = monaco.editor.create(containerRef.current, {
      value: sql,
      language: 'sql',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 22,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2
    })

    editorRef.current = editor

    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue())
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute()
    })

    return () => editor.dispose()
  }, [tabId])

  useEffect(() => {
    if (editorRef.current) {
      const current = editorRef.current.getValue()
      if (current !== sql) editorRef.current.setValue(sql)
    }
  }, [sql])

  useEffect(() => {
    const disposable = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        const keywords = [
          'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
          'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES',
          'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE',
          'AND', 'OR', 'NOT', 'IN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'DISTINCT',
          'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'AS', 'ON', 'BETWEEN', 'CASE', 'WHEN',
          'THEN', 'ELSE', 'END', 'UNION', 'UNION ALL', 'WITH'
        ].map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range
        }))

        const tableItems = tables.map((t) => ({
          label: t,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: t,
          range
        }))

        return { suggestions: [...keywords, ...tableItems] }
      }
    })
    return () => disposable.dispose()
  }, [tables])

  return <div ref={containerRef} className="w-full h-full" />
}
