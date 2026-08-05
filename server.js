const express = require('express');
const app = express();
app.use(express.json());

const KEY = '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';

app.post('/webhook', async (req, res) => {
  const { message } = req.body;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'user', content: message }
        ]
      })
    });
    
    const data = await response.json();
    console.log('RESPUESTA:', JSON.stringify(data).substring(0, 300));
    
    let reply = 'Sin respuesta';
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      reply = data.choices[0].message.content;
    } else if (data.error) {
      reply = 'Error API: ' + data.error.message;
    }
    
    res.json({ reply: reply });
    
  } catch (error) {
    res.json({ reply: 'Error: ' + error.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'active', model: 'Gemini Flash 2.0' }));

app.listen(3000, () => console.log('Bot listo'));
