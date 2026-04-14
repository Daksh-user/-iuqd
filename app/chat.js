export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key not configured on server.' });

  try {
    const { messages, subject } = req.body;

    const systemPrompt = `You are LumiqAI, a world-class educational assistant specialising in ${subject || 'general knowledge'}. Explain concepts clearly with structured headings, examples, and bullet points where helpful. Be concise but thorough. Support any language the user writes in.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return res.status(response.status).json({ error: 'Groq API error', detail: err });
    }

    const data = await response.json();
    return res.status(200).json({ content: data.choices[0].message.content });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
