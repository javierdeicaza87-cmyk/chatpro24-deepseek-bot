const express = require('express');
const app = express();
app.use(express.json());

const KEY = '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';

// Lista de modelos gratis para probar
const MODELS = [
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.1-8b-instruct:free'
];

async function tryModel(model, message) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: message }]
    })
  });
  
  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return { success: true, reply: data.choices[0].message.content, model: model };
  } else {
    return { success: false, error: data.error?.message || 'Error desconocido' };
  }
}

app.post('/webhook', async (req, res) => {
  const { message } = req.body;
  
  for (const model of MODELS) {
    console.log('Probando modelo:', model);
    const result = await tryModel(model, message);
    
    if (result.success) {
      console.log('✅ Funcionó con:', model);
      return res.json({ reply: result.reply });
    } else {
      console.log('❌ Falló:', model, '-', result.error);
    }
  }
  
  res.json({ reply: 'Todos los modelos fallaron. Revisa logs.' });
});

app.get('/', (req, res) => res.json({ status: 'active' }));

app.listen(3000, () => console.log('Bot listo - Probando modelos'));
