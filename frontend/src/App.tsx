import { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  // Guardamos el historial de la conversación
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hola. Soy Elevation. Gracias por acercarte. Este espacio es para explorar lo que sientes, lo que vives y lo que sueñas. ¿Desde dónde estás llegando hoy?' }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Agregamos lo que el usuario escribió a la pantalla
    const userText = input;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput(''); // Limpiamos la barra de texto

    try {
      // 2. Enviamos el mensaje a nuestra Bóveda Segura (Backend)
      const response = await fetch(`http://${window.location.hostname}:3000/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      // 3. Agregamos la respuesta del backend a la pantalla
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      console.error("Error conectando al backend:", error);
      setMessages((prev) => [...prev, { role: 'bot', text: "Lo siento, la conexión con mi bóveda segura falló." }]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12">
      
      {/* Cabecera */}
      <header className="w-full max-w-2xl text-center mb-8">
        <h1 className="text-2xl font-light tracking-widest text-text-secondary">
          ELEVATION
        </h1>
      </header>

      {/* Área del Chat Dinámica */}
      <main className="flex-1 w-full max-w-2xl flex flex-col gap-8 overflow-y-auto mb-12">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end mt-4' : 'items-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-bg-surface text-text-primary rounded-2xl rounded-tr-sm px-6 py-4 max-w-[85%] shadow-sm">
                {msg.text}
              </div>
            ) : (
              <div className="pl-4 border-l-2 border-accent-gold text-text-primary leading-relaxed text-lg">
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Área de Input */}
      <footer className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu reflexión... (Presiona Enter para enviar)"
            className="w-full bg-transparent border-b border-border focus:border-accent-gold outline-none py-4 text-text-primary placeholder-text-secondary transition-colors duration-300"
          />
        </div>
        <p className="text-center text-[10px] text-text-secondary mt-4">
          Un espacio seguro y confidencial.
        </p>
      </footer>

    </div>
  );
}

export default App;