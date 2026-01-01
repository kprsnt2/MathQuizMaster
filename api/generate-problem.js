// Generate Problem API - Vercel Serverless Function
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are creating math practice problems for a quiz app.
Generate problems that are educational, clear, and appropriate for the requested difficulty.
For word problems, use relatable real-world scenarios.
Always provide the correct answer.
Format your response as valid JSON.`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { request, count = 3, difficulty = 'medium' } = req.body;

        const prompt = `Generate ${count} math problem(s) based on this request: "${request}"
Difficulty: ${difficulty}

Return ONLY valid JSON in this exact format:
{
  "problems": [
    {
      "question": "Story or equation here",
      "num1": 12,
      "num2": 5,
      "operation": "+",
      "answer": 17,
      "hint": "Optional hint"
    }
  ]
}`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const problems = JSON.parse(jsonMatch[0]);
            res.status(200).json(problems);
        } else {
            throw new Error('Invalid JSON response from AI');
        }

    } catch (error) {
        console.error('Generate API error:', error);
        res.status(500).json({
            error: 'Failed to generate problems',
            details: error.message
        });
    }
};
