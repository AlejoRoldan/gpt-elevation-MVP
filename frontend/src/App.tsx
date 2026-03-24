import { useState, useEffect, useRef } from 'react';

// ─── Tipos ────────────────────────────────────────────────────
type Screen = 'login' | 'checkin' | 'chat';
type Mood   = { emoji: string; label: string; value: number } | null;

const MOODS = [
  { emoji: '😊', label: 'Bien',      value: 4 },
  { emoji: '🙂', label: 'Tranquilo', value: 3 },
  { emoji: '😐', label: 'Neutral',   value: 2 },
  { emoji: '😔', label: 'Inquieto',  value: 1 },
  { emoji: '😞', label: 'Mal',       value: 0 },
];

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

const BIENVENIDA = {
  role: 'bot',
  text: 'Hola. Soy Elevation. Gracias por acercarte. Este espacio es para explorar lo que sientes, lo que vives y lo que sueñas. ¿Desde dónde estás llegando hoy?',
};

// ─── Componente principal ─────────────────────────────────────
function App() {
  // Auth
  const [screen,        setScreen]        = useState<Screen>('login');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [authMessage,   setAuthMessage]   = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [role,          setRole]          = useState('user');

  // Check-in
  const [mood, setMood] = useState<Mood>(null);

  // Chat
  const [messages,  setMessages]  = useState<any[]>([BIENVENIDA]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Admin
  const [adminOpen,     setAdminOpen]     = useState(false);
  const [promptText,    setPromptText]    = useState('');
  const [promptVersion, setPromptVersion] = useState('v1');
  const [promptSaving,  setPromptSaving]  = useState(false);
  const [promptMsg,     setPromptMsg]     = useState('');

// HU-033 — Versionado de prompts
  const [promptMode,      setPromptMode]      = useState<'view' | 'edit'>('view');
  const [activePrompt,    setActivePrompt]    = useState<any>(null);
  const [pendingVersions, setPendingVersions] = useState<any[]>([]);
  const [allVersions,     setAllVersions]     = useState<any[]>([]);
  const [rejectNote,      setRejectNote]      = useState('');
  const [rejectingId,     setRejectingId]     = useState<number | null>(null);

  // ── Boot ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('elevation_token');
    if (!token) return;
    setRole(localStorage.getItem('elevation_role') || 'user');
    const checkedToday =
      localStorage.getItem('elevation_checkin_date') === new Date().toDateString();
    if (checkedToday) { inicializarSesion(token); setScreen('chat'); }
    else setScreen('checkin');
  }, []);

  // HU 2.3 — Scroll automático suave
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // ── Historial ───────────────────────────────────────────────
  const inicializarSesion = async (token: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const hist = await res.json();
        if (hist.length > 0) setMessages([BIENVENIDA, ...hist]);
      }
    } catch (err) {
      console.error('Error cargando historial', err);
    }
  };

  // ── Auth ────────────────────────────────────────────────────
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('');
    const endpoint = isRegistering ? 'register' : 'login';
    const body     = isRegistering
      ? { name, email, password }
      : { email, password };

    try {
      const res  = await fetch(`${BACKEND}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setAuthMessage(`❌ ${data.error}`); return; }

      if (isRegistering) {
        setAuthMessage('✓ Registro exitoso. Ahora inicia sesión.');
        setIsRegistering(false); setPassword(''); setName('');
      } else {
        localStorage.setItem('elevation_token', data.token);
        localStorage.setItem('elevation_role',  data.role  || 'user');
        localStorage.setItem('elevation_name',  data.name  || '');
        setRole(data.role || 'user');
        const checkedToday =
          localStorage.getItem('elevation_checkin_date') === new Date().toDateString();
        if (checkedToday) { inicializarSesion(data.token); setScreen('chat'); }
        else setScreen('checkin');
      }
    } catch {
      setAuthMessage('❌ Error de conexión con el servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('elevation_token');
    localStorage.removeItem('elevation_role');
    localStorage.removeItem('elevation_name');
    setScreen('login');
    setMessages([BIENVENIDA]);
    setEmail(''); setPassword('');
    setAdminOpen(false);
    setRole('user');
  };

  // ── Check-in ─────────────────────────────────────────────
  const handleCheckin = () => {
    if (!mood) return;
    localStorage.setItem('elevation_checkin_date', new Date().toDateString());
    localStorage.setItem('elevation_checkin_mood', String(mood.value));
    const token = localStorage.getItem('elevation_token');
    if (token) inicializarSesion(token);
    setScreen('chat');
  };

  // ── Chat ─────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setSending(true);
    try {
      const res  = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('elevation_token')}`,
        },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: 'Lo siento, tuve una pequeña desconexión. ¿Podrías repetirme eso?' },
      ]);
    }
    setSending(false);
  };

  // ── Admin ────────────────────────────────────────────────
  // HU-033 — Carga el prompt activo desde el backend
  const loadActivePrompt = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/admin/prompt/elevation_system_prompt`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('elevation_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivePrompt(data);
        setPromptText(data.content || '');
        setPromptVersion(`v${data.version}`);
      }
    } catch { console.error('Error cargando prompt activo'); }
  };

  // HU-033 — Carga versiones pendientes (solo superadmin)
  const loadVersions = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/superadmin/prompt/elevation_system_prompt/versions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('elevation_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllVersions(data);
        setPendingVersions(data.filter((v: any) => v.status === 'pending_review'));
      }
    } catch { console.error('Error cargando versiones'); }
  };

  // HU-033 — Proponer cambio (admin)
  const proposePrompt = async () => {
    if (!promptText.trim()) return;
    setPromptSaving(true);
    try {
      const res = await fetch(`${BACKEND}/api/admin/prompt/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('elevation_token')}`,
        },
        body: JSON.stringify({ key: 'elevation_system_prompt', content: promptText }),
      });
      const data = await res.json();
      setPromptMsg(data.message || 'Propuesta enviada.');
      setPromptMode('view');
      loadActivePrompt();
    } catch { setPromptMsg('Error al enviar la propuesta.'); }
    setPromptSaving(false);
    setTimeout(() => setPromptMsg(''), 4000);
  };

  // HU-033 — Aprobar versión (superadmin)
  const approveVersion = async (id: number) => {
    try {
      await fetch(`${BACKEND}/api/superadmin/prompt/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('elevation_token')}` },
      });
      setPromptMsg('✓ Versión aprobada y activa en producción.');
      loadActivePrompt();
      loadVersions();
    } catch { setPromptMsg('Error al aprobar.'); }
    setTimeout(() => setPromptMsg(''), 4000);
  };

  // HU-033 — Rechazar versión (superadmin)
  const rejectVersion = async (id: number) => {
    try {
      await fetch(`${BACKEND}/api/superadmin/prompt/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('elevation_token')}`,
        },
        body: JSON.stringify({ note: rejectNote }),
      });
      setPromptMsg('Versión rechazada.');
      setRejectingId(null);
      setRejectNote('');
      loadVersions();
    } catch { setPromptMsg('Error al rechazar.'); }
    setTimeout(() => setPromptMsg(''), 4000);
  };

  // HU-033 — Rollback (superadmin)
  const rollbackVersion = async (id: number) => {
    if (!confirm('¿Seguro que quieres activar esta versión anterior?')) return;
    try {
      await fetch(`${BACKEND}/api/superadmin/prompt/${id}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('elevation_token')}` },
      });
      setPromptMsg('✓ Rollback exitoso.');
      loadActivePrompt();
      loadVersions();
    } catch { setPromptMsg('Error en rollback.'); }
    setTimeout(() => setPromptMsg(''), 4000);
  };

  


  // ════════════════════════════════════════════════════════════
  // RENDER — LOGIN
  // ════════════════════════════════════════════════════════════
  if (screen === 'login') return (
    <div className="min-h-screen flex items-center justify-center px-6"
         style={{ background: '#f9f9f7', fontFamily: 'Inter, sans-serif' }}>

      <div className="w-full max-w-sm flex flex-col items-center">

        {/* Branding */}
        <header className="text-center mb-14 flex flex-col items-center">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300, letterSpacing: '0.3em', fontSize: '1.5rem', color: '#1C1917' }}>
            ELEVATION
          </h1>
          <div style={{ width: 40, height: 1, background: '#E7E5E4', margin: '1rem 0' }} />
          <p style={{ fontFamily: 'Noto Serif, serif', fontStyle: 'italic', fontSize: '0.8rem', color: '#A8A29E' }}>
            Tu santuario digital · Your digital sanctuary
          </p>
        </header>

        {/* Formulario */}
        <form onSubmit={handleAuth} className="w-full flex flex-col gap-8">
          {isRegistering && (
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Tu nombre" required
              className="w-full bg-transparent outline-none py-3"
              style={{ borderBottom: '1px solid #E7E5E4', color: '#1C1917', fontSize: '1rem' }}
            />
          )}
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com" required
            className="w-full bg-transparent outline-none py-3"
            style={{ borderBottom: '1px solid #E7E5E4', color: '#1C1917', fontSize: '1rem' }}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full bg-transparent outline-none py-3 pr-8"
              style={{ borderBottom: '1px solid #E7E5E4', color: '#1C1917', fontSize: '1rem' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 bottom-3 text-gray-400 hover:text-gray-600">
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {authMessage && (
            <p className="text-sm text-center" style={{ color: authMessage.startsWith('✓') ? '#0d9488' : '#dc2626' }}>
              {authMessage}
            </p>
          )}

          <button type="submit"
            className="w-full py-3 text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#00685f,#008378)', fontSize: '0.9rem' }}>
            {isRegistering ? 'Crear mi diario' : 'Entrar a mi espacio'}
          </button>

          <button type="button"
            onClick={() => { setIsRegistering(!isRegistering); setAuthMessage(''); setPassword(''); setShowPassword(false); }}
            className="text-sm text-center hover:opacity-70 transition-opacity"
            style={{ color: '#0d9488' }}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿Primera vez aquí? Crear mi diario'}
          </button>
        </form>

        {/* Glow decorativo */}
        <div style={{ width: 128, height: 128, background: '#0d9488', filter: 'blur(60px)', opacity: 0.08, borderRadius: '50%', marginTop: '4rem', pointerEvents: 'none' }} />
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER — CHECK-IN (HU 2.1)
  // ════════════════════════════════════════════════════════════
  if (screen === 'checkin') return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-16 relative overflow-hidden"
         style={{ background: '#f9f9f7', fontFamily: 'Inter, sans-serif' }}>

      {/* Glows ambientales */}
      <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: '80%', height: '40%', background: 'rgba(13,148,136,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-20%', width: '80%', height: '40%', background: 'rgba(115,91,46,0.04)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Header */}
      <div className="text-center w-full">
        <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', color: '#A8A29E', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          ANTES DE COMENZAR · BEFORE YOU START
        </span>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '2.2rem', color: '#1C1917', marginBottom: '0.5rem' }}>
          ¿Cómo llegas hoy?
        </h1>
        <p style={{ color: '#78716C', fontSize: '1rem' }}>Este momento es solo tuyo</p>
      </div>

      {/* Cards de humor */}
      <div className="w-full" style={{ overflowX: 'auto', padding: '2rem 0' }}>
        <div style={{ display: 'flex', gap: '1rem', width: 'max-content', margin: '0 auto', padding: '0 1rem' }}>
          {MOODS.map(m => (
            <button key={m.value} onClick={() => setMood(m)}
              style={{
                width: 120, height: 160, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.3s',
                border: mood?.value === m.value ? '2px solid #0d9488' : '1px solid #E7E5E4',
                background: mood?.value === m.value ? '#F0FDFA' : 'white',
              }}>
              <span style={{ fontSize: '2rem' }}>{m.emoji}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: mood?.value === m.value ? '#0d9488' : '#78716C' }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA — bloqueado hasta selección */}
      <div className="w-full" style={{ maxWidth: 380 }}>
        <button onClick={handleCheckin} disabled={!mood}
          className="w-full py-4 text-white font-medium rounded-2xl transition-all"
          style={{
            background: mood ? 'linear-gradient(135deg,#00685f,#008378)' : '#E7E5E4',
            color: mood ? 'white' : '#A8A29E',
            cursor: mood ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
          }}>
          Comenzar
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: '2rem' }}>
          {[0.2, 0.5, 0.2].map((op, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d9488', opacity: op }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER — CHAT
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f9f9f7', fontFamily: 'Inter, sans-serif' }}>

      {/* Glow decorativo derecha */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 120, height: '100vh', background: 'linear-gradient(to left, rgba(253,219,163,0.08), transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Header ────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(249,249,247,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(231,229,228,0.5)',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 680, width: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Ícono izquierda (placeholder) */}
          <div style={{ width: 24 }} />

          {/* Logo */}
          <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#A8A29E', textTransform: 'uppercase' }}>
            ELEVATION
          </span>

          {/* Acciones derecha */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Ícono admin — solo visible para role=admin */}
            {['admin', 'superadmin'].includes(role) && (
              <button onClick={() => { loadActivePrompt(); if (role === 'superadmin') loadVersions(); setAdminOpen(true); }}
                title="Administración"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', display: 'flex', padding: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </button>
            )}
            {/* Logout */}
            <button onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', display: 'flex', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mensajes ──────────────────────────────────────── */}
      <main style={{ maxWidth: 680, width: '100%', margin: '0 auto', paddingTop: 80, paddingBottom: 120, paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {messages.map((msg: any, i: number) => (
            <div key={i}>
              {msg.role === 'user' ? (
                /* Usuario — texto alineado a la derecha con fondo sutil */
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%',
                    background: 'white',
                    borderRadius: '1.25rem 1.25rem 0.25rem 1.25rem',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 2px 12px rgba(26,28,27,0.06)',
                    color: '#1C1917',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* Elevation — borde izquierdo esmeralda, texto en italic serif */
                <div style={{ borderLeft: '2px solid #0d9488', paddingLeft: '1.25rem' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', color: '#0d9488', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Elevation ·
                  </span>
                  <p style={{ fontFamily: 'Noto Serif, serif', fontStyle: 'italic', fontSize: '1.05rem', color: '#1C1917', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* HU 2.2 — Indicador de presencia mientras la IA responde */}
          {sending && (
            <div style={{ borderLeft: '2px solid #0d9488', paddingLeft: '1.25rem' }}>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', color: '#0d9488', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Elevation ·
              </span>
              <p style={{ fontFamily: 'Noto Serif, serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#A8A29E' }}>
                Elevation está reflexionando...
              </p>
            </div>
          )}

          {/* Ancla para scroll automático (HU 2.3) */}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* ── Input ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 40,
        background: 'rgba(249,249,247,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(231,229,228,0.5)',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Escribe lo que sientes... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'Noto Serif, serif', fontStyle: 'italic',
              fontSize: '1rem', color: '#1C1917', lineHeight: 1.6,
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          {input.trim() && (
            <button onClick={handleSend}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d9488', padding: 4, display: 'flex', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          PANEL ADMIN — Slide desde la derecha
          Solo visible para role === 'admin'
          ════════════════════════════════════════════════ */}
      {adminOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div onClick={() => setAdminOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(26,28,27,0.1)', backdropFilter: 'blur(4px)' }} />

          {/* Panel */}
          <aside style={{
            position: 'relative', width: '100%', maxWidth: 480, height: '100%',
            background: '#F5F3EF', borderLeft: '1px solid #E7E5E4',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            boxShadow: '0 0 60px rgba(0,0,0,0.08)',
          }}>
            {/* Header panel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', borderBottom: '1px solid #E7E5E4' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1C1917' }}>Panel de Administración</h2>
              <button onClick={() => setAdminOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716C', padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

           {/* Contenido panel */}
            <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>

              {/* Header info prompt activo */}
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#00685f', fontSize: '1.4rem', fontWeight: 400, marginBottom: '0.5rem' }}>
                  Cerebro de Elevation
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.2rem 0.75rem', borderRadius: 9999, background: '#F0FDFA', color: '#065f46', fontSize: '11px', fontWeight: 500 }}>
                    {activePrompt ? `v${activePrompt.version}` : promptVersion} · activo
                  </span>
                  {activePrompt?.approved_by && (
                    <span style={{ fontSize: '11px', color: '#A8A29E' }}>
                      Aprobado por {activePrompt.approved_by}
                    </span>
                  )}
                  {/* Badge de pendientes — solo superadmin */}
                  {role === 'superadmin' && pendingVersions.length > 0 && (
                    <span style={{ padding: '0.2rem 0.75rem', borderRadius: 9999, background: '#FEF3C7', color: '#92400E', fontSize: '11px', fontWeight: 600 }}>
                      ⏳ {pendingVersions.length} pendiente{pendingVersions.length > 1 ? 's' : ''} de revisión
                    </span>
                  )}
                </div>
              </div>

              {promptMsg && (
                <p style={{ fontSize: '0.8rem', color: '#0d9488', padding: '0.5rem 0.75rem', background: '#F0FDFA', borderRadius: '0.5rem' }}>
                  {promptMsg}
                </p>
              )}

              {/* ── VISTA ADMIN: ver prompt activo + proponer cambio ── */}
              {['admin', 'superadmin'].includes(role) && (
                <>
                  {promptMode === 'view' ? (
                    <>
                      <textarea
                        value={promptText}
                        readOnly
                        style={{
                          width: '100%', height: 260, padding: '1.25rem',
                          background: '#FAFAFA', border: '1px solid #E7E5E4', borderRadius: '0.75rem',
                          fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7,
                          color: '#78716C', resize: 'none', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <button onClick={() => setPromptMode('edit')}
                        style={{
                          padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #0d9488',
                          background: 'transparent', color: '#0d9488', fontSize: '0.875rem',
                          fontWeight: 500, cursor: 'pointer',
                        }}>
                        ✏️ Proponer cambio
                      </button>
                    </>
                  ) : (
                    <>
                      <textarea
                        value={promptText}
                        onChange={e => setPromptText(e.target.value)}
                        placeholder="Escribe el nuevo prompt..."
                        style={{
                          width: '100%', height: 260, padding: '1.25rem',
                          background: 'white', border: '1px solid #0d9488', borderRadius: '0.75rem',
                          fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7,
                          color: '#1C1917', resize: 'none', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={proposePrompt} disabled={promptSaving || !promptText.trim()}
                          style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                            background: promptSaving || !promptText.trim() ? '#E7E5E4' : 'linear-gradient(135deg,#00685f,#008378)',
                            color: promptSaving || !promptText.trim() ? '#A8A29E' : 'white',
                            fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                          }}>
                          {promptSaving ? 'Enviando...' : '📤 Enviar para aprobación'}
                        </button>
                        <button onClick={() => { setPromptMode('view'); loadActivePrompt(); }}
                          style={{ background: 'none', border: 'none', color: '#78716C', fontSize: '0.875rem', cursor: 'pointer', padding: '0.5rem 1rem' }}>
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── VISTA SUPERADMIN: versiones pendientes + historial ── */}
              {role === 'superadmin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C1917', margin: 0 }}>
                    Versiones pendientes de aprobación
                  </h4>

                  {pendingVersions.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#A8A29E' }}>No hay versiones pendientes.</p>
                  ) : (
                    pendingVersions.map((v: any) => (
                      <div key={v.id} style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1C1917' }}>v{v.version}</span>
                          <span style={{ fontSize: '11px', color: '#A8A29E' }}>Propuesto por {v.proposed_by}</span>
                        </div>

                        {rejectingId === v.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                              value={rejectNote}
                              onChange={e => setRejectNote(e.target.value)}
                              placeholder="Nota de rechazo (opcional)"
                              style={{ padding: '0.5rem 0.75rem', border: '1px solid #E7E5E4', borderRadius: '0.5rem', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => rejectVersion(v.id)}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#DC2626', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>
                                Confirmar rechazo
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectNote(''); }}
                                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #E7E5E4', background: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => approveVersion(v.id)}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#059669', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>
                              ✓ Aprobar
                            </button>
                            <button onClick={() => setRejectingId(v.id)}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #DC2626', background: 'none', color: '#DC2626', fontSize: '0.8rem', cursor: 'pointer' }}>
                              ✗ Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Historial completo */}
                  {allVersions.length > 0 && (
                    <>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C1917', margin: '0.5rem 0 0' }}>
                        Historial de versiones
                      </h4>
                      {allVersions.filter((v: any) => v.status !== 'pending_review').map((v: any) => (
                        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'white', border: '1px solid #E7E5E4', borderRadius: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1C1917' }}>v{v.version}</span>
                            <span style={{ fontSize: '11px', color: v.status === 'active' ? '#059669' : '#A8A29E' }}>
                              {v.status === 'active' ? '● activo' : v.status === 'approved' ? 'aprobado' : v.status === 'rejected' ? 'rechazado' : 'archivado'}
                            </span>
                          </div>
                          {v.status !== 'active' && (
                            <button onClick={() => rollbackVersion(v.id)}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #E7E5E4', background: 'none', fontSize: '11px', color: '#78716C', cursor: 'pointer' }}>
                              Rollback
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
