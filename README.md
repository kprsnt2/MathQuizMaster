# 🧮 Math Quiz Master - AI Enhanced Edition

An interactive math quiz app powered by **Claude AI** for personalized tutoring and intelligent feedback.

![Math Quiz Master](https://img.shields.io/badge/AI%20Powered-Claude-blueviolet)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## ✨ Features

- **🎯 Customizable Quizzes** - Choose difficulty, operations, time limits
- **🤖 AI Tutor Chat** - Ask Claude any math question anytime
- **💡 Smart Hints** - Get hints during quizzes without spoiling answers
- **📊 AI Insights** - Personalized feedback after each quiz
- **🏆 Streak Tracking** - Stay motivated with score streaks
- **🎨 Beautiful UI** - Modern, responsive glassmorphism design

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/MathQuizMaster)

### Environment Variables

Add these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key from [console.anthropic.com](https://console.anthropic.com/) |

## 🛠️ Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/MathQuizMaster.git
   cd MathQuizMaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

4. **Run locally**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
MathQuizMaster/
├── api/                 # Vercel serverless functions
│   ├── chat.js         # AI chat endpoint
│   ├── explain.js      # Wrong answer explanations
│   ├── insights.js     # Quiz performance insights
│   ├── health.js       # API health check
│   └── generate-problem.js
├── index.html          # Main app
├── app.js              # Quiz logic + AI integration
├── style.css           # Styling
├── server.js           # Local development server
├── vercel.json         # Vercel configuration
└── package.json
```

## 🎮 How to Use

1. **Start Screen** - Select difficulty, operations, and quiz length
2. **Quiz Mode** - Answer questions, use 💡 Hint for help
3. **AI Chat** - Click 🤖 AI Help for tutoring anytime
4. **Results** - Get AI-powered feedback on your performance

## 📝 License

MIT - Feel free to use and modify!

---

Built with ❤️ using Claude AI
