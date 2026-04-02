// HU-046 — Patient emotional history detail

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
const getToken = () => localStorage.getItem('elevation_token') || ''

interface Patient {
  id: number
  name: string
  email: string
  createdAt: string
}

interface MoodLog {
  id: number
  date: string
  checkin_mood: number | null
  checkout_mood: number | null
}

interface SessionRating {
  id: number
  date: string
  rating: number
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊',
}

const MOOD_LABEL: Record<number, string> = {
  1: 'Very low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great',
}

export function TherapistPatient() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient,  setPatient]  = useState<Patient | null>(null)
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([])
  const [ratings,  setRatings]  = useState<SessionRating[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}/api/therapist/pacientes/${id}/historial`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setPatient(data.patient)
        setMoodLogs(data.moodLogs)
        setRatings(data.ratings)
      } catch {
        setError('Could not load patient history.')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [id])

  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) * 10) / 10
    : null

  const avgMood = (() => {
    const all = moodLogs.flatMap(m => [m.checkin_mood, m.checkout_mood]).filter((v): v is number => v != null)
    return all.length > 0 ? Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10 : null
  })()

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

  const cardStyle = {
    background: '#fff',
    borderRadius: '1rem',
    border: '0.5px solid #E7E5E4',
    boxShadow: '0 2px 12px rgba(26,28,27,0.06)',
    padding: '1.25rem 1.5rem',
  }

  if (loading) return <p style={{ color: '#78716C', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>Loading...</p>
  if (error)   return <p style={{ color: '#DC2626', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>{error}</p>
  if (!patient) return null

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* BACK + HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/therapist/dashboard')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#78716C', fontSize: '0.82rem', padding: 0,
          fontFamily: 'Inter, sans-serif', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}>
          ← Back to patients
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300, fontSize: '1.8rem', color: '#1C1917', margin: 0 }}>
          {patient.name}
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#78716C', margin: '0.25rem 0 0' }}>
          {patient.email} · Member since {formatDate(patient.createdAt)}
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total sessions',  value: moodLogs.length },
          { label: 'Avg mood',        value: avgMood ?? '—' },
          { label: 'Avg rating',      value: avgRating ? `${avgRating} ★` : '—' },
          { label: 'Last 30 days',    value: `${moodLogs.length} logs` },
        ].map(card => (
          <div key={card.label} style={cardStyle}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1917' }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#78716C', marginTop: '0.2rem' }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* MOOD HISTORY */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.1rem', color: '#1C1917', margin: '0 0 1.25rem' }}>
            Emotional history
          </h2>
          {moodLogs.length === 0 ? (
            <p style={{ color: '#78716C', fontSize: '0.875rem' }}>No mood logs yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {moodLogs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem', background: '#F5F3EF', borderRadius: '0.65rem',
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#78716C' }}>{formatDate(log.date)}</span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {log.checkin_mood != null && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem' }}>{MOOD_EMOJI[log.checkin_mood]}</div>
                        <div style={{ fontSize: '0.62rem', color: '#A8B5A2' }}>Check-in</div>
                      </div>
                    )}
                    {log.checkout_mood != null && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem' }}>{MOOD_EMOJI[log.checkout_mood]}</div>
                        <div style={{ fontSize: '0.62rem', color: '#A8B5A2' }}>Check-out</div>
                      </div>
                    )}
                    {log.checkin_mood != null && log.checkout_mood != null && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: log.checkout_mood >= log.checkin_mood ? '#22C55E' : '#EF4444',
                      }}>
                        {log.checkout_mood >= log.checkin_mood ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SESSION RATINGS */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.1rem', color: '#1C1917', margin: '0 0 1.25rem' }}>
            Session ratings
          </h2>
          {ratings.length === 0 ? (
            <p style={{ color: '#78716C', fontSize: '0.875rem' }}>No ratings yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ratings.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem', background: '#F5F3EF', borderRadius: '0.65rem',
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#78716C' }}>{formatDate(r.date)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#78716C' }}>
                      {MOOD_LABEL[r.rating] ?? r.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}