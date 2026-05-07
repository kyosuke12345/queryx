import React, { useState } from 'react'
import type { Connection } from '../../store/appStore'

interface Props {
  initial?: Connection | null
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_PORTS: Record<string, number> = { mysql: 3306, postgresql: 5432 }

export function ConnectionModal({ initial, onClose, onSaved }: Props): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<Connection['type']>(initial?.type ?? 'sqlite')
  const [host, setHost] = useState(initial?.host ?? 'localhost')
  const [port, setPort] = useState(initial?.port ?? 5432)
  const [user, setUser] = useState(initial?.user ?? '')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState(initial?.database ?? '')
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleTypeChange = (t: Connection['type']): void => {
    setType(t)
    if (DEFAULT_PORTS[t]) setPort(DEFAULT_PORTS[t])
  }

  const buildConfig = () => ({
    id: initial?.id ?? Date.now().toString(),
    name,
    type,
    host,
    port,
    user,
    password,
    database
  })

  const handleTest = async (): Promise<void> => {
    setTesting(true)
    setTestMsg(null)
    const res = await window.api.connection.test(buildConfig())
    setTestMsg(res.success ? { ok: true, msg: 'Connection successful!' } : { ok: false, msg: res.error ?? 'Failed' })
    setTesting(false)
  }

  const handleSave = async (): Promise<void> => {
    await window.api.connection.save(buildConfig())
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl w-[480px] p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{initial ? 'Edit Connection' : 'New Connection'}</h2>

        <div className="space-y-3">
          <Field label="Name">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="My Database" />
          </Field>
          <Field label="Type">
            <select className={input} value={type} onChange={(e) => handleTypeChange(e.target.value as Connection['type'])}>
              <option value="sqlite">SQLite</option>
              <option value="mysql">MySQL / MariaDB</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </Field>

          {type === 'sqlite' ? (
            <Field label="File Path">
              <input className={input} value={database} onChange={(e) => setDatabase(e.target.value)} placeholder="/path/to/database.db" />
            </Field>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field label="Host">
                    <input className={input} value={host} onChange={(e) => setHost(e.target.value)} />
                  </Field>
                </div>
                <Field label="Port">
                  <input className={input} type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Database">
                <input className={input} value={database} onChange={(e) => setDatabase(e.target.value)} />
              </Field>
              <Field label="User">
                <input className={input} value={user} onChange={(e) => setUser(e.target.value)} />
              </Field>
              <Field label="Password">
                <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            </>
          )}
        </div>

        {testMsg && (
          <p className={`mt-3 text-sm ${testMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{testMsg.msg}</p>
        )}

        <div className="flex justify-between mt-5">
          <button className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50" onClick={onClose}>Cancel</button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleSave} disabled={!name || !database}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const input = 'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
