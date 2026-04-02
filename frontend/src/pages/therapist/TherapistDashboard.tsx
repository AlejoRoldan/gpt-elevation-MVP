
// HU-046 — Therapist dashboard with patient list

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
const getToken = () => localStorage.getItem('elevation_token') || ''

interface Patient {
  id: number
  name: string
  email: string
  active: boolean
  createdAt: string
  totalSessions: number
  sessionsThisWeek: number
  avgRating: number | null
  moodTrend: 'up' | 'down' | 'neutral'
  lastMood: {
    checkin_mood: number | null
    checkout_mood: number | null
    date: string
  } | null
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊',
}

const TREND_ICON: Record<string, string> = {
  up: '↑', down: '↓', neutral: '→',
}

const TREND_COLOR: Record<string, string> = {
  up: '#22C55E', down: '#EF4444', neutral: '#78716C',
}

export function TherapistDashboard() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API}/api/therapist/pacientes`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setPatients(data)
      } catch {
        setError('Could not load your patients.')
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  const activeThisWeek = patients.filter(p => p.sessionsThisWeek > 0).length
  const avgMoodAll = (() => {
    const moods = patients
      .map(p => p.lastMood?.checkin_mood)
      .filter((m): m is number => m != null)
    return moods.length > 0
      ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
      : null
  })()
  const avgRatingAll = (() => {
    const ratings = patients.map(p => p.avgRating).filter((r): r is number => r != null)
    return ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null
  })()

  const cardStyle = {
    background: '#fff',
    borderRadius: '1rem',
    border: '0.5px solid #E7E5E4',
    boxShadow: '0 2px 12px rgba(26,28,27,0.06)',
    padding: '1.25rem 1.5rem',
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300, fontSize: '1.8rem', color: '#1C1917', margin: 0 }}>
          My Patients
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#78716C', margin: '0.25rem 0 0' }}>
          {patients.length} patient{patients.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total patients',       value: patients.length },
          { label: 'Active this week',     value: activeThisWeek },
          { label: 'Avg mood',             value: avgMoodAll ?? '—' },
          { label: 'Avg session rating',   value: avgRatingAll ? `${avgRatingAll} ★` : '—' },
        ].map(card => (
          <div key={card.label} style={cardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#1C1917' }}>{card.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#78716C', marginTop: '0.25rem' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* LOADING / ERROR */}
      {loading && <p style={{ color: '#78716C', fontSize: '0.875rem' }}>Loading patients...</p>}
      {error   && <p style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</p>}

      {/* PATIENT LIST */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {patients.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#78716C', fontSize: '0.875rem' }}>
              No patients assigned yet.
            </div>
          ) : (
            patients.map(p => {
              const lastMoodValue = p.lastMood?.checkout_mood ?? p.lastMood?.checkin_mood ?? null
              const daysSince = p.lastMood
                ? Math.floor((Date.now() - new Date(p.lastMood.date).getTime()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <div key={p.id} style={{
                  ...cardStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  opacity: p.active ? 1 : 0.5,
                }}>
                  {/* Left — patient info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: '#EAF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 600, color: '#6B7D5C', flexShrink: 0,
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 500, color: '#1C1917', fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        {lastMoodValue != null && (
                          <span style={{ fontSize: '0.85rem' }}>
                            {MOOD_EMOJI[lastMoodValue] ?? '—'}
                          </span>
                        )}
                        {daysSince != null && (
                          <span style={{ fontSize: '0.75rem', color: '#78716C' }}>
                            {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                          </span>
                        )}
                        {p.moodTrend && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: TREND_COLOR[p.moodTrend] }}>
                            {TREND_ICON[p.moodTrend]} {p.moodTrend === 'up' ? 'improving' : p.moodTrend === 'down' ? 'declining' : 'stable'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center — stats */}
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#78716C' }}>
                    <span>{p.totalSessions} session{p.totalSessions !== 1 ? 's' : ''}</span>
                    {p.avgRating != null && <span>{'★'.repeat(Math.round(p.avgRating))}{'☆'.repeat(5 - Math.round(p.avgRating))} {p.avgRating}</span>}
                  </div>

                  {/* Right — action */}
                  <button
                    onClick={() => navigate(`/therapist/patient/${p.id}`)}
                    style={{
                      padding: '0.5rem 1.1rem',
                      background: 'transparent',
                      border: '0.5px solid #6B7D5C',
                      borderRadius: '0.85rem',
                      color: '#6B7D5C',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View history
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}