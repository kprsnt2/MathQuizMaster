// Insights API - Vercel Serverless Function
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

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
        const { score, total, correctCount, wrongCount, avgTime, bestStreak, difficulty, operations } = req.body;
        const percentage = Math.round((score / total) * 100);

        const prompt = `A student just completed a math quiz. Provide brief, encouraging feedback:

**Results:**
- Score: ${score}/${total} (${percentage}%)
- Correct: ${correctCount}, Wrong: ${wrongCount}
- Average time: ${avgTime} seconds
- Best streak: ${bestStreak} in a row
- Difficulty: ${difficulty}
- Operations practiced: ${operations.join(', ')}

In 2-3 sentences: celebrate what they did well, give ONE specific tip, and encourage them. Use emojis!`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 256,
            system: 'You are an encouraging math tutor giving quick feedback. Be brief, positive, and specific.',
            messages: [{ role: 'user', content: prompt }]
        });

        res.status(200).json({
            insight: response.content[0].text
        });

    } catch (error) {
        console.error('Insights API error:', error);
        res.status(500).json({
            error: 'Failed to generate insights',
            details: error.message
        });
    }
};
