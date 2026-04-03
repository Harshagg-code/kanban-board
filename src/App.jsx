import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Board from './components/Board'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('tasks')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        setSession(existingSession)
      } else {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (!error) setSession(data.session)
        else console.error('Auth error:', error)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading your board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-screen bg-[#EBEBEB] flex gap-3 p-3 overflow-hidden">
      {/* Sidebar — floating white card */}
      <div className="bg-white rounded-2xl shadow-sm flex-shrink-0 overflow-hidden hidden md:block">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
      </div>

      {/* Main content — floating white card */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-2xl shadow-sm min-w-0">
        <Header onSearch={setSearchQuery} />
        <main className="flex-1 overflow-auto p-4 bg-[#F5F5F5] rounded-2xl m-3">
          {activePage === 'tasks' && (
            <Board session={session} searchQuery={searchQuery} />
          )}
          {activePage !== 'tasks' && (
            <div className="flex items-center justify-center h-64 text-gray-300 text-sm">
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)} page coming soon
            </div>
          )}
        </main>
      </div>
    </div>
  )
}