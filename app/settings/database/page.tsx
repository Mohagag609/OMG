'use client'
import { useEffect, useState } from 'react'

type DbType = 'sqlite'|'postgres-local'|'postgres-cloud'

export default function DatabaseSettingsPage() {
  const [dbType, setDbType] = useState<DbType>('sqlite')
  const [form, setForm] = useState({
    sqliteFile: 'file:./dev.db',
    pgHost: 'localhost',
    pgPort: '5432',
    pgDatabase: 'mydb',
    pgUser: 'postgres',
    pgPassword: '',
    pgUrl: ''
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/settings/database').then(r=>r.json()).then(data=>{
      // ممكن نضبط dbType حسب PRISMA_SCHEMA_PATH
      if (data?.dbTypeHint === 'sqlite') setDbType('sqlite')
      else setDbType('postgres-local')
    })
  }, [])

  const submit = async () => {
    setLoading(true); setResult(null)
    const res = await fetch('/api/settings/database', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ dbType, form })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div style={{maxWidth: 800, margin: '24px auto', padding: 16}}>
      <h1>إعدادات قاعدة البيانات</h1>

      <label>نوع قاعدة البيانات</label>
      <select value={dbType} onChange={e=>setDbType(e.target.value as DbType)}>
        <option value="sqlite">SQLite (ملف محلي)</option>
        <option value="postgres-local">PostgreSQL محلي</option>
        <option value="postgres-cloud">PostgreSQL سحابي (Neon/…)</option>
      </select>

      {dbType === 'sqlite' && (
        <div>
          <label>مسار الملف</label>
          <input value={form.sqliteFile}
                 onChange={e=>setForm({...form, sqliteFile: e.target.value})}/>
        </div>
      )}

      {dbType === 'postgres-local' && (
        <div style={{display:'grid', gap:8}}>
          <label>Host</label>
          <input value={form.pgHost} onChange={e=>setForm({...form, pgHost: e.target.value})}/>
          <label>Port</label>
          <input value={form.pgPort} onChange={e=>setForm({...form, pgPort: e.target.value})}/>
          <label>Database</label>
          <input value={form.pgDatabase} onChange={e=>setForm({...form, pgDatabase: e.target.value})}/>
          <label>User</label>
          <input value={form.pgUser} onChange={e=>setForm({...form, pgUser: e.target.value})}/>
          <label>Password</label>
          <input type="password" value={form.pgPassword} onChange={e=>setForm({...form, pgPassword: e.target.value})}/>
        </div>
      )}

      {dbType === 'postgres-cloud' && (
        <div>
          <label>DATABASE_URL</label>
          <input placeholder="postgres://user:pass@host/db?sslmode=require"
                 value={form.pgUrl}
                 onChange={e=>setForm({...form, pgUrl: e.target.value})}/>
        </div>
      )}

      <div style={{marginTop: 12}}>
        <button onClick={submit} disabled={loading}>
          {loading ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      {result && (
        <pre style={{whiteSpace:'pre-wrap', marginTop: 12}}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}