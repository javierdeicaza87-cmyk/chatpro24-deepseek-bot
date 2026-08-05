const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN - CAMBIA ESTO
// ==========================================
const DEEPSEEK_API_KEY = 'sk-7c1d9e6f2b8a4f3e5d7c9b1a2f4e6d8c0b3a5f7e9d1c4b6a8f0e2d4c7b9a1f3';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

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
10. Termina cada respuesta con una pregunta sutil para continuar la conversación

EJEMPLO DE RESPUESTA PARA "QUIERO INFORMACIÓN":
"¡Claro que sí! 😊 En ChatPro24 tenemos 4 servicios principales. Nuestro más vendido es el Paquete Completo por $5,000 MXN/mes que incluye SEO, Redes Sociales, Chatbot IA y WhatsApp. ¿Te gustaría que te cuente más sobre este o prefieres conocer otro servicio?"

EJEMPLO DE RESPUESTA PARA "ESTÁ CARO":
"¡Te entiendo! Pero mira, el Paquete Completo te ahorra $1,999 MXN/mes vs contratar servicios por separado. Además, ofrecemos garantía de 30 días: si no ves resultados, te devolvemos tu dinero. ¿Te animas a una llamada gratuita de 15 minutos para ver si es para ti?"`;

// ==========================================
// ALMACENAMIENTO DE CONVERSACIONES
// ==========================================
const conversations = {};

// ==========================================
// ENDPOINT PRINCIPAL DEL WEBHOOK
// ==========================================
app.post('/webhook', async (req, res) => {
  const { message, from } = req.body;
  
  console.log('📩 Mensaje recibido de', from, ':', message);
  
  // Inicializar conversación si es nueva
  if (!conversations[from]) {
    conversations[from] = [
      { role: "system", content: SYSTEM_PROMPT }
    ];
    console.log('🆕 Nueva conversación para', from);
  }
  
  // Agregar mensaje del usuario al historial
  conversations[from].push({ 
    role: "user", 
    content: message 
  });
  
  try {
    // Llamar a la API de DeepSeek
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: conversations[from],
        temperature: 0.7,
        max_tokens: 250
      })
    });
    
    const data = await response.json();
    console.log('✅ Respuesta DeepSeek recibida');
    
    const botReply = data.choices[0].message.content;
    
    // Guardar respuesta en historial
    conversations[from].push({ 
      role: "assistant", 
      content: botReply 
    });
    
    // Limpiar historial si es muy largo
    if (conversations[from].length > 15) {
      conversations[from] = [
        conversations[from][0], // Mantener system prompt
        ...conversations[from].slice(-8) // Últimos 8 mensajes
      ];
      console.log('🧹 Historial limpiado para', from);
    }
    
    // Enviar respuesta
    res.json({ reply: botReply });
    console.log('📤 Respuesta enviada a', from);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ 
      reply: "Disculpa 😅, tuve un problema técnico. ¿Podrías intentar de nuevo? Si el problema persiste, contáctanos por teléfono al (55) 1234-5678." 
    });
  }
});

// ==========================================
// ENDPOINT PARA REINICIAR CONVERSACIÓN
// ==========================================
app.post('/reset', (req, res) => {
  const { from } = req.body;
  delete conversations[from];
  console.log('🔄 Conversación reiniciada para', from);
  res.json({ success: true, message: 'Conversación reiniciada' });
});

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/', (req, res) => {
  const activeConversations = Object.keys(conversations).length;
  res.json({
    status: 'active',
    service: 'ChatPro24 + DeepSeek',
    version: '1.0.0',
    activeConversations: activeConversations,
    uptime: process.uptime()
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🧠 ChatPro24 + DeepSeek Bot Activado');
  console.log('📍 Puerto:', PORT);
  console.log('🌐 Webhook:', `http://localhost:${PORT}/webhook`);
  console.log('✅ Listo para recibir mensajes');
});
