// API Configuration
const API_URL = 'http://localhost:3000/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// DOM Elements
const createQuizForm = document.getElementById('createQuizForm');
const questionsContainer = document.getElementById('questionsContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const submitQuizBtn = document.getElementById('submitQuizBtn');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');

// Question counter
let questionCount = 0;

// Add question button handler
addQuestionBtn.addEventListener('click', () => {
    addQuestion();
});

function addQuestion() {
    const template = document.getElementById('questionTemplate');
    const questionCard = template.content.cloneNode(true);

    questionCount++;

    // Update question number
    questionCard.querySelector('.q-num').textContent = questionCount;

    // Update radio button names to be unique for this question
    const radioButtons = questionCard.querySelectorAll('.correct-answer');
    radioButtons.forEach(radio => {
        radio.name = `correct-${questionCount}`;
    });

    // Add delete handler
    const deleteBtn = questionCard.querySelector('.delete-question');
    deleteBtn.addEventListener('click', function () {
        this.closest('.question-card').remove();
        updateQuestionNumbers();
    });

    questionsContainer.appendChild(questionCard);
}

function updateQuestionNumbers() {
    const questionCards = questionsContainer.querySelectorAll('.question-card');
    questionCount = questionCards.length;

    questionCards.forEach((card, index) => {
        card.querySelector('.q-num').textContent = index + 1;
    });
}

// Form submission
createQuizForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    formError.textContent = '';
    formSuccess.style.display = 'none';

    // Get quiz details
    const title = document.getElementById('quizTitle').value;
    const description = document.getElementById('quizDescription').value;
    const category = document.getElementById('quizCategory').value;
    const timeLimit = parseInt(document.getElementById('quizTimeLimit').value);

    // Validate
    if (!title || !category) {
        formError.textContent = 'Please fill in all required fields';
        return;
    }

    // Get questions
    const questionCards = questionsContainer.querySelectorAll('.question-card');

    if (questionCards.length === 0) {
        formError.textContent = 'Please add at least one question';
        return;
    }

    const questions = [];
    let hasError = false;

    questionCards.forEach((card, index) => {
        const questionText = card.querySelector('.question-text').value.trim();
        const optionTexts = Array.from(card.querySelectorAll('.option-text')).map(input => input.value.trim());
        const correctRadio = card.querySelector('.correct-answer:checked');

        if (!questionText) {
            formError.textContent = `Question ${index + 1}: Please enter question text`;
            hasError = true;
            return;
        }

        if (optionTexts.some(opt => !opt)) {
            formError.textContent = `Question ${index + 1}: Please fill in all options`;
            hasError = true;
            return;
        }

        if (!correctRadio) {
            formError.textContent = `Question ${index + 1}: Please select the correct answer`;
            hasError = true;
            return;
        }

        questions.push({
            question: questionText,
            options: optionTexts,
            correctAnswer: parseInt(correctRadio.value)
        });
    });

    if (hasError) {
        return;
    }

    // Submit quiz
    try {
        submitQuizBtn.classList.add('loading');
        submitQuizBtn.disabled = true;

        const response = await fetch(`${API_URL}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                category,
                timeLimit,
                questions
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create quiz');
        }

        // Show success message
        formSuccess.textContent = 'Quiz created successfully! Redirecting to dashboard...';
        formSuccess.style.display = 'block';

        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        formError.textContent = error.message;
        submitQuizBtn.classList.remove('loading');
        submitQuizBtn.disabled = false;
    }
});

// Add initial question
addQuestion();
