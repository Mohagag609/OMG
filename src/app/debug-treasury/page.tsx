'use client'

import { useState, useEffect } from 'react'

export default function DebugTreasury() {
  const [safes, setSafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    setToken(storedToken)
    
    if (!storedToken) {
      setError('No token found in localStorage')
      setLoading(false)
      return
    }

    const fetchSafes = async () => {
      try {
        const response = await fetch('/.netlify/functions/safes', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })
        
        
        const data = await response.json()
        
        if (data.success) {
          setSafes(data.data)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchSafes()
  }, [])

  const addTestSafe = async () => {
    try {
      const response = await fetch('/.netlify/functions/safes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `خزنة اختبار ${Date.now()}`,
          description: 'خزنة اختبار',
          balance: Math.floor(Math.random() * 1000)
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh the list
        const refreshResponse = await fetch('/.netlify/functions/safes', {
          headers: {}
        })
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setSafes(refreshData.data)
        }
      }
    } catch (err) {
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Treasury</h1>
      
      <div className="mb-4">
        <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
        <p><strong>Token preview:</strong> {token ? token.substring(0, 20) + '...' : 'None'}</p>
        <p><strong>Safes count:</strong> {safes.length}</p>
      </div>

      <button 
        onClick={addTestSafe}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Test Safe
      </button>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Safes:</h2>
        {safes.map((safe: any) => (
          <div key={safe.id} className="border p-2 rounded">
            <p><strong>Name:</strong> {safe.name}</p>
            <p><strong>Balance:</strong> {safe.balance}</p>
            <p><strong>ID:</strong> {safe.id}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold">Raw Data:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(safes, null, 2)}
        </pre>
      </div>
    </div>
  )
}