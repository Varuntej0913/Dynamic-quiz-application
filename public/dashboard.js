// API Configuration
const API_URL = 'http://localhost:3000/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// DOM Elements
const userName = document.getElementById('userName');
const heroName = document.getElementById('heroName');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const quizzesGrid = document.getElementById('quizzesGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const categoryFilter = document.getElementById('categoryFilter');
const myResultsLink = document.getElementById('myResultsLink');
const resultsModal = document.getElementById('resultsModal');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const resultsList = document.getElementById('resultsList');

// API Quiz elements
const startApiQuizBtn = document.getElementById('startApiQuiz');
const apiCategory = document.getElementById('apiCategory');
const apiDifficulty = document.getElementById('apiDifficulty');
const apiAmount = document.getElementById('apiAmount');

// Stats elements
const totalQuizzesAttempted = document.getElementById('totalQuizzesAttempted');
const averageScore = document.getElementById('averageScore');
const bestScore = document.getElementById('bestScore');

// Set user info
if (user.name) {
    userName.textContent = user.name;
    heroName.textContent = user.name;
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
}

// Logout handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

// Fetch and display quizzes
let allQuizzes = [];

async function loadQuizzes() {
    try {
        const response = await fetch(`${API_URL}/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quizzes');
        }

        allQuizzes = await response.json();
        displayQuizzes(allQuizzes);

    } catch (error) {
        console.error('Error loading quizzes:', error);
        loadingState.innerHTML = `
            <div class="error-message" style="display: block;">
                Failed to load quizzes. Please try again.
            </div>
        `;
    }
}

function displayQuizzes(quizzes) {
    loadingState.style.display = 'none';

    if (quizzes.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    quizzesGrid.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card" onclick="startQuiz('${quiz._id}')">
            <span class="quiz-category">${quiz.category || 'General'}</span>
            <h3>${quiz.title}</h3>
            <p>${quiz.description || 'Test your knowledge with this quiz'}</p>
            <div class="quiz-meta">
                <div class="quiz-meta-item">
                    <span>📝</span>
                    <span>${quiz.questions?.length || 0} Questions</span>
                </div>
                <div class="quiz-meta-item">
                    <span>⏱️</span>
                    <span>${Math.floor(quiz.timeLimit / 60)} min</span>
                </div>
                <div class="quiz-meta-item">
                    <span>👥</span>
                    <span>${quiz.totalAttempts || 0} attempts</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="event.stopPropagation(); startQuiz('${quiz._id}')">
                Start Quiz
            </button>
        </div>
    `).join('');
}

function startQuiz(quizId) {
    window.location.href = `quiz.html?id=${quizId}`;
}

// Category filter
categoryFilter.addEventListener('change', (e) => {
    const category = e.target.value;

    if (category === 'all') {
        displayQuizzes(allQuizzes);
    } else {
        const filtered = allQuizzes.filter(quiz => quiz.category === category);
        displayQuizzes(filtered);
    }
});

// Load user results and stats
async function loadUserResults() {
    try {
        const response = await fetch(`${API_URL}/results`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }

        const results = await response.json();
        updateStats(results);

        return results;

    } catch (error) {
        console.error('Error loading results:', error);
        return [];
    }
}

function updateStats(results) {
    if (results.length === 0) {
        totalQuizzesAttempted.textContent = '0';
        averageScore.textContent = '0%';
        bestScore.textContent = '0%';
        return;
    }

    totalQuizzesAttempted.textContent = results.length;

    const avgScore = Math.round(
        results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    averageScore.textContent = `${avgScore}%`;

    const maxScore = Math.max(...results.map(r => r.score));
    bestScore.textContent = `${maxScore}%`;
}

// Show results modal
myResultsLink.addEventListener('click', async (e) => {
    e.preventDefault();
    resultsModal.classList.add('active');

    const results = await loadUserResults();
    displayResults(results);
});

function displayResults(results) {
    if (results.length === 0) {
        resultsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>No Results Yet</h3>
                <p>Start taking quizzes to see your results here</p>
            </div>
        `;
        return;
    }

    resultsList.innerHTML = results.map(result => `
        <div class="result-item">
            <h3>${result.quizTitle}</h3>
            <div class="result-item-meta">
                <span>Score: <strong>${result.score}%</strong></span>
                <span>Correct: ${result.correctAnswers}/${result.totalQuestions}</span>
                <span>Time: ${formatTime(result.timeTaken)}</span>
                <span>${new Date(result.completedAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Close modal
closeModal.addEventListener('click', () => {
    resultsModal.classList.remove('active');
});

modalOverlay.addEventListener('click', () => {
    resultsModal.classList.remove('active');
});

// API Quiz Handler
startApiQuizBtn.addEventListener('click', async () => {
    const category = apiCategory.value;
    const difficulty = apiDifficulty.value;
    const amount = apiAmount.value;

    startApiQuizBtn.classList.add('loading');
    startApiQuizBtn.disabled = true;

    try {
        // Build API URL
        let apiUrl = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;

        if (category !== 'any') {
            apiUrl += `&category=${category}`;
        }

        if (difficulty !== 'any') {
            apiUrl += `&difficulty=${difficulty}`;
        }

        // Fetch questions from Open Trivia DB
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.response_code !== 0) {
            throw new Error('Failed to fetch quiz questions. Try different settings.');
        }

        // Format questions for our quiz system
        const formattedQuiz = {
            title: `${getCategoryName(category)} Quiz`,
            description: `${amount} questions - ${difficulty === 'any' ? 'Mixed' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty`,
            category: getCategoryName(category),
            timeLimit: parseInt(amount) * 60, // 1 minute per question
            questions: data.results.map(q => {
                // Decode HTML entities
                const decodeHTML = (html) => {
                    const txt = document.createElement('textarea');
                    txt.innerHTML = html;
                    return txt.value;
                };

                // Decode correct answer FIRST
                const correctAnswerText = decodeHTML(q.correct_answer);

                // Create array with correct answer and incorrect answers
                const allOptions = [
                    correctAnswerText,
                    ...q.incorrect_answers.map(a => decodeHTML(a))
                ];

                // Fisher-Yates shuffle
                for (let i = allOptions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
                }

                return {
                    question: decodeHTML(q.question),
                    options: allOptions,
                    correctAnswer: allOptions.indexOf(correctAnswerText)
                };
            }),
            isApiQuiz: true
        };

        // Store quiz in sessionStorage
        sessionStorage.setItem('currentApiQuiz', JSON.stringify(formattedQuiz));

        // Redirect to quiz page
        window.location.href = 'quiz.html?source=api';

    } catch (error) {
        alert(error.message || 'Failed to load quiz. Please try again.');
        startApiQuizBtn.classList.remove('loading');
        startApiQuizBtn.disabled = false;
    }
});

function getCategoryName(categoryId) {
    const categories = {
        'any': 'General Knowledge',
        '9': 'General Knowledge',
        '10': 'Books',
        '11': 'Film',
        '12': 'Music',
        '14': 'Television',
        '15': 'Video Games',
        '17': 'Science & Nature',
        '18': 'Computers',
        '19': 'Mathematics',
        '20': 'Mythology',
        '21': 'Sports',
        '22': 'Geography',
        '23': 'History',
        '27': 'Animals'
    };
    return categories[categoryId] || 'General Knowledge';
}

// Initialize
loadQuizzes();
loadUserResults();
