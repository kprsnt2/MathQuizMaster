// ===== Math Quiz Master - Main Application =====

// ===== AI API Service =====
const AIService = {
    baseUrl: window.location.origin,

    async chat(message, history = []) {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Chat failed');
            return data.message;
        } catch (error) {
            console.error('AI Chat error:', error);
            throw error;
        }
    },

    async getExplanation(question, userAnswer, difficulty) {
        try {
            const response = await fetch(`${this.baseUrl}/api/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    num1: question.num1,
                    num2: question.num2,
                    operation: question.operation,
                    correctAnswer: question.answer,
                    userAnswer,
                    difficulty
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Explanation failed');
            return data.explanation;
        } catch (error) {
            console.error('AI Explanation error:', error);
            return null; // Fall back to static explanation
        }
    },

    async getInsights(stats) {
        try {
            const response = await fetch(`${this.baseUrl}/api/insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Insights failed');
            return data.insight;
        } catch (error) {
            console.error('AI Insights error:', error);
            return null;
        }
    },

    async generateProblems(request, count = 3, difficulty = 'medium') {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate-problem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request, count, difficulty })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Generation failed');
            return data.problems;
        } catch (error) {
            console.error('AI Generate error:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            const data = await response.json();
            return data.status === 'ok' && data.hasApiKey;
        } catch {
            return false;
        }
    }
};

class MathQuizMaster {
    constructor() {
        // Game settings
        this.settings = {
            difficulty: 'easy',
            operations: ['+', '-', '×'],
            questionCount: 10,
            timeLimit: 15
        };

        // Game state
        this.state = {
            currentQuestion: 0,
            score: 0,
            streak: 0,
            bestStreak: 0,
            questions: [],
            answers: [],
            times: [],
            timer: null,
            timeLeft: 0,
            isAnswered: false
        };

        // Chat state
        this.chatState = {
            history: [],
            isOpen: false,
            isLoading: false
        };

        // AI features enabled
        this.aiEnabled = false;

        // DOM Elements
        this.screens = {
            start: document.getElementById('startScreen'),
            quiz: document.getElementById('quizScreen'),
            results: document.getElementById('resultsScreen')
        };

        // Initialize
        this.init();
    }

    async init() {
        this.createFloatingSymbols();
        this.setupEventListeners();
        this.addSVGGradient();
        this.setupChatPanel();

        // Check if AI is available
        this.aiEnabled = await AIService.checkHealth();
        if (!this.aiEnabled) {
            console.log('AI features not available - running in basic mode');
        }
    }

    // ===== Floating Background Symbols =====
    createFloatingSymbols() {
        const container = document.getElementById('floatingSymbols');
        const symbols = ['➕', '➖', '✖️', '➗', '=', '∑', 'π', '∞', '%', '√'];

        for (let i = 0; i < 20; i++) {
            const symbol = document.createElement('span');
            symbol.className = 'floating-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.left = `${Math.random() * 100}%`;
            symbol.style.top = `${Math.random() * 100}%`;
            symbol.style.animationDelay = `${Math.random() * 10}s`;
            symbol.style.animationDuration = `${15 + Math.random() * 15}s`;
            container.appendChild(symbol);
        }
    }

    // ===== SVG Gradient for Score Ring =====
    addSVGGradient() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('hidden-svg');
        svg.innerHTML = `
            <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#fbbf24"/>
                    <stop offset="50%" style="stop-color:#f472b6"/>
                    <stop offset="100%" style="stop-color:#6366f1"/>
                </linearGradient>
            </defs>
        `;
        document.body.appendChild(svg);
    }

    // ===== Event Listeners =====
    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('#difficultyGroup .option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e, 'difficulty'));
        });

        // Operations buttons
        document.querySelectorAll('#operationsGroup .op-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleOperation(e));
        });

        // Question count buttons
        document.querySelectorAll('#questionsGroup .option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e, 'questionCount'));
        });

        // Timer buttons
        document.querySelectorAll('#timerGroup .option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e, 'timeLimit'));
        });

        // Start button
        document.getElementById('startBtn').addEventListener('click', () => this.startQuiz());

        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => this.playAgain());

        // New settings button
        document.getElementById('newSettingsBtn').addEventListener('click', () => this.showScreen('start'));

        // Keyboard input submit
        document.getElementById('submitBtn')?.addEventListener('click', () => this.submitAnswer());
        document.getElementById('answerInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });
    }

    handleOptionClick(e, setting) {
        const group = e.target.parentElement;
        group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const value = e.target.dataset.value;
        if (setting === 'questionCount' || setting === 'timeLimit') {
            this.settings[setting] = parseInt(value);
        } else {
            this.settings[setting] = value;
        }
    }

    toggleOperation(e) {
        const btn = e.target;
        const op = btn.dataset.op;

        btn.classList.toggle('active');

        if (btn.classList.contains('active')) {
            if (!this.settings.operations.includes(op)) {
                this.settings.operations.push(op);
            }
        } else {
            // Ensure at least one operation is selected
            if (this.settings.operations.length > 1) {
                this.settings.operations = this.settings.operations.filter(o => o !== op);
            } else {
                btn.classList.add('active');
            }
        }
    }

    // ===== Screen Navigation =====
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }

    // ===== Quiz Logic =====
    startQuiz() {
        // Reset state
        this.state = {
            currentQuestion: 0,
            score: 0,
            streak: 0,
            bestStreak: 0,
            questions: [],
            answers: [],
            times: [],
            timer: null,
            timeLeft: this.settings.timeLimit,
            isAnswered: false,
            questionStartTime: null
        };

        // Generate questions
        this.generateQuestions();

        // Show quiz screen
        this.showScreen('quiz');

        // Display first question
        this.displayQuestion();
    }

    generateQuestions() {
        for (let i = 0; i < this.settings.questionCount; i++) {
            const question = this.generateQuestion();
            this.state.questions.push(question);
        }
    }

    generateQuestion() {
        const operation = this.settings.operations[
            Math.floor(Math.random() * this.settings.operations.length)
        ];

        let num1, num2, answer;
        const range = this.getDifficultyRange();

        switch (operation) {
            case '+':
                num1 = this.randomInt(range.min, range.max);
                num2 = this.randomInt(range.min, range.max);
                answer = num1 + num2;
                break;

            case '-':
                num1 = this.randomInt(range.min, range.max);
                num2 = this.randomInt(range.min, Math.min(num1, range.max));
                answer = num1 - num2;
                break;

            case '×':
                num1 = this.randomInt(1, range.mult);
                num2 = this.randomInt(1, range.mult);
                answer = num1 * num2;
                break;

            case '÷':
                num2 = this.randomInt(1, range.mult);
                answer = this.randomInt(1, range.mult);
                num1 = num2 * answer;
                break;
        }

        return { num1, num2, operation, answer };
    }

    getDifficultyRange() {
        switch (this.settings.difficulty) {
            case 'easy':
                return { min: 1, max: 10, mult: 5 };
            case 'medium':
                return { min: 5, max: 50, mult: 10 };
            case 'hard':
                return { min: 10, max: 100, mult: 12 };
            default:
                return { min: 1, max: 10, mult: 5 };
        }
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    displayQuestion() {
        const question = this.state.questions[this.state.currentQuestion];
        this.state.isAnswered = false;
        this.state.questionStartTime = Date.now();

        // Update UI
        document.getElementById('questionCounter').textContent =
            `Question ${this.state.currentQuestion + 1}/${this.settings.questionCount}`;
        document.getElementById('progressFill').style.width =
            `${((this.state.currentQuestion) / this.settings.questionCount) * 100}%`;
        document.getElementById('scoreDisplay').textContent = this.state.score;
        document.getElementById('streakDisplay').textContent = this.state.streak;

        // Display numbers and operation
        document.getElementById('num1').textContent = question.num1;
        document.getElementById('operator').textContent = question.operation;
        document.getElementById('num2').textContent = question.num2;

        // Generate answer options
        this.generateAnswerOptions(question.answer);

        // Start timer
        if (this.settings.timeLimit > 0) {
            this.startTimer();
        } else {
            document.getElementById('timerBox').style.display = 'none';
        }

        // Animate question card
        const card = document.getElementById('questionCard');
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = 'fadeIn 0.5s ease';

        // Show hint button if AI is enabled
        this.updateQuickHelpVisibility(true);
    }

    generateAnswerOptions(correctAnswer) {
        const options = [correctAnswer];
        const range = Math.max(10, Math.abs(correctAnswer));

        // Generate wrong answers
        while (options.length < 4) {
            let wrongAnswer;
            const variance = Math.floor(Math.random() * range * 0.5) + 1;

            if (Math.random() < 0.5) {
                wrongAnswer = correctAnswer + variance;
            } else {
                wrongAnswer = correctAnswer - variance;
            }

            // Ensure no duplicates and positive for easy difficulty
            if (!options.includes(wrongAnswer) &&
                (this.settings.difficulty !== 'easy' || wrongAnswer >= 0)) {
                options.push(wrongAnswer);
            }
        }

        // Shuffle options
        this.shuffle(options);

        // Create buttons
        const container = document.getElementById('answerOptions');
        container.innerHTML = '';

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.checkAnswer(option, btn));
            container.appendChild(btn);
        });
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    startTimer() {
        this.state.timeLeft = this.settings.timeLimit;
        const timerDisplay = document.getElementById('timerDisplay');
        const timerBox = document.getElementById('timerBox');

        timerBox.style.display = 'flex';
        timerDisplay.textContent = this.state.timeLeft;
        timerBox.classList.remove('warning');

        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            timerDisplay.textContent = this.state.timeLeft;

            if (this.state.timeLeft <= 5) {
                timerBox.classList.add('warning');
            }

            if (this.state.timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
    }

    timeUp() {
        if (this.state.isAnswered) return;

        this.stopTimer();
        this.state.isAnswered = true;

        // Record time
        const timeTaken = this.settings.timeLimit;
        this.state.times.push(timeTaken);
        this.state.answers.push(null);

        // Reset streak
        this.state.streak = 0;

        // Show feedback
        this.showFeedback(false, "Time's Up!");

        // Highlight correct answer
        const correctAnswer = this.state.questions[this.state.currentQuestion].answer;
        document.querySelectorAll('.answer-btn').forEach(btn => {
            if (parseInt(btn.textContent) === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        // Next question
        setTimeout(() => this.nextQuestion(), 1500);
    }

    checkAnswer(selectedAnswer, button) {
        if (this.state.isAnswered) return;

        this.stopTimer();
        this.state.isAnswered = true;

        const question = this.state.questions[this.state.currentQuestion];
        const isCorrect = selectedAnswer === question.answer;

        // Record time
        const timeTaken = (Date.now() - this.state.questionStartTime) / 1000;
        this.state.times.push(timeTaken);
        this.state.answers.push(selectedAnswer);

        // Update score and streak
        if (isCorrect) {
            this.state.score++;
            this.state.streak++;
            this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
            button.classList.add('correct');
            this.showFeedback(true);
            this.playSound('correct');
        } else {
            this.state.streak = 0;
            button.classList.add('wrong');

            // Generate explanation for wrong answer
            const explanation = this.generateExplanation(question);
            this.showFeedback(false, null, explanation);
            this.playSound('wrong');

            // Highlight correct answer
            document.querySelectorAll('.answer-btn').forEach(btn => {
                if (parseInt(btn.textContent) === question.answer) {
                    setTimeout(() => btn.classList.add('correct'), 300);
                }
            });
        }

        // Update displays
        document.getElementById('scoreDisplay').textContent = this.state.score;
        document.getElementById('streakDisplay').textContent = this.state.streak;

        // Next question (longer delay when wrong to read explanation)
        const delay = isCorrect ? 1200 : 3500;
        setTimeout(() => this.nextQuestion(), delay);
    }

    showFeedback(isCorrect, customText = null, explanation = null) {
        const overlay = document.getElementById('feedbackOverlay');
        const icon = document.getElementById('feedbackIcon');
        const text = document.getElementById('feedbackText');
        const explanationEl = document.getElementById('feedbackExplanation');

        overlay.classList.remove('correct', 'wrong');
        overlay.classList.add(isCorrect ? 'correct' : 'wrong', 'show');

        if (isCorrect) {
            const responses = ['Correct! 🎉', 'Amazing! ⭐', 'Perfect! 💯', 'Great! 👏', 'Awesome! 🌟'];
            icon.textContent = '✓';
            text.textContent = responses[Math.floor(Math.random() * responses.length)];
            if (explanationEl) explanationEl.style.display = 'none';
        } else {
            icon.textContent = '✗';
            text.textContent = customText || 'Oops! Here\'s how to solve it:';

            // Show explanation if provided
            if (explanationEl && explanation) {
                explanationEl.innerHTML = explanation;
                explanationEl.style.display = 'block';
            } else if (explanationEl) {
                explanationEl.style.display = 'none';
            }
        }

        // Longer display time for wrong answers with explanations
        const displayTime = isCorrect ? 800 : 3000;
        setTimeout(() => {
            overlay.classList.remove('show');
        }, displayTime);
    }

    generateExplanation(question) {
        const { num1, num2, operation, answer } = question;
        let explanation = '';

        switch (operation) {
            case '+':
                explanation = `
                    <div class="explanation-step">
                        <span class="step-label">Addition:</span>
                        <span class="step-calc">${num1} + ${num2} = ${answer}</span>
                    </div>
                    <div class="explanation-tip">💡 Tip: Count up ${num2} from ${num1}</div>
                `;
                break;

            case '-':
                explanation = `
                    <div class="explanation-step">
                        <span class="step-label">Subtraction:</span>
                        <span class="step-calc">${num1} - ${num2} = ${answer}</span>
                    </div>
                    <div class="explanation-tip">💡 Tip: Take away ${num2} from ${num1}</div>
                `;
                break;

            case '×':
                // Show multiplication as repeated addition for smaller numbers
                if (num2 <= 5) {
                    const repeated = Array(num2).fill(num1).join(' + ');
                    explanation = `
                        <div class="explanation-step">
                            <span class="step-label">Multiplication:</span>
                            <span class="step-calc">${num1} × ${num2} = ${answer}</span>
                        </div>
                        <div class="explanation-tip">💡 Same as: ${repeated} = ${answer}</div>
                    `;
                } else {
                    explanation = `
                        <div class="explanation-step">
                            <span class="step-label">Multiplication:</span>
                            <span class="step-calc">${num1} × ${num2} = ${answer}</span>
                        </div>
                        <div class="explanation-tip">💡 Tip: ${num1} groups of ${num2} = ${answer}</div>
                    `;
                }
                break;

            case '÷':
                explanation = `
                    <div class="explanation-step">
                        <span class="step-label">Division:</span>
                        <span class="step-calc">${num1} ÷ ${num2} = ${answer}</span>
                    </div>
                    <div class="explanation-tip">💡 Check: ${num2} × ${answer} = ${num1}</div>
                `;
                break;
        }

        return explanation;
    }

    playSound(type) {
        // Create oscillator for sound effects
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (type === 'correct') {
                oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            } else {
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
            }

            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            // Audio not supported
        }
    }

    nextQuestion() {
        this.state.currentQuestion++;

        if (this.state.currentQuestion >= this.settings.questionCount) {
            this.showResults();
        } else {
            this.displayQuestion();
        }
    }

    showResults() {
        this.showScreen('results');

        const percentage = (this.state.score / this.settings.questionCount) * 100;

        // Set trophy and message based on score
        let trophy, title, subtitle;
        if (percentage >= 90) {
            trophy = '🏆';
            title = 'Outstanding!';
            subtitle = "You're a Math Genius! 🌟";
        } else if (percentage >= 70) {
            trophy = '🥇';
            title = 'Excellent Work!';
            subtitle = "You're a Math Superstar! ⭐";
        } else if (percentage >= 50) {
            trophy = '🥈';
            title = 'Good Job!';
            subtitle = 'Keep practicing! 💪';
        } else {
            trophy = '🎯';
            title = 'Nice Try!';
            subtitle = 'Practice makes perfect! 📚';
        }

        document.getElementById('trophyIcon').textContent = trophy;
        document.getElementById('resultsTitle').textContent = title;
        document.getElementById('resultsSubtitle').textContent = subtitle;

        // Score display
        document.getElementById('finalScore').textContent = this.state.score;
        document.getElementById('totalQuestions').textContent = this.settings.questionCount;

        // Stats
        const correctCount = this.state.score;
        const wrongCount = this.settings.questionCount - this.state.score;
        const avgTime = this.state.times.length > 0
            ? (this.state.times.reduce((a, b) => a + b, 0) / this.state.times.length).toFixed(1) + 's'
            : 'N/A';

        document.getElementById('correctCount').textContent = correctCount;
        document.getElementById('wrongCount').textContent = wrongCount;
        document.getElementById('avgTime').textContent = avgTime;
        document.getElementById('bestStreak').textContent = this.state.bestStreak;

        // Animate score ring
        setTimeout(() => {
            const ring = document.getElementById('scoreRing');
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (percentage / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }, 100);

        // Confetti for good scores
        if (percentage >= 50) {
            this.createConfetti();
        }

        // Hide hint button on results screen
        this.updateQuickHelpVisibility(false);

        // Load AI insights
        this.loadAIInsights();
    }

    createConfetti() {
        const container = document.getElementById('confettiContainer');
        container.innerHTML = '';

        const colors = ['#fbbf24', '#f472b6', '#6366f1', '#10b981', '#ef4444', '#8b5cf6'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;

            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }

            container.appendChild(confetti);
        }

        // Clear confetti after animation
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    playAgain() {
        this.startQuiz();
    }

    // ===== AI Chat Panel =====
    setupChatPanel() {
        const chatToggle = document.getElementById('chatToggle');
        const chatClose = document.getElementById('chatClose');
        const chatPanel = document.getElementById('chatPanel');
        const chatSend = document.getElementById('chatSend');
        const chatInput = document.getElementById('chatInput');
        const quickHelpBtn = document.getElementById('quickHelpBtn');

        if (chatToggle) {
            chatToggle.addEventListener('click', () => this.toggleChat());
        }

        if (chatClose) {
            chatClose.addEventListener('click', () => this.toggleChat(false));
        }

        if (chatSend) {
            chatSend.addEventListener('click', () => this.sendChatMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }

        if (quickHelpBtn) {
            quickHelpBtn.addEventListener('click', () => this.requestHint());
        }
    }

    toggleChat(forceState = null) {
        const chatPanel = document.getElementById('chatPanel');
        if (!chatPanel) return;

        if (forceState !== null) {
            this.chatState.isOpen = forceState;
        } else {
            this.chatState.isOpen = !this.chatState.isOpen;
        }

        if (this.chatState.isOpen) {
            chatPanel.classList.add('open');
            document.getElementById('chatInput')?.focus();
        } else {
            chatPanel.classList.remove('open');
        }
    }

    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value.trim();

        if (!message || this.chatState.isLoading) return;

        // Add user message to UI
        this.addChatMessage('user', message);
        chatInput.value = '';

        // Add to history
        this.chatState.history.push({ role: 'user', content: message });

        // Show loading
        this.chatState.isLoading = true;
        const loadingId = this.addChatLoading();

        try {
            const response = await AIService.chat(message, this.chatState.history);

            // Remove loading
            this.removeChatLoading(loadingId);

            // Add assistant message
            this.addChatMessage('assistant', response);
            this.chatState.history.push({ role: 'assistant', content: response });

        } catch (error) {
            this.removeChatLoading(loadingId);
            this.addChatMessage('assistant', "Sorry, I couldn't connect right now. Please check if the server is running! 🔌");
        }

        this.chatState.isLoading = false;
    }

    addChatMessage(role, content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        messageDiv.innerHTML = `<div class="message-bubble">${this.escapeHtml(content)}</div>`;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addChatLoading() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message assistant';
        loadingDiv.id = 'chat-loading-' + Date.now();
        loadingDiv.innerHTML = `
            <div class="message-bubble">
                <div class="ai-loading">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;

        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv.id;
    }

    removeChatLoading(loadingId) {
        if (loadingId) {
            document.getElementById(loadingId)?.remove();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async requestHint() {
        if (!this.aiEnabled || this.state.isAnswered) return;

        const question = this.state.questions[this.state.currentQuestion];
        if (!question) return;

        // Open chat and ask for a hint
        this.toggleChat(true);

        const hintRequest = `Give me a hint for solving: ${question.num1} ${question.operation} ${question.num2} = ? (Don't give me the answer directly!)`;

        // Simulate typing the hint request
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = hintRequest;
            this.sendChatMessage();
        }
    }

    // ===== AI-Enhanced Results =====
    async loadAIInsights() {
        if (!this.aiEnabled) {
            const insightsCard = document.getElementById('aiInsightsCard');
            if (insightsCard) insightsCard.style.display = 'none';
            return;
        }

        const insightsCard = document.getElementById('aiInsightsCard');
        const insightsContent = document.getElementById('aiInsightsContent');

        if (!insightsCard || !insightsContent) return;

        insightsCard.style.display = 'block';
        insightsContent.innerHTML = `
            <div class="ai-loading">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;

        try {
            const avgTimeNum = this.state.times.length > 0
                ? (this.state.times.reduce((a, b) => a + b, 0) / this.state.times.length).toFixed(1)
                : 0;

            const insight = await AIService.getInsights({
                score: this.state.score,
                total: this.settings.questionCount,
                correctCount: this.state.score,
                wrongCount: this.settings.questionCount - this.state.score,
                avgTime: avgTimeNum,
                bestStreak: this.state.bestStreak,
                difficulty: this.settings.difficulty,
                operations: this.settings.operations
            });

            if (insight) {
                insightsContent.textContent = insight;
            } else {
                insightsCard.style.display = 'none';
            }
        } catch (error) {
            insightsCard.style.display = 'none';
        }
    }

    // Show/hide quick help button based on screen
    updateQuickHelpVisibility(show) {
        const quickHelpBtn = document.getElementById('quickHelpBtn');
        if (quickHelpBtn) {
            quickHelpBtn.style.display = show && this.aiEnabled ? 'flex' : 'none';
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new MathQuizMaster();
});
