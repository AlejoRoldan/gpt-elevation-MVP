// frontend/src/pages/UserProgress.tsx
// HU-052 — User progress panel

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/useLanguage'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
const getToken = () => localStorage.getItem('elevation_token') || ''

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

interface Recommendation {
  id: number
  category: string
  content: string
  generatedAt: string
  seenByUser: boolean
}

interface Stats {
  totalSessions: number
  avgMood: number | null
  avgRating: number | null
  streak: number
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😊',
}

export function UserProgress() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()

  const [stats,           setStats]           = useState<Stats | null>(null)
  const [moodLogs,        setMoodLogs]        = useState<MoodLog[]>([])
  const [ratings,         setRatings]         = useState<SessionRating[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API}/api/user/progress`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setStats(data.stats)
        setMoodLogs(data.moodLogs)
        setRatings(data.ratings)
        setRecommendations(data.recommendations)
      } catch {
        setError(lang === 'es' ? 'No se pudo cargar tu progreso.' : 'Could not load your progress.')
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

  const cardStyle = {
    background: '#fff',
    borderRadius: '1rem',
    border: '0.5px solid #E7E5E4',
    boxShadow: '0 2px 12px rgba(26,28,27,0.06)',
    padding: '1.25rem 1.5rem',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: '#78716C', fontSize: '0.875rem' }}>
        {lang === 'es' ? 'Cargando tu progreso...' : 'Loading your progress...'}
      </p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(249,249,247,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(231,229,228,0.5)',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 760, width: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/app/chat')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#78716C', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: '0.35rem', padding: 0,
          }}>
            ← {lang === 'es' ? 'Volver al chat' : 'Back to chat'}
          </button>
          <span style={{ fontSize: 10, letterSpacing: '0.3em', color: '#A8A29E', textTransform: 'uppercase' }}>
            {t('logo')}
          </span>
          <div style={{ width: 80 }} />
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', paddingTop: 80, paddingBottom: 48, padding: '80px 1.5rem 48px' }}>

        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300, fontSize: '1.8rem', color: '#1C1917', margin: 0 }}>
            {lang === 'es' ? 'Tu progreso' : 'Your progress'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#78716C', margin: '0.25rem 0 0' }}>
            {lang === 'es' ? 'Últimos 30 días' : 'Last 30 days'}
          </p>
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        {/* STATS CARDS */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              {
                label: lang === 'es' ? 'Sesiones totales' : 'Total sessions',
                value: stats.totalSessions,
              },
              {
                label: lang === 'es' ? 'Mood promedio' : 'Avg mood',
                value: stats.avgMood != null ? `${stats.avgMood} ${MOOD_EMOJI[Math.round(stats.avgMood)] ?? ''}` : '—',
              },
              {
                label: lang === 'es' ? 'Rating promedio' : 'Avg rating',
                value: stats.avgRating != null ? `${stats.avgRating} ★` : '—',
              },
              {
                label: lang === 'es' ? 'Racha actual' : 'Current streak',
                value: `${stats.streak} ${lang === 'es' ? (stats.streak === 1 ? 'día' : 'días') : (stats.streak === 1 ? 'day' : 'days')}`,
              },
            ].map(card => (
              <div key={card.label} style={cardStyle}>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1917' }}>{card.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#78716C', marginTop: '0.2rem' }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.1rem', color: '#1C1917', margin: '0 0 1rem' }}>
              {t('rec_title')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recommendations.map(rec => (
                <div key={rec.id} style={{ padding: '0.85rem 1rem', background: '#F5F3EF', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7D5C', marginBottom: '0.3rem', fontFamily: 'Inter, sans-serif' }}>
                    {t(`rec_category_${rec.category}`)}
                  </div>
                  <p style={{ fontFamily: 'Noto Serif, serif', fontStyle: 'italic', fontSize: '0.9rem', color: '#1C1917', lineHeight: 1.6, margin: 0 }}>
                    {rec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* MOOD HISTORY */}
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.1rem', color: '#1C1917', margin: '0 0 1rem' }}>
              {lang === 'es' ? 'Historial emocional' : 'Emotional history'}
            </h2>
            {moodLogs.length === 0 ? (
              <p style={{ color: '#78716C', fontSize: '0.875rem' }}>
                {lang === 'es' ? 'Aún no hay registros.' : 'No records yet.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {moodLogs.map(log => (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', background: '#F5F3EF', borderRadius: '0.65rem',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#78716C' }}>{formatDate(log.date)}</span>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {log.checkin_mood != null && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem' }}>{MOOD_EMOJI[log.checkin_mood]}</div>
                          <div style={{ fontSize: '0.6rem', color: '#A8B5A2' }}>in</div>
                        </div>
                      )}
                      {log.checkout_mood != null && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem' }}>{MOOD_EMOJI[log.checkout_mood]}</div>
                          <div style={{ fontSize: '0.6rem', color: '#A8B5A2' }}>out</div>
                        </div>
                      )}
                      {log.checkin_mood != null && log.checkout_mood != null && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600,
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
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.1rem', color: '#1C1917', margin: '0 0 1rem' }}>
              {lang === 'es' ? 'Calificaciones' : 'Session ratings'}
            </h2>
            {ratings.length === 0 ? (
              <p style={{ color: '#78716C', fontSize: '0.875rem' }}>
                {lang === 'es' ? 'Aún no hay calificaciones.' : 'No ratings yet.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ratings.map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', background: '#F5F3EF', borderRadius: '0.65rem',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#78716C' }}>{formatDate(r.date)}</span>
                    <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      {'★'.repeat(r.rating)}
                      <span style={{ color: '#D6D2C4' }}>{'★'.repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}