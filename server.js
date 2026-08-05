const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN GOOGLE GEMINI (GRATIS)
// ==========================================
const GEMINI_KEY = 'AIzaSyBeiz-Ud5NMMVNmxGLtKalEICYvphNI1LA';

// ==========================================
// PROMPT DEL ASISTENTE CHATPRO24
// ==========================================
const SYSTEM_PROMPT = `Eres el asistente virtual oficial de ChatPro24, una agencia mexicana de marketing digital y automatización. Eres amable, profesional, entusiasta y persuasivo.

INFORMACIÓN OFICIAL DE SERVICIOS:

🤖 CHATBOT IA:
- Implementación única: $3,000 MXN
- Plan Básico: $499 MXN/mes → 250 conversaciones/mes
- Plan Crecimiento: $999 MXN/mes → 500 conversaciones/mes  
- Plan Avanzado: $1,500 MXN/mes → 1,000 conversaciones/mes

💬 AUTOMATIZACIÓN WHATSAPP:
- Implementación única: $3,000 MXN
- Mensualidad: $499 MXN/mes

📱 MANEJO DE REDES SOCIALES:
- Implementación única: $3,000 MXN
- Mensualidad: $3,000 MXN/mes

🚀 PAQUETE COMPLETO:
- Implementación única: $3,000 MXN
- Mensualidad: $5,000 MXN/mes
- Incluye: SEO + Redes Sociales + Chatbot IA + WhatsApp

BENEFICIOS:
- Soporte 24/7
- Implementación en 48 horas
- Garantía de satisfacción 30 días
- Sin contratos forzosos

REGLAS:
1. Sé cálido y profesional
2. Usa emojis ocasionalmente 😊
3. Respuestas cortas (máximo 4 líneas)
4. SIEMPRE ofrece agendar una llamada gratuita
5. NUNCA inventes precios o servicios`;

const conversations = {};

app.post('/webhook', async (req, res) => {
  const { message, from } = req.body;
  
  console.log('📩 Mensaje:', message);
  
  if (!conversations[from]) {
    conversations[from] = [];
  }
  
  try {
    const prompt = SYSTEM_PROMPT + '\n\nCliente: ' + message + '\n\nAsistente:';
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
        })
      }
    );
    
    const data = await response.json();
    console.log('📤 Status:', response.status);
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const botReply = data.candidates[0].content.parts[0].text;
      conversations[from].push({ user: message, bot: botReply });
      if (conversations[from].length > 10) conversations[from] = conversations[from].slice(-10);
      console.log('✅ Éxito');
      res.json({ reply: botReply });
    } else if (data.error) {
      console.error('❌ Error:', data.error.message);
      res.json({ reply: 'Error: ' + data.error.message });
    } else {
      console.error('❌ Formato:', JSON.stringify(data).substring(0, 200));
      res.json({ reply: 'Error de formato' });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ reply: 'Error técnico 😅' });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'ChatPro24 + Gemini',
    cost: 'GRATIS'
  });
});

app.listen(3000, () => console.log('🧠 ChatPro24 + Gemini listo'));
