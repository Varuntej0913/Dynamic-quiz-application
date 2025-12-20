const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'quizApp';

let db;
let usersCollection;
let quizzesCollection;
let resultsCollection;

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');
    quizzesCollection = db.collection('quizzes');
    resultsCollection = db.collection('results');

    // Create indexes
    usersCollection.createIndex({ email: 1 }, { unique: true });
  })
  .catch(error => console.error('MongoDB connection error:', error));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date()
    });

    // Generate token
    const token = jwt.sign(
      { userId: result.insertedId, email, name, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertedId, name, email, role: 'user' }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== QUIZ ROUTES ====================

// Get all quizzes
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const quizzes = await quizzesCollection
      .find({}, { projection: { questions: 0 } })
      .toArray();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single quiz with questions
app.get('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await quizzesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new quiz (admin/creator only)
app.post('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, timeLimit, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title and questions are required' });
    }

    const quiz = {
      title,
      description: description || '',
      category: category || 'General',
      timeLimit: timeLimit || 600,
      questions,
      createdBy: req.user.userId,
      createdByName: req.user.name,
      createdAt: new Date(),
      totalAttempts: 0
    };

    const result = await quizzesCollection.insertOne(quiz);
    res.status(201).json({
      message: 'Quiz created successfully',
      quizId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit quiz answers
app.post('/api/quizzes/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const quizId = req.params.id;

    // Get quiz with correct answers
    const quiz = await quizzesCollection.findOne({ _id: new ObjectId(quizId) });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // Save result
    const resultDoc = {
      userId: req.user.userId,
      userName: req.user.name,
      quizId: new ObjectId(quizId),
      quizTitle: quiz.title,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeTaken,
      results,
      completedAt: new Date()
    };

    await resultsCollection.insertOne(resultDoc);

    // Update quiz attempt count
    await quizzesCollection.updateOne(
      { _id: new ObjectId(quizId) },
      { $inc: { totalAttempts: 1 } }
    );

    res.json({
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      results
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save API quiz results
app.post('/api/results/save-api-quiz', authenticateToken, async (req, res) => {
  try {
    const { quizTitle, score, correctAnswers, totalQuestions, timeTaken, results } = req.body;

    if (!quizTitle || score === undefined) {
      return res.status(400).json({ error: 'Quiz title and score are required' });
    }

    // Save result to database
    const resultDoc = {
      userId: req.user.userId,
      userName: req.user.name,
      quizId: 'api-quiz',
      quizTitle,
      score,
      correctAnswers,
      totalQuestions,
      timeTaken,
      results,
      completedAt: new Date(),
      isApiQuiz: true
    };

    await resultsCollection.insertOne(resultDoc);

    res.json({
      message: 'API quiz result saved successfully',
      score
    });
  } catch (error) {
    console.error('Error saving API quiz result:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user results
app.get('/api/results', authenticateToken, async (req, res) => {
  try {
    const results = await resultsCollection
      .find({ userId: req.user.userId })
      .sort({ completedAt: -1 })
      .toArray();
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard for a quiz
app.get('/api/quizzes/:id/leaderboard', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await resultsCollection
      .find({ quizId: new ObjectId(req.params.id) })
      .sort({ score: -1, timeTaken: 1 })
      .limit(10)
      .toArray();
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
