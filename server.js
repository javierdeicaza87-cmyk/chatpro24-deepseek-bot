const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN GOOGLE GEMINI (GRATIS)
// ==========================================
const GEMINI_KEY = 'AQ.Ab8RN6Ku4OWWGUbqsywctAKrDC7tgIHX3JgtsnUL7ajk29Y0qA';

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

REGLAS DE RESPUESTA:
1. Sé cálido y profesional
2. Usa emojis ocasionalmente 😊
3. Respuestas cortas (máximo 4 líneas)
4. SIEMPRE ofrece agendar una llamada gratuita
5. NUNCA inventes precios o servicios
6. Si el cliente duda, recomienda el Paquete Completo`;

// ==========================================
// ALMACENAMIENTO DE CONVERSACIONES
// ==========================================
const conversations = {};

// ==========================================
// ENDPOINT PRINCIPAL DEL WEBHOOK
// ==========================================
app.post('/webhook', async (req, res) => {
  const { message, from } = req.body;
  
  console.log('📩 Mensaje recibido:', message);
  
  // Inicializar conversación si es nueva
  if (!conversations[from]) {
    conversations[from] = [];
  }
  
  try {
    // Construir mensaje con contexto del sistema
    const prompt = SYSTEM_PROMPT + "\n\nCliente: " + message + "\n\nAsistente:";
    
    // Llamar a Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250
          }
        })
      }
    );
    
    const data = await response.json();
    console.log('📤 Status:', response.status);
    
    // Verificar respuesta exitosa
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const botReply = data.candidates[0].content.parts[0].text;
      
      // Guardar en historial
      conversations[from].push({ 
        user: message, 
        bot: botReply 
      });
      
      // Limitar historial
      if (conversations[from].length > 10) {
        conversations[from] = conversations[from].slice(-10);
      }
      
      console.log('✅ Respuesta exitosa');
      res.json({ reply: botReply });
      
    } else if (data.error) {
      console.error('❌ Error Gemini:', data.error.message);
      res.json({ 
        reply: "Disculpa 😅, error de API: " + data.error.message 
      });
    } else {
      console.error('❌ Formato inesperado:', JSON.stringify(data));
      res.json({ 
        reply: "Disculpa, hubo un error en el formato de respuesta." 
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ 
      reply: "Disculpa 😅, tuve un problema técnico. ¿Podrías intentar de nuevo?" 
    });
  }
});

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'ChatPro24 + Google Gemini',
    model: 'Gemini 2.0 Flash',
    cost: 'GRATIS',
    limit: '1,500 solicitudes/día',
    activeConversations: Object.keys(conversations).length
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🧠 ChatPro24 + Gemini Activado');
  console.log('🤖 Modelo: Gemini 2.0 Flash (GRATIS)');
  console.log('✅ Listo para recibir mensajes');
});
