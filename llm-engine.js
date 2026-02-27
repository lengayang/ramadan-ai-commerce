const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateProduct(idea) {
  const prompt = `
Buatkan produk jualan Ramadan berdasarkan ide berikut:
"${idea}"

Balas dalam format JSON valid tanpa markdown:

{
  "name": "...",
  "description": "...",
  "price": 100000
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const text = response.choices[0].message.content;

  // Parse JSON dari AI
  return JSON.parse(text);
}

module.exports = generateProduct;
