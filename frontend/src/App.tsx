 
import { useState, useEffect } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [input, setInput] = useState('');
  
  // Mensaje por defecto si la base de datos está vacía
  const mensajeBienvenida = { role: 'bot', text: 'Hola. Soy Elevation. Gracias por acercarte. Este espacio es para explorar lo que sientes, lo que vives y lo que sueñas. ¿Desde dónde estás llegando hoy?' };
  const [messages, setMessages] = useState<any[]>([mensajeBienvenida]);

const inicializarSesion = async () => {
  const token = localStorage.getItem('elevation_token');
  if (!token) return;
  setIsLoggedIn(true);
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/messages`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const historialBD = await response.json();
      if (historialBD.length > 0) {
        setMessages([mensajeBienvenida, ...historialBD]);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
};
  // NUEVO: Función para ir al backend y traer la historia del chat
 // --- BLOQUE DE ARRANQUE UNIFICADO ---
 useEffect(() => {
    const inicializarSesion = async () => {
      const token = localStorage.getItem('elevation_token'); // <-- Asegúrate de que diga elevation_token
      if (!token) return;

      setIsLoggedIn(true);

      try {
        // LA LÍNEA DEL GOL: Agregamos el backend URL o vacío
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/messages`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const historialBD = await response.json();
          if (historialBD.length > 0) {
            setMessages([mensajeBienvenida, ...historialBD]);
          }
        }
      } catch (error) {
        console.error("❌ Error en la carga inicial:", error);
      }
    };

    inicializarSesion();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('');
    const endpoint = isRegistering ? 'register' : 'login';
    const bodyData = isRegistering ? { name, email, password } : { email, password };

    try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          setAuthMessage('✨ ¡Registro exitoso! Ahora puedes iniciar sesión.');
          setIsRegistering(false);
          setPassword('');
          setName('');
        } else {
          localStorage.setItem('elevation_token', data.token); // Guardamos la llave
          setIsLoggedIn(true);
         await inicializarSesion();
        }
      } else {
        setAuthMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Detalle técnico:", error);
      setAuthMessage('❌ Error de conexión con el servidor.');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');

    try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('elevation_token')}`
        },
        body: JSON.stringify({ message: userText }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      console.error("Detalle técnico:", error);
      setMessages((prev) => [...prev, { role: 'bot', text: "Lo siento, la conexión falló." }]);
    }
  };

const handleLogout = () => {
  // 1. Botamos la llave del bolsillo del navegador
  localStorage.removeItem('token'); 

  // 2. Cerramos la puerta visualmente
  setIsLoggedIn(false);            

  // 3. Reseteamos la memoria del chat al saludo inicial
  setMessages([mensajeBienvenida]); 

   setEmail('');
   setPassword('');
};

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-main">
        <div className="w-full max-w-md bg-bg-surface p-8 rounded-2xl shadow-sm border border-border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-light tracking-widest text-text-primary">ELEVATION</h1>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {isRegistering && (
              <input type="text" placeholder="Tu nombre (o un alias)" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent border-b border-border focus:border-accent-gold outline-none py-2 text-text-primary" required />
            )}
            <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border-b border-border focus:border-accent-gold outline-none py-2 text-text-primary" required />

            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-b border-border focus:border-accent-gold outline-none py-2 text-text-primary pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 bottom-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
              </button>
            </div>

            <button type="submit" className="mt-4 w-full bg-text-primary text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-medium tracking-wide">
              {isRegistering ? 'Crear mi espacio seguro' : 'Entrar'}
            </button>
          </form>

          {authMessage && <p className="mt-4 text-center text-sm text-text-secondary">{authMessage}</p>}

          <div className="mt-8 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthMessage(''); setPassword(''); setShowPassword(false); }} className="text-sm text-accent-gold hover:underline">
              {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿Nuevo aquí? Crea tu espacio seguro'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="text-2xl font-light tracking-widest text-text-secondary">ELEVATION</h1>
        <button onClick={handleLogout} className="text-sm px-4 py-2 rounded-lg text-text-secondary border border-transparent hover:border-border hover:bg-bg-surface hover:text-text-primary transition-all duration-300">
          Cerrar sesión
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl flex flex-col gap-8 overflow-y-auto mb-12">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end mt-4' : 'items-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-bg-surface text-text-primary rounded-2xl rounded-tr-sm px-6 py-4 max-w-[85%] shadow-sm whitespace-pre-wrap">
                {msg.text}
              </div>
            ) : (
              <div className="pl-4 border-l-2 border-accent-gold text-text-primary leading-relaxed text-lg whitespace-pre-wrap">
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </main>

      <footer className="w-full max-w-2xl">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                handleSend();
              }
            }}
            placeholder="Escribe tu reflexión... (Shift + Enter para salto de línea, Enter para enviar)"
            rows={2}
            className="w-full bg-transparent border-b border-border focus:border-accent-gold outline-none py-4 text-text-primary placeholder-text-secondary transition-colors duration-300 resize-none overflow-y-auto"
          />
        </div>
      </footer>
    </div>
  );
}

export default App;