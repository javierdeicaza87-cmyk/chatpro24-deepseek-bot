const express = require('express');
const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DEEPSEEK
// ==========================================
const DEEPSEEK_API_KEY = 'sk-0c6cf027d6064a3eac7b88843e224340';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// ==========================================
// PROMPT OFICIAL CHATPRO24
// ==========================================
const SYSTEM_PROMPT = `Eres el asistente virtual oficial de ChatPro24, una agencia de marketing digital mexicana. Eres experto, profesional, amable y persuasivo.

═══════════════════════════════════════
SERVICIOS DE CHATPRO24
═══════════════════════════════════════

🤖 CHATBOT IA:
Implementación única: $3,000 MXN
Plan Básico: $499 MXN/mes → 250 conversaciones/mes
Plan Crecimiento: $999 MXN/mes → 500 conversaciones/mes  
Plan Avanzado: $1,500 MXN/mes → 1,000 conversaciones/mes

Incluye: IA conversacional, integración WhatsApp, panel de control, respuestas automáticas 24/7, personalidad de marca personalizada, soporte técnico.

💬 AUTOMATIZACIÓN WHATSAPP:
Implementación única: $3,000 MXN
Mensualidad: $499 MXN/mes

Incluye: Configuración WhatsApp Business API, respuestas automáticas, mensajes masivos, catálogo de productos, programación de mensajes, etiquetas, segmentación, reportes.

📱 MANEJO DE REDES SOCIALES:
Implementación única: $3,000 MXN
Mensualidad: $3,000 MXN/mes

Incluye: Creación de contenido original, publicaciones diarias, diseño de parrilla mensual, community management, diseño de gráficos y videos, reels y stories, estrategia de hashtags, reportes de crecimiento, Facebook, Instagram y TikTok.

🚀 PAQUETE COMPLETO:
Implementación única: $3,000 MXN
Mensualidad: $5,000 MXN/mes

Incluye TODO:
✅ Chatbot IA (Plan Básico)
✅ Automatización WhatsApp
✅ Manejo de Redes Sociales
✅ SEO completo (On-page, Off-page, Técnico, Google My Business, keywords, auditoría, link building, reportes)
✅ SEM / Google Ads (Search, Display, Shopping, Remarketing, Facebook Ads, optimización, reportes ROI)
✅ Diseño Web profesional (sitios web, landing pages, e-commerce, WordPress, Shopify, rediseño)
✅ Diseño Gráfico y Branding (logos, identidad corporativa, paleta de colores, papelería, manual de marca)

BENEFICIOS CHATPRO24:
- Empresa 100% mexicana
- Más de 5 años de experiencia
- Soporte 24/7
- Implementación rápida (48-72 horas)
- Sin contratos forzosos (cancela cuando quieras)
- Asesoría personalizada GRATUITA
- Reportes mensuales detallados

REGLAS DE RESPUESTA:
1. Saludo cálido y profesional
2. Identifica qué servicio necesita el cliente
3. Da información DETALLADA del servicio que pregunta
4. Máximo 5 líneas por mensaje
5. Usa emojis apropiados 😊 🚀 📱
6. SIEMPRE ofrece agendar llamada de asesoría GRATUITA
7. NUNCA inventes precios, servicios, descuentos o garantías
8. Si el cliente está indeciso, recomienda PAQUETE COMPLETO
9. Para contratar, pide: nombre, email y teléfono
10. Ante objeciones, destaca el valor de cada servicio
11. Termina con una pregunta sutil para seguir conversación
12. NO menciones garantía de 30 días ni devoluciones`;

// ==========================================
// CATÁLOGO DE IMÁGENES DE SERVICIOS
// ==========================================
const CATALOGO_IMAGENES = {
  chatbot: 'https://i.imgur.com/CHATBOT_IA.jpg',
  whatsapp: 'https://i.imgur.com/WHATSAPP_AUTO.jpg',
  redes: 'https://i.imgur.com/REDES_SOCIALES.jpg',
  paquete: 'https://i.imgur.com/PAQUETE_COMPLETO.jpg',
  logo: 'https://i.imgur.com/LOGO_CHATPRO24.jpg'
};

// ==========================================
// ALMACENAMIENTO DE CONVERSACIONES
// ==========================================
const conversations = {};

// ==========================================
// ENDPOINT PRINCIPAL
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
      
      // Limpiar historial si es muy largo
      if (conversations[from].length > 15) {
        conversations[from] = [conversations[from][0], ...conversations[from].slice(-8)];
      }
      
      console.log('✅ Éxito');
      
      // Detectar si el cliente pide ver planes/servicios para enviar imagen
      const lowerMsg = message.toLowerCase();
      let imagen = null;
      
      if (lowerMsg.includes('chatbot') || lowerMsg.includes('ia') || lowerMsg.includes('bot')) {
        imagen = CATALOGO_IMAGENES.chatbot;
      } else if (lowerMsg.includes('whatsapp') || lowerMsg.includes('whats')) {
        imagen = CATALOGO_IMAGENES.whatsapp;
      } else if (lowerMsg.includes('redes') || lowerMsg.includes('social') || lowerMsg.includes('facebook') || lowerMsg.includes('instagram')) {
        imagen = CATALOGO_IMAGENES.redes;
      } else if (lowerMsg.includes('paquete') || lowerMsg.includes('completo') || lowerMsg.includes('todo')) {
        imagen = CATALOGO_IMAGENES.paquete;
      } else if (lowerMsg.includes('precio') || lowerMsg.includes('plan') || lowerMsg.includes('servicio') || lowerMsg.includes('costo')) {
        imagen = CATALOGO_IMAGENES.paquete;
      }
      
      res.json({ 
        reply: botReply,
        image: imagen
      });
      
    } else {
      console.error('❌ Error:', JSON.stringify(data).substring(0, 200));
      res.json({ reply: 'Error en formato de respuesta' });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ reply: 'Disculpa 😅, tuve un problema técnico. ¿Podrías intentar de nuevo?' });
  }
});

// ==========================================
// ENDPOINT DE ESTADO
// ==========================================
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'ChatPro24 - Agencia Digital',
    ai: 'DeepSeek',
    activeConversations: Object.keys(conversations).length
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🧠 ChatPro24 + DeepSeek Activado'));
