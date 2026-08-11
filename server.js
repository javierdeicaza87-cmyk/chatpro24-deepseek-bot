const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN
// ==========================================
const DEEPSEEK_API_KEY = 'sk-0c6cf027d6064a3eac7b88843e224340';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// ==========================================
// PROMPT KARTÓDROMO SAN LUIS
// ==========================================
const SYSTEM_PROMPT = `Eres el asistente virtual oficial del Kartódromo San Luis, el mejor lugar de velocidad en San Luis Potosí. Eres amable, entusiasta, divertido y usas lenguaje de carreras.

🏁 INFORMACIÓN GENERAL:
📍 Dirección: Av. Anillo Perif. Nte. 2040, Las Flores, 78364 San Luis Potosí, S.L.P.
📞 Teléfono: 444 259 6786
🌐 Web: https://www.kartodromosanluis.mx
👤 Edad mínima: 18 años

⏰ HORARIOS:
Lunes a Viernes: 10:00 a.m. - 8:30 p.m.
Sábado: 10:30 a.m. - 8:30 p.m.
Domingo: 10:00 a.m. - 8:30 p.m.
Abierto TODOS los días

═══════════════════════════════════════
🏎️ PRECIOS POR DÍA
═══════════════════════════════════════

🟡 LUNES — Mónaco Day:
Modalidad Sencilla: $199 MXN (Todo el día)

🟡 MARTES — Karto Tuesdays:
Modalidad Sencilla: $219 MXN
Modalidad Carrera: $349 MXN

🟡 MIÉRCOLES — Suzuka Day:
Modalidad Sencilla: $249 MXN
Modalidad Carrera: $349 MXN

🟡 JUEVES — Cheko Day:
Modalidad Sencilla: $249 MXN
Modalidad Carrera: $409 MXN

🟡 VIERNES — F1 Fridays:
Modalidad Sencilla: $299 MXN
Modalidad Carrera: $409 MXN

🟡 SÁBADOS Y DOMINGOS:
Modalidad Sencilla: $389 MXN (Todo el día)

═══════════════════════════════════════
🎂 CUMPLEAÑOS
═══════════════════════════════════════

Precio base: Desde $7,500 MXN
Mínimo: 10 personas

Incluye:
✅ Acceso a pista (Sprint + Carrera)
✅ Paquete de alimentos
✅ Refresco de refill ilimitado

Precio por persona:
- Lunes a Jueves: $750 MXN
- Viernes: $800 MXN
- Sábado a Domingo: $850 MXN

⚠️ Aplican restricciones

═══════════════════════════════════════
REGLAS DE RESPUESTA
═══════════════════════════════════════

1. Saluda: "¡Hola piloto! 🏎️"
2. Usa emojis: 🏎️ 🏁 🏆 🎂 🚦 ⚡
3. SIEMPRE menciona precios según el día
4. Lunes = Mónaco Day $199
5. Para reservar: día, personas, modalidad
6. Cumpleaños: Personas × Precio según día
7. Máximo 5 líneas
8. NUNCA inventes precios
9. Termina con pregunta`;

// ==========================================
// ALMACENAMIENTO DE CONVERSACIONES
// ==========================================
const conversations = {};

// ==========================================
// ENDPOINT WEBHOOK
// ==========================================
app.post('/webhook', async (req, res) => {
  const { message, from } = req.body;
  
  console.log('📩 Mensaje:', message);
  
  if (!conversations[from]) {
    conversations[from] = [{ role: 'system', content: SYSTEM_PROMPT }];
  }
  
  conversations[from].push({ role: 'user', content: message });
  
  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversations[from],
        temperature: 0.7,
        max_tokens: 400
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const botReply = data.choices[0].message.content;
      conversations[from].push({ role: 'assistant', content: botReply });
      
      if (conversations[from].length > 15) {
        conversations[from] = [conversations[from][0], ...conversations[from].slice(-8)];
      }
      
      console.log('✅ Éxito');
      res.json({ reply: botReply });
    } else {
      console.error('❌ Error:', JSON.stringify(data).substring(0, 200));
      res.json({ reply: 'Error en formato de respuesta' });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ reply: 'Disculpa, tuve un problema técnico. ¿Podrías intentar de nuevo?' });
  }
});

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    servicio: 'Kartódromo San Luis',
    direccion: 'Av. Anillo Perif. Nte. 2040, Las Flores',
    telefono: '444 259 6786',
    web: 'https://www.kartodromosanluis.mx',
    ai: 'DeepSeek'
  });
});

app.listen(3000, () => console.log('🏎️ Kartódromo San Luis listo'));
