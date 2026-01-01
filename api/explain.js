// Explain API - Vercel Serverless Function
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a math tutor explaining why an answer was wrong and how to solve the problem correctly.
Provide a clear, step-by-step explanation that's easy to follow.
Use markdown formatting for clarity.
Be encouraging - mistakes are learning opportunities!
Keep the explanation brief but complete - 3-5 short bullet points or steps.`;

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
        const { num1, num2, operation, correctAnswer, userAnswer, difficulty } = req.body;

        const prompt = `A student answered a math problem incorrectly. Help them understand:

**Problem:** ${num1} ${operation} ${num2} = ?
**Student's answer:** ${userAnswer}
**Correct answer:** ${correctAnswer}
**Difficulty level:** ${difficulty}

Explain the solution step-by-step in a friendly, encouraging way.`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }]
        });

        res.status(200).json({
            explanation: response.content[0].text
        });

    } catch (error) {
        console.error('Explain API error:', error);
        res.status(500).json({
            error: 'Failed to generate explanation',
            details: error.message
        });
    }
};
