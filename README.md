<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPT Elevation - Explora tu Mente</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #667eea;
            --primary-dark: #5a6fd8;
            --secondary: #764ba2;
            --accent: #f093fb;
            --success: #4ecdc4;
            --warning: #ffecd2;
            --danger: #ff6b6b;
            --dark: #2d3748;
            --light: #f7fafc;
            --gray: #a0aec0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            min-height: 100vh;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header */
        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header h1 {
            color: white;
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            color: rgba(255, 255, 255, 0.9);
            text-align: center;
            font-size: 1.1rem;
        }

        /* Navigation */
        .nav-tabs {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .nav-tab {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 15px 25px;
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 1rem;
        }

        .nav-tab:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .nav-tab.active {
            background: var(--accent);
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
        }

        /* Content Panels */
        .content-panel {
            display: none;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            min-height: 600px;
        }

        .content-panel.active {
            display: block;
            animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Chat Interface */
        .chat-container {
            height: 500px;
            display: flex;
            flex-direction: column;
            border: 2px solid var(--primary);
            border-radius: 15px;
            overflow: hidden;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: linear-gradient(to bottom, #f8f9ff, #ffffff);
        }

        .message {
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }

        .message.user {
            flex-direction: row-reverse;
        }

        .message-content {
            max-width: 70%;
            padding: 15px 20px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .message.assistant .message-content {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border-bottom-left-radius: 5px;
        }

        .message.user .message-content {
            background: var(--success);
            color: white;
            border-bottom-right-radius: 5px;
        }

        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: white;
        }

        .message.assistant .message-avatar {
            background: var(--accent);
        }

        .message.user .message-avatar {
            background: var(--success);
        }

        .chat-input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
        }

        .chat-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 25px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.3s ease;
        }

        .chat-input:focus {
            border-color: var(--primary);
        }

        .send-btn {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s ease;
        }

        .send-btn:hover {
            transform: scale(1.05);
        }

        .send-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Mind Map */
        .mind-map-container {
            height: 500px;
            border: 2px solid var(--primary);
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            background: linear-gradient(45deg, #f0f2f5, #ffffff);
        }

        .mind-map-canvas {
            width: 100%;
            height: 100%;
            cursor: grab;
        }

        .mind-map-canvas:active {
            cursor: grabbing;
        }

        .mind-map-controls {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            gap: 10px;
        }

        .control-btn {
            background: rgba(255, 255, 255, 0.9);
            border: none;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .control-btn:hover {
            background: white;
            transform: translateY(-2px);
        }

        /* User Profile */
        .profile-section {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 20px;
            text-align: center;
        }

        .profile-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            margin: 0 auto 20px;
            border: 4px solid rgba(255, 255, 255, 0.3);
        }

        .profile-form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group label {
            font-weight: 600;
            color: var(--dark);
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary);
        }

        /* Therapists Directory */
        .therapists-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .therapist-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            border: 2px solid transparent;
        }

        .therapist-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary);
        }

        .therapist-info h3 {
            color: var(--dark);
            margin-bottom: 10px;
        }

        .therapist-info p {
            color: var(--gray);
            margin-bottom: 5px;
        }

        .book-btn {
            background: linear-gradient(135deg, var(--success), #36d1dc);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            margin-top: 15px;
            font-size: 1rem;
            transition: transform 0.2s ease;
        }

        .book-btn:hover {
            transform: scale(1.05);
        }

        /* Buttons */
        .btn {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: linear-gradient(135deg, var(--gray), #718096);
        }

        .btn-success {
            background: linear-gradient(135deg, var(--success), #36d1dc);
        }

        /* Calendar Styles */
        .calendar {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-top: 20px;
        }

        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid #e2e8f0;
        }

        .calendar-day:hover {
            background: var(--primary);
            color: white;
        }

        .calendar-day.available {
            background: rgba(78, 205, 196, 0.1);
            border-color: var(--success);
        }

        .calendar-day.selected {
            background: var(--primary);
            color: white;
        }

        /* Export Section */
        .export-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .export-card {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .export-card:hover {
            transform: scale(1.05);
        }

        .export-card i {
            font-size: 3rem;
            margin-bottom: 15px;
            display: block;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .nav-tabs {
                flex-direction: column;
            }
            
            .profile-form {
                grid-template-columns: 1fr;
            }
            
            .therapists-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Loading Spinner */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Notification */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        }

        .notification.show {
            opacity: 1;
            transform: translateX(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1><i class="fas fa-brain"></i> GPT Elevation</h1>
            <p>Tu compañero para la exploración mental y el crecimiento personal</p>
        </div>

        <!-- Navigation -->
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showPanel('chat')">
                <i class="fas fa-comments"></i> Chat IA
            </button>
            <button class="nav-tab" onclick="showPanel('mindmap')">
                <i class="fas fa-project-diagram"></i> Mapa Mental
            </button>
            <button class="nav-tab" onclick="showPanel('therapists')">
                <i class="fas fa-user-md"></i> Terapeutas
            </button>
            <button class="nav-tab" onclick="showPanel('profile')">
                <i class="fas fa-user"></i> Mi Perfil
            </button>
            <button class="nav-tab" onclick="showPanel('reports')">
                <i class="fas fa-chart-line"></i> Reportes
            </button>
        </div>

        <!-- Chat Panel -->
        <div id="chat" class="content-panel active">
            <h2 style="margin-bottom: 20px; color: var(--dark);">
                <i class="fas fa-robot"></i> Conversación con GPT Elevation
            </h2>
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    <div class="message assistant">
                        <div class="message-avatar">
                            <i class="fas fa-brain"></i>
                        </div>
                        <div class="message-content">
                            Hola, soy GPT Elevation. Estoy aquí para acompañarte en tu exploración mental. ¿Cómo te sientes hoy? ¿Hay algo específico en lo que te gustaría reflexionar?
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Escribe tu mensaje aquí..." onkeypress="handleChatKeyPress(event)">
                    <button class="send-btn" id="sendBtn" onclick="sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="saveConversation()">
                    <i class="fas fa-save"></i> Guardar Conversación
                </button>
                <button class="btn btn-secondary" onclick="startGuidedReflection()">
                    <i class="fas fa-lightbulb"></i> Reflexión Guiada
                </button>
                <button class="btn btn-secondary" onclick="createRitual()">
                    <i class="fas fa-magic"></i> Crear Ritual
                </button>
            </div>
        </div>

        <!-- Mind Map Panel -->
        <div id="mindmap" class="content-panel">
            <h2 style="margin-bottom: 20px; color: var(--dark);">
                <i class="fas fa-project-diagram"></i> Mapa Mental Simbólico
            </h2>
            <div class="mind-map-container">
                <canvas class="mind-map-canvas" id="mindMapCanvas"></canvas>
                <div class="mind-map-controls">
                    <button class="control-btn" onclick="addNode()" title="Agregar Nodo">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="control-btn" onclick="clearMap()" title="Limpiar Mapa">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="control-btn" onclick="exportMap()" title="Exportar Mapa">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="color: var(--dark); margin-bottom: 15px;">Símbolos Disponibles:</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn" onclick="selectSymbol('💭')">💭 Pensamientos</button>
                    <button class="btn" onclick="selectSymbol('❤️')">❤️ Emociones</button>
                    <button class="btn" onclick="selectSymbol('⚡')">⚡ Energía</button>
                    <button class="btn" onclick="selectSymbol('🌱')">🌱 Crecimiento</button>
                    <button class="btn" onclick="selectSymbol('🎯')">🎯 Objetivos</button>
                    <button class="btn" onclick="selectSymbol('🌊')">🌊 Flujo</button>
                </div>
            </div>
        </div>

        <!-- Therapists Panel -->
        <div id="therapists" class="content-panel">
            <h2 style="margin-bottom: 20px; color: var(--dark);">
                <i class="fas fa-user-md"></i> Directorio de Terapeutas Certificados
            </h2>
            <div class="therapists-grid" id="therapistsGrid">
                <!-- Therapists will be loaded here -->
            </div>

            <!-- Appointment Calendar -->
            <div id="appointmentModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 20px; max-width: 500px; width: 90%;">
                    <h3 style="margin-bottom: 20px; color: var(--dark);">Agendar Cita</h3>
                    <div id="therapistInfo"></div>
                    <div class="calendar" id="calendar">
                        <div class="calendar-header">
                            <button class="btn btn-secondary" onclick="changeMonth(-1)">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <h4 id="currentMonth" style="color: var(--dark);"></h4>
                            <button class="btn btn-secondary" onclick="changeMonth(1)">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="calendar-grid" id="calendarGrid"></div>
                    </div>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="closeAppointmentModal()">Cancelar</button>
                        <button class="btn btn-success" onclick="confirmAppointment()">Confirmar Cita</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile Panel -->
        <div id="profile" class="content-panel">
            <div class="profile-section">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <h2 id="userName">Tu Perfil Personal</h2>
                <p>Personaliza tu experiencia en GPT Elevation</p>
            </div>

            <form class="profile-form" onsubmit="saveProfile(event)">
                <div class="form-group">
                    <label for="name">Nombre Completo</label>
                    <input type="text" id="name" placeholder="Tu nombre completo">
                </div>
                <div class="form-group">
                    <label for="age">Edad</label>
                    <input type="number" id="age" min="14" max="120" placeholder="Tu edad">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="tu@email.com">
                </div>
                <div class="form-group">
                    <label for="phone">Teléfono</label>
                    <input type="tel" id="phone" placeholder="+1234567890">
                </div>
                <div class="form-group">
                    <label for="goals">Objetivos Personales</label>
                    <textarea id="goals" rows="4" placeholder="¿Qué esperas lograr con GPT Elevation?"></textarea>
                </div>
                <div class="form-group">
                    <label for="challenges">Desafíos Actuales</label>
                    <textarea id="challenges" rows="4" placeholder="¿Qué desafíos estás enfrentando actualmente?"></textarea>
                </div>
                <div class="form-group">
                    <label for="preferences">Preferencias de Comunicación</label>
                    <select id="preferences">
                        <option value="empathetic">Empático y pausado</option>
                        <option value="direct">Directo y práctico</option>
                        <option value="analytical">Analítico y reflexivo</option>
                        <option value="creative">Creativo e imaginativo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notifications">Recordatorios</label>
                    <select id="notifications">
                        <option value="daily">Diarios</option>
                        <option value="weekly">Semanales</option>
                        <option value="none">Sin recordatorios</option>
                    </select>
                </div>
                <div style="grid-column: 1 / -1;">
                    <button type="submit" class="btn" style="width: 100%;">
                        <i class="fas fa-save"></i> Guardar Perfil
                    </button>
                </div>
            </form>
        </div>

        <!-- Reports Panel -->
        <div id="reports" class="content-panel">
            <h2 style="margin-bottom: 20px; color: var(--dark);">
                <i class="fas fa-chart-line"></i> Reportes y Exportación
            </h2>
            
            <div class="export-options">
                <div class="export-card" onclick="exportConversations()">
                    <i class="fas fa-comments"></i>
                    <h3>Conversaciones</h3>
                    <p>Exporta tu historial de conversaciones con GPT Elevation</p>
                </div>
                <div class="export-card" onclick="exportMindMaps()">
                    <i class="fas fa-project-diagram"></i>
                    <h3>Mapas Mentales</h3>
                    <p>Descarga todos tus mapas mentales simbólicos</p>
                </div>
                <div class="export-card" onclick="exportProgress()">
                    <i class="fas fa-chart-line"></i>
                    <h3>Progreso Personal</h3>
                    <p>Reporte detallado de tu crecimiento y evolución</p>
                </div>
                <div class="export-card" onclick="exportRituals()">
                    <i class="fas fa-magic"></i>
                    <h3>Rituales y Prácticas</h3>
                    <p>Guía de tus rituales personalizados</p>
                </div>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 15px; color: white;">
                <h3 style="margin-bottom: 15px;">
                    <i class="fas fa-crown"></i> Funciones Premium
                </h3>
                <p style="margin-bottom: 15px;">Desbloquea análisis avanzados y reportes detallados con nuestra versión premium.</p>
                <button class="btn" style="background: white; color: var(--primary);" onclick="showPremiumInfo()">
                    <i class="fas fa-star"></i> Saber Más
                </button>
            </div>
        </div>

        <!-- Notification -->
        <div id="notification" class="notification"></div>
    </div>

    <script>
        // Global Variables
        let currentPanel = 'chat';
        let currentUser = {};
        let conversations = [];
        let mindMaps = [];
        let therapists = [];
        let selectedSymbol = '💭';
        let currentDate = new Date();
        let selectedTherapist = null;
        let selectedDate = null;

        // API Configuration (User needs to add their OpenAI API key)
        const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // User must replace this

        // Initialize App
        document.addEventListener('DOMContentLoaded', function() {
            loadUserData();
            loadTherapists();
            initializeMindMap();
            showNotification('¡Bienvenido a GPT Elevation!', 'success');
        });

        // Panel Navigation
        function showPanel(panelId) {
            // Hide all panels
            document.querySelectorAll('.content-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected panel
            document.getElementById(panelId).classList.add('active');
            event.target.classList.add('active');
            
            currentPanel = panelId;
        }

        // Chat Functions
        function handleChatKey
