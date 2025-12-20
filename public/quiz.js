// API Configuration
const API_URL = 'http://localhost:3000/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// Get quiz ID from URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');
const isApiQuiz = urlParams.get('source') === 'api';

// Redirect to dashboard only if not an API quiz and no quiz ID
if (!quizId && !isApiQuiz) {
    window.location.href = 'dashboard.html';
}

// DOM Elements
const quizTitle = document.getElementById('quizTitle');
const quizDescription = document.getElementById('quizDescription');
const timerDisplay = document.getElementById('timerDisplay');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const progressFill = document.getElementById('progressFill');
const quizContent = document.getElementById('quizContent');
const quizNavigation = document.getElementById('quizNavigation');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const resultsModal = document.getElementById('resultsModal');

// Quiz state
let quiz = null;
let currentQuestionIndex = 0;
let answers = [];
let startTime = Date.now();
let timerInterval = null;
let timeRemaining = 0;

// Load quiz
async function loadQuiz() {
    try {
        // Check if this is an API quiz
        const isApiQuiz = urlParams.get('source') === 'api';

        if (isApiQuiz) {
            // Load quiz from sessionStorage
            const storedQuiz = sessionStorage.getItem('currentApiQuiz');
            if (!storedQuiz) {
                throw new Error('Quiz data not found. Please generate a quiz from the dashboard.');
            }

            quiz = JSON.parse(storedQuiz);
            quiz._id = 'api-quiz'; // Temporary ID for API quizzes
            initializeQuiz();
        } else {
            // Load custom quiz from database
            const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load quiz');
            }

            quiz = await response.json();
            initializeQuiz();
        }

    } catch (error) {
        console.error('Error loading quiz:', error);
        quizContent.innerHTML = `
            <div class="error-message" style="display: block;">
                ${error.message || 'Failed to load quiz. Please try again.'}
            </div>
        `;
    }
}

function initializeQuiz() {
    quizTitle.textContent = quiz.title;
    quizDescription.textContent = quiz.description || '';
    totalQuestionsEl.textContent = quiz.questions.length;

    // Initialize answers array
    answers = new Array(quiz.questions.length).fill(null);

    // Start timer
    timeRemaining = quiz.timeLimit;
    startTimer();

    // Display first question
    displayQuestion();
    quizNavigation.style.display = 'flex';
}

function startTimer() {
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Change color when time is running out
    if (timeRemaining <= 60) {
        timerDisplay.style.color = '#ef4444';
    } else if (timeRemaining <= 300) {
        timerDisplay.style.color = '#f59e0b';
    }
}

function displayQuestion() {
    const question = quiz.questions[currentQuestionIndex];

    currentQuestionEl.textContent = currentQuestionIndex + 1;

    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    progressFill.style.width = `${progress}%`;

    // Display question and options
    quizContent.innerHTML = `
        <div class="question-container">
            <h2 class="question-text">${currentQuestionIndex + 1}. ${question.question}</h2>
            <div class="options-list">
                ${question.options.map((option, index) => `
                    <button 
                        class="option-button ${answers[currentQuestionIndex] === index ? 'selected' : ''}" 
                        onclick="selectAnswer(${index})"
                        data-index="${index}"
                    >
                        ${String.fromCharCode(65 + index)}. ${option}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Update navigation buttons
    prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === quiz.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function selectAnswer(optionIndex) {
    answers[currentQuestionIndex] = optionIndex;

    // Update UI
    const options = document.querySelectorAll('.option-button');
    options.forEach((btn, idx) => {
        if (idx === optionIndex) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Navigation
prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
});

submitBtn.addEventListener('click', () => {
    const unanswered = answers.filter(a => a === null).length;

    if (unanswered > 0) {
        if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
            return;
        }
    }

    submitQuiz();
});

async function submitQuiz() {
    clearInterval(timerInterval);

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Check if this is an API quiz
        if (quiz.isApiQuiz) {
            // Calculate results locally for API quizzes
            let correctCount = 0;
            const results = quiz.questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                if (isCorrect) correctCount++;

                return {
                    question: question.question,
                    userAnswer: userAnswer !== null ? question.options[userAnswer] : 'No answer',
                    correctAnswer: question.options[question.correctAnswer],
                    isCorrect
                };
            });

            const score = Math.round((correctCount / quiz.questions.length) * 100);

            const result = {
                score,
                correctAnswers: correctCount,
                totalQuestions: quiz.questions.length,
                results
            };

            // Save API quiz results to database
            try {
                await fetch(`${API_URL}/results/save-api-quiz`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quizTitle: quiz.title,
                        score,
                        correctAnswers: correctCount,
                        totalQuestions: quiz.questions.length,
                        timeTaken,
                        results
                    })
                });
            } catch (saveError) {
                console.error('Failed to save API quiz result:', saveError);
                // Continue to show results even if save fails
            }

            displayResults(result, timeTaken);
        } else {
            // Submit custom quiz to database
            const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers, timeTaken })
            });

            if (!response.ok) {
                throw new Error('Failed to submit quiz');
            }

            const result = await response.json();
            displayResults(result, timeTaken);
        }

    } catch (error) {
        console.error('Error submitting quiz:', error);
        alert('Failed to submit quiz. Please try again.');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function autoSubmitQuiz() {
    alert('Time is up! Submitting your quiz...');
    submitQuiz();
}

function displayResults(result, timeTaken) {
    const scorePercentage = result.score;
    const correctCount = result.correctAnswers;
    const totalQuestions = result.totalQuestions;
    const incorrectCount = totalQuestions - correctCount;

    // Show modal
    resultsModal.style.display = 'flex';

    // Set results icon based on score
    const resultsIcon = document.getElementById('resultsIcon');
    const resultsTitle = document.getElementById('resultsTitle');

    if (scorePercentage >= 80) {
        resultsIcon.textContent = '🎉';
        resultsTitle.textContent = 'Excellent Work!';
    } else if (scorePercentage >= 60) {
        resultsIcon.textContent = '👏';
        resultsTitle.textContent = 'Good Job!';
    } else {
        resultsIcon.textContent = '💪';
        resultsTitle.textContent = 'Keep Practicing!';
    }

    // Update score
    document.getElementById('scorePercentage').textContent = `${scorePercentage}%`;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('incorrectCount').textContent = incorrectCount;
    document.getElementById('timeTaken').textContent = formatTime(timeTaken);

    // Animate score circle
    setTimeout(() => {
        const circle = document.getElementById('scoreCircle');
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (scorePercentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }, 300);

    // Store results for review
    window.quizResults = result;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Review answers
document.getElementById('reviewAnswers').addEventListener('click', () => {
    resultsModal.style.display = 'none';
    reviewMode = true;
    currentQuestionIndex = 0;
    displayReviewQuestion();
});

let reviewMode = false;

function displayReviewQuestion() {
    const question = quiz.questions[currentQuestionIndex];
    const userAnswer = answers[currentQuestionIndex];
    const correctAnswer = question.correctAnswer;
    const result = window.quizResults.results[currentQuestionIndex];

    quizContent.innerHTML = `
        <div class="question-container">
            <h2 class="question-text">${currentQuestionIndex + 1}. ${question.question}</h2>
            <div class="options-list">
                ${question.options.map((option, index) => {
        let className = 'option-button';
        let marker = '';

        // Always highlight correct answer
        if (index === correctAnswer) {
            className += ' correct';
            marker = ' ✓';
        }

        // Mark user's wrong answer (only if they answered)
        if (userAnswer !== null && index === userAnswer && index !== correctAnswer) {
            className += ' incorrect';
            marker = ' ✗';
        }

        return `
                        <button class="${className}" disabled>
                            ${String.fromCharCode(65 + index)}. ${option}${marker}
                        </button>
                    `;
    }).join('')}
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                ${userAnswer === null
            ? '<p style="color: #f59e0b;">⚠️ You did not attempt this question.</p>'
            : result.isCorrect
                ? '<p style="color: #10b981;">✓ Your answer is correct!</p>'
                : `<p style="color: #ef4444;">✗ Your answer is incorrect. The correct answer is highlighted in green above.</p>`
        }
            </div>
        </div>
    `;

    submitBtn.style.display = 'none';
}

// Exit Quiz Handler
const exitQuizBtn = document.getElementById('exitQuizBtn');
if (exitQuizBtn) {
    exitQuizBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to exit this quiz? Your progress will be lost.')) {
            clearInterval(timerInterval);
            window.location.href = 'dashboard.html';
        }
    });
}

// Initialize
loadQuiz();
