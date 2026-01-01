// Chat API - Vercel Serverless Function
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a friendly, encouraging math tutor for students of all ages. Your name is "Math Buddy".
Keep explanations clear and age-appropriate. Use emojis to make learning fun! 🎯
Always be positive and encouraging. If a student is struggling, break concepts down into smaller steps.
Use visual examples when helpful (describe diagrams or use ASCII art).
Keep responses concise but thorough - aim for 2-3 short paragraphs max.`;

module.exports = async (req, res) => {
    // Enable CORS
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
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const messages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        messages.push({ role: 'user', content: message });

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: messages
        });

        res.status(200).json({
            message: response.content[0].text,
            role: 'assistant'
        });

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
};
