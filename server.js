// ===== Math Quiz Master - Backend Server with Claude API =====
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// System prompts for different contexts
const SYSTEM_PROMPTS = {
    tutor: `You are a friendly, encouraging math tutor for students of all ages. Your name is "Math Buddy".
Keep explanations clear and age-appropriate. Use emojis to make learning fun! 🎯
Always be positive and encouraging. If a student is struggling, break concepts down into smaller steps.
Use visual examples when helpful (describe diagrams or use ASCII art).
Keep responses concise but thorough - aim for 2-3 short paragraphs max.`,

    explain: `You are a math tutor explaining why an answer was wrong and how to solve the problem correctly.
Provide a clear, step-by-step explanation that's easy to follow.
Use markdown formatting for clarity.
Be encouraging - mistakes are learning opportunities!
Keep the explanation brief but complete - 3-5 short bullet points or steps.`,

    generate: `You are creating math practice problems for a quiz app.
Generate problems that are educational, clear, and appropriate for the requested difficulty.
For word problems, use relatable real-world scenarios (shopping, sports, cooking, etc.).
Always provide the correct answer.
Format your response as valid JSON.`
};

// ===== API Endpoints =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        hasApiKey: !!process.env.ANTHROPIC_API_KEY
    });
});

// AI Chat / Tutor endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Convert history to Claude format
        const messages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        messages.push({ role: 'user', content: message });

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPTS.tutor,
            messages: messages
        });

        const assistantMessage = response.content[0].text;

        res.json({
            message: assistantMessage,
            role: 'assistant'
        });

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
});

// AI Explanation endpoint (for wrong answers)
app.post('/api/explain', async (req, res) => {
    try {
        const { num1, num2, operation, correctAnswer, userAnswer, difficulty } = req.body;

        const prompt = `A student answered a math problem incorrectly. Help them understand:

**Problem:** ${num1} ${operation} ${num2} = ?
**Student's answer:** ${userAnswer}
**Correct answer:** ${correctAnswer}
**Difficulty level:** ${difficulty}

Explain the solution step-by-step in a friendly, encouraging way. Show them exactly how to solve it and why their answer was wrong.`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: SYSTEM_PROMPTS.explain,
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({
            explanation: response.content[0].text
        });

    } catch (error) {
        console.error('Explain API error:', error);
        res.status(500).json({
            error: 'Failed to generate explanation',
            details: error.message
        });
    }
});

// AI Problem Generator endpoint
app.post('/api/generate-problem', async (req, res) => {
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
      "hint": "Optional hint for the student"
    }
  ]
}

For word problems, set num1 and num2 to the key numbers in the story.
Operations can be: + - × ÷`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPTS.generate,
            messages: [{ role: 'user', content: prompt }]
        });

        // Parse the JSON response
        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const problems = JSON.parse(jsonMatch[0]);
            res.json(problems);
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
});

// AI Performance Insights endpoint
app.post('/api/insights', async (req, res) => {
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

In 2-3 sentences:
1. Celebrate what they did well
2. Give ONE specific tip for improvement
3. Encourage them to keep practicing

Use emojis and be very positive!`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 256,
            system: 'You are an encouraging math tutor giving quick feedback after a quiz. Be brief, positive, and specific.',
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({
            insight: response.content[0].text
        });

    } catch (error) {
        console.error('Insights API error:', error);
        res.status(500).json({
            error: 'Failed to generate insights',
            details: error.message
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║     🧮 Math Quiz Master - AI Enhanced Edition 🤖     ║
╠══════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}            ║
║  API Key loaded: ${process.env.ANTHROPIC_API_KEY ? '✅ Yes' : '❌ No - Check .env file'}                   ║
╚══════════════════════════════════════════════════════╝
    `);
});
