// API Configuration
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const signupPassword = document.getElementById('signupPassword');
const passwordStrength = document.getElementById('passwordStrength');

// Switch between login and signup
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
    loginError.textContent = '';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
    signupError.textContent = '';
});

// Password strength indicator
signupPassword.addEventListener('input', (e) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);

    passwordStrength.style.setProperty('--strength', `${strength.percentage}%`);
    passwordStrength.style.setProperty('--strength-color', strength.color);
});

function calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 25;
    if (password.match(/[a-z]/)) score += 25;
    if (password.match(/[A-Z]/)) score += 25;
    if (password.match(/[0-9]/)) score += 25;

    let color = '#ef4444';
    if (score >= 75) color = '#10b981';
    else if (score >= 50) color = '#f59e0b';

    return { percentage: score, color };
}

// Login Handler
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    loginError.textContent = '';
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
});

// Signup Handler
signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    signupError.textContent = '';

    // Validate passwords match
    if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        return;
    }

    // Validate password strength
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters long';
        return;
    }

    signupBtn.classList.add('loading');
    signupBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        signupError.textContent = error.message;
    } finally {
        signupBtn.classList.remove('loading');
        signupBtn.disabled = false;
    }
});

// Check if user is already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}
