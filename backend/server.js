const express = require('express');
const cors = require('cors');

const app = express();

// Configuración de seguridad básica
app.use(cors()); // Permite que el frontend se comunique con el backend
app.use(express.json()); // Permite leer los mensajes en formato JSON

// Nuestra ruta principal (El punto de entrada del chat)
app.post('/api/chat', (req, res) => {
    const mensajeUsuario = req.body.message;
    
    console.log("🔒 [Bóveda Node.js] Mensaje recibido:", mensajeUsuario);

    // Por ahora, enviamos una respuesta simulada para probar la conexión.
    // Más adelante, aquí conectaremos a Claude 3.5 Sonnet.
    res.json({
        reply: "Te escucho profundamente. (Nota técnica: ¡Tu backend está conectado con éxito!)"
    });
});

// Encendemos el motor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor seguro de Elevation corriendo en el puerto ${PORT}`);
});