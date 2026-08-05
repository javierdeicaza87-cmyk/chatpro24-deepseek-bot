const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN OPENROUTER (GRATIS)
// ==========================================
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
- Incluye: IA conversacional, integración WhatsApp, panel de control, soporte técnico

💬 AUTOMATIZACIÓN WHATSAPP:
- Implementación única: $3,000 MXN
- Mensualidad: $499 MXN/mes
- Incluye: Respuestas automáticas, mensajes masivos, programación, chatbot básico

📱 MANEJO DE REDES SOCIALES:
- Implementación única: $3,000 MXN
- Mensualidad: $3,000 MXN/mes
- Incluye: Facebook, Instagram, TikTok, creación de contenido, 12 publicaciones/mes

🚀 PAQUETE COMPLETO (MÁS VENDIDO):
- Implementación única: $3,000 MXN
- Mensualidad: $5,000 MXN/mes
- Incluye: SEO + Redes Sociales + Chatbot IA + Automatización WhatsApp
- Beneficio: Ahorro de $1,999 MXN/mes vs contratar por separado

BENEFICIOS DE CHATPRO24:
- Soporte 24/7
- Implementación en 48 horas
- Sin contratos forzosos
- Garantía de satisfacción 30 días
- Asesoría personalizada gratuita
- Empresa 100% mexicana

REGLAS DE RESPUESTA:
1. Saluda solo la primera vez que el cliente escribe
2. Sé cálido, profesional y usa emojis ocasionalmente 😊
3. Respuestas cortas y directas (máximo 4 líneas)
4. SIEMPRE ofrece agendar una llamada de asesoría gratuita de 15 minutos
5. Si el cliente pregunta por algo fuera de los servicios, ofrece conectar con un asesor humano
6. NUNCA inventes precios, características o servicios
7. Si el cliente está indeciso, recomienda el PAQUETE COMPLETO destacando el ahorro
8. Para objeciones de precio, menciona la garantía de 30 días y el ROI
9. Si el cliente quiere contratar, pide: nombre, email y teléfono
10. Termina cada respuesta con una pregunta sutil para continuar la conversación`;

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
    conversations[from] = [
      { role: "system", content: SYSTEM_PROMPT }
    ];
  }
  
  // Agregar mensaje del usuario
  conversations[from].push({ role: "user", content: message });
  
  try {
    // Llamar a OpenRouter (modelo GRATIS)
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://chatpro24.com',
        'X-Title': 'ChatPro24'
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: conversations[from],
        temperature: 0.7,
        max_tokens: 250
      })
    });
    
    const data = await response.json();
    console.log('✅ Respuesta recibida');
    
    // Verificar y extraer respuesta
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const botReply = data.choices[0].message.content;
      
      // Guardar en historial
      conversations[from].push({ role: "assistant", content: botReply });
      
      // Limpiar historial si es muy largo
      if (conversations[from].length > 15) {
        conversations[from] = [
          conversations[from][0],
          ...conversations[from].slice(-8)
        ];
      }
      
      res.json({ reply: botReply });
    } else {
      console.error('❌ Formato inesperado:', JSON.stringify(data));
      res.json({ reply: "Disculpa, hubo un error en el formato de respuesta. Intenta de nuevo." });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ 
      reply: "Disculpa 😅, tuve un problema técnico. ¿Podrías intentar de nuevo? Si el problema persiste, contáctanos por teléfono." 
    });
  }
});

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'ChatPro24 + OpenRouter (Gemini Flash)',
    cost: 'GRATIS',
    activeConversations: Object.keys(conversations).length
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🧠 ChatPro24 Bot Activado');
  console.log('🤖 Modelo: Google Gemini Flash (GRATIS)');
  console.log('✅ Listo para recibir mensajes');
});
