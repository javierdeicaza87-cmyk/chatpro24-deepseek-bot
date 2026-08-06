const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN
// ==========================================
const DEEPSEEK_API_KEY = 'sk-0c6cf027d6064a3eac7b88843e224340';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const VERIFY_TOKEN = 'chatpro24_token_2024';
const WHATSAPP_TOKEN = 'EL_TOKEN_DE_META_QUE_COPIASTE';

// ==========================================
// PROMPT CHATPRO24
// ==========================================
const SYSTEM_PROMPT = `Eres el asistente virtual oficial de ChatPro24, una agencia de marketing digital mexicana. Eres amable, profesional y persuasivo.

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
- Incluye: SEO + Redes Sociales + Chatbot IA + WhatsApp + Diseño Web + SEM + Branding

BENEFICIOS:
- Soporte 24/7
- Implementación en 48-72 horas
- Sin contratos forzosos
- Asesoría personalizada gratuita
- Empresa 100% mexicana

REGLAS:
1. Respuestas cortas y cálidas con emojis 😊
2. SIEMPRE ofrece agendar una llamada gratuita
3. NUNCA inventes precios, servicios o garantías
4. Si el cliente duda, recomienda el Paquete Completo
5. Termina cada respuesta con una pregunta sutil`;

const conversations = {};

// ==========================================
// VERIFICACIÓN DE META (GET)
// ==========================================
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log('🔑 Verificación Meta - mode:', mode, 'token:', token);
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado por Meta');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Token incorrecto');
    res.sendStatus(403);
  }
});

// ==========================================
// RECIBIR MENSAJES (POST) - WHATSAPP
// ==========================================
app.post('/webhook', async (req, res) => {
  // Responder a Meta inmediatamente
  res.sendStatus(200);
  
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    
    if (value?.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const text = msg.text?.body || '';
      
      console.log('📩 WhatsApp de', from, ':', text);
      
      // Inicializar conversación
      if (!conversations[from]) {
        conversations[from] = [{ role: 'system', content: SYSTEM_PROMPT }];
      }
      conversations[from].push({ role: 'user', content: text });
      
      // Llamar a DeepSeek
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
      const reply = data.choices[0].message.content;
      
      conversations[from].push({ role: 'assistant', content: reply });
      
      // Limpiar historial
      if (conversations[from].length > 15) {
        conversations[from] = [conversations[from][0], ...conversations[from].slice(-8)];
      }
      
      // Enviar respuesta a WhatsApp
      const phoneId = value.metadata.phone_number_id;
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: from,
          text: { body: reply }
        })
      });
      
      console.log('✅ Respuesta enviada a WhatsApp');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'ChatPro24 + Meta WhatsApp API',
    ai: 'DeepSeek',
    activeConversations: Object.keys(conversations).length
  });
});

// ==========================================
// INICIAR
// ==========================================
app.listen(3000, () => console.log('📱 ChatPro24 + Meta API listo'));
