require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory storage for testing
const users = {};
const interviews = {};
const generatedQuestions = {};
const resumeData = {};

// Setup multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and DOCX files are allowed'));
    }
  }
});

// Comprehensive sample questions database
const sampleQuestionsDB = {
  Frontend: [
    { _id: '1', type: 'Frontend', question: 'Explain the difference between useEffect and useLayoutEffect hooks in React', difficulty: 'Hard', category: 'React Hooks' },
    { _id: '2', type: 'Frontend', question: 'What is the Virtual DOM and how does React use it for performance optimization?', difficulty: 'Medium', category: 'React Concepts' },
    { _id: '3', type: 'Frontend', question: 'How would you optimize a React component that renders a large list?', difficulty: 'Hard', category: 'Performance' },
    { _id: '4', type: 'Frontend', question: 'Explain event delegation in JavaScript and its benefits', difficulty: 'Medium', category: 'JavaScript' },
    { _id: '5', type: 'Frontend', question: 'What are controlled and uncontrolled components in React?', difficulty: 'Medium', category: 'React Forms' },
    { _id: '6', type: 'Frontend', question: 'How does CSS Grid differ from Flexbox?', difficulty: 'Medium', category: 'CSS' },
    { _id: '7', type: 'Frontend', question: 'Explain closure in JavaScript with an example', difficulty: 'Hard', category: 'JavaScript' },
    { _id: '8', type: 'Frontend', question: 'What is the purpose of the key prop in React lists?', difficulty: 'Easy', category: 'React Basics' },
    { _id: '9', type: 'Frontend', question: 'How does async/await work in JavaScript?', difficulty: 'Medium', category: 'JavaScript' },
    { _id: '10', type: 'Frontend', question: 'Explain the concept of memoization in React', difficulty: 'Hard', category: 'Performance' }
  ],
  Backend: [
    { _id: '1', type: 'Backend', question: 'What is REST API and explain its principles', difficulty: 'Easy', category: 'API Design' },
    { _id: '2', type: 'Backend', question: 'Explain database indexing and when to use it', difficulty: 'Hard', category: 'Database' },
    { _id: '3', type: 'Backend', question: 'What is middleware and how does it work in Express?', difficulty: 'Medium', category: 'Express' },
    { _id: '4', type: 'Backend', question: 'Explain the difference between authentication and authorization', difficulty: 'Medium', category: 'Security' },
    { _id: '5', type: 'Backend', question: 'What is caching and how does it improve performance?', difficulty: 'Hard', category: 'Performance' },
    { _id: '6', type: 'Backend', question: 'How do you handle errors in Node.js applications?', difficulty: 'Medium', category: 'Error Handling' },
    { _id: '7', type: 'Backend', question: 'Explain the concept of microservices architecture', difficulty: 'Hard', category: 'Architecture' },
    { _id: '8', type: 'Backend', question: 'What is a transaction in databases?', difficulty: 'Medium', category: 'Database' },
    { _id: '9', type: 'Backend', question: 'How do you secure an API?', difficulty: 'Hard', category: 'Security' },
    { _id: '10', type: 'Backend', question: 'Explain the concept of load balancing', difficulty: 'Hard', category: 'Scalability' }
  ],
  HR: [
    { _id: '1', type: 'HR', question: 'Tell me about yourself and your professional background', difficulty: 'Easy', category: 'Introduction' },
    { _id: '2', type: 'HR', question: 'Why are you interested in this position?', difficulty: 'Medium', category: 'Motivation' },
    { _id: '3', type: 'HR', question: 'What are your key strengths and how have you used them?', difficulty: 'Medium', category: 'Self-assessment' },
    { _id: '4', type: 'HR', question: 'Describe a challenging situation you faced and how you overcame it', difficulty: 'Hard', category: 'Behavioral' },
    { _id: '5', type: 'HR', question: 'Where do you see yourself in 5 years?', difficulty: 'Medium', category: 'Career Goals' },
    { _id: '6', type: 'HR', question: 'What are your weaknesses and how are you working to improve them?', difficulty: 'Medium', category: 'Self-awareness' },
    { _id: '7', type: 'HR', question: 'Tell me about a time you worked in a team. What was your role?', difficulty: 'Medium', category: 'Teamwork' },
    { _id: '8', type: 'HR', question: 'How do you handle stress and pressure at work?', difficulty: 'Medium', category: 'Stress Management' },
    { _id: '9', type: 'HR', question: 'What motivates you in your work?', difficulty: 'Easy', category: 'Motivation' },
    { _id: '10', type: 'HR', question: 'Why should we hire you over other candidates?', difficulty: 'Hard', category: 'Competitive Advantage' }
  ]
};

// MongoDB Connection (optional for testing)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error - using in-memory storage:', err.message));
} else {
  console.log('MONGODB_URI not set - using in-memory storage for testing');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Auth Routes
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (users[email]) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = Date.now().toString();
    users[email] = { id: userId, email, password, name };

    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: userId, email, name } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    const user = Object.values(users).find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Questions Routes - Try OpenAI first, fallback to samples
app.post('/api/questions/generate', async (req, res) => {
  try {
    const { type } = req.body;

    // Check if we already have cached questions for this type
    if (generatedQuestions[type]) {
      console.log(`Using cached questions for ${type}`);
      return res.json({ questions: generatedQuestions[type] });
    }

    // Try to use OpenAI if API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`Generating ${type} interview questions using OpenAI...`);

        const prompt = `Generate 5 professional interview questions for a ${type} developer position. 
        
        Format the response as a JSON array with objects containing:
        - _id: unique identifier (use numbers 1-5)
        - type: "${type}"
        - question: the interview question
        - difficulty: "Easy", "Medium", or "Hard"
        - category: topic category
        
        Make questions realistic, challenging, and relevant to the ${type} role.
        
        Return ONLY the JSON array, no other text.`;

        const message = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });

        const responseText = message.choices[0].message.content;
        console.log('OpenAI Response received');

        // Parse the JSON response
        let questions = [];
        try {
          questions = JSON.parse(responseText);
        } catch (parseError) {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse OpenAI response');
          }
        }

        // Validate and clean questions
        questions = questions.map((q, index) => ({
          _id: String(index + 1),
          type: type,
          question: q.question || q.text || 'Question not available',
          difficulty: q.difficulty || 'Medium',
          category: q.category || 'General'
        }));

        // Cache the generated questions
        generatedQuestions[type] = questions;

        console.log(`Generated ${questions.length} questions for ${type}`);
        return res.json({ questions });
      } catch (openaiError) {
        console.log(`OpenAI error: ${openaiError.message}. Using sample questions instead.`);
        // Fall through to use sample questions
      }
    }

    // Use sample questions as fallback
    console.log(`Using sample questions for ${type}`);
    const questions = sampleQuestionsDB[type] || [];
    
    // Cache the sample questions
    generatedQuestions[type] = questions;

    res.json({ 
      questions,
      message: 'Using sample questions (OpenAI quota exceeded or not configured)'
    });
  } catch (error) {
    console.error('Error generating questions:', error.message);
    
    // Final fallback: return sample questions
    const questions = sampleQuestionsDB[req.body.type] || [];
    res.json({ 
      questions,
      message: 'Using sample questions due to error'
    });
  }
});

app.get('/api/questions/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    // Return cached questions or sample questions
    const questions = generatedQuestions[type] || sampleQuestionsDB[type] || [];
    
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume Upload and Question Generation
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let resumeText = '';

    // Extract text from file
    if (req.file.mimetype === 'text/plain') {
      resumeText = fs.readFileSync(filePath, 'utf-8');
    } else if (req.file.mimetype === 'application/pdf') {
      resumeText = 'PDF file uploaded. Using AI to extract content.';
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      resumeText = 'DOCX file uploaded. Using AI to extract content.';
    }

    const resumeId = Date.now().toString();
    resumeData[resumeId] = {
      _id: resumeId,
      fileName: req.file.originalname,
      filePath: filePath,
      resumeText: resumeText,
      uploadedAt: new Date()
    };

    console.log(`Resume uploaded: ${resumeId}`);
    res.json({ resumeId, message: 'Resume uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate questions based on resume
app.post('/api/questions/generate-from-resume', async (req, res) => {
  try {
    const { resumeId } = req.body;

    if (!resumeData[resumeId]) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeData[resumeId];
    const resumeText = resume.resumeText;

    // Try OpenAI if API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`Generating interview questions based on resume...`);

        const prompt = `You are an expert interviewer. Based on the following resume, generate 5 targeted interview questions that are specific to the candidate's experience, skills, and background.

Resume Content:
${resumeText}

Generate questions that:
1. Are specific to the skills and technologies mentioned
2. Explore the candidate's experience with specific projects
3. Assess problem-solving abilities based on their background
4. Are challenging but fair

Format the response as a JSON array with objects containing:
- _id: unique identifier (use numbers 1-5)
- type: "Resume-Based"
- question: the interview question
- difficulty: "Easy", "Medium", or "Hard"
- category: topic category based on resume

Return ONLY the JSON array, no other text.`;

        const message = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });

        const responseText = message.choices[0].message.content;
        console.log('OpenAI Response received for resume-based questions');

        // Parse the JSON response
        let questions = [];
        try {
          questions = JSON.parse(responseText);
        } catch (parseError) {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse OpenAI response');
          }
        }

        // Validate and clean questions
        questions = questions.map((q, index) => ({
          _id: String(index + 1),
          type: 'Resume-Based',
          question: q.question || q.text || 'Question not available',
          difficulty: q.difficulty || 'Medium',
          category: q.category || 'Experience'
        }));

        console.log(`Generated ${questions.length} resume-based questions`);
        return res.json({ questions, resumeId });
      } catch (openaiError) {
        console.log(`OpenAI error: ${openaiError.message}. Using fallback questions.`);
      }
    }

    // Fallback: Generate generic questions based on resume keywords
    const fallbackQuestions = generateFallbackResumeQuestions(resumeText);
    res.json({ 
      questions: fallbackQuestions,
      resumeId,
      message: 'Using fallback questions (OpenAI not available)'
    });
  } catch (error) {
    console.error('Error generating resume-based questions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fallback function to generate questions from resume
function generateFallbackResumeQuestions(resumeText) {
  const questions = [];
  const resumeLower = resumeText.toLowerCase();

  const skillKeywords = {
    'react': 'React',
    'node': 'Node.js',
    'python': 'Python',
    'java': 'Java',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'mongodb': 'MongoDB',
    'sql': 'SQL',
    'aws': 'AWS',
    'docker': 'Docker'
  };

  const detectedSkills = [];
  for (const [keyword, skill] of Object.entries(skillKeywords)) {
    if (resumeLower.includes(keyword)) {
      detectedSkills.push(skill);
    }
  }

  if (detectedSkills.length > 0) {
    questions.push({
      _id: '1',
      type: 'Resume-Based',
      question: `Tell me about your experience with ${detectedSkills[0]}. What projects have you worked on?`,
      difficulty: 'Medium',
      category: 'Experience'
    });
  }

  questions.push({
    _id: String(questions.length + 1),
    type: 'Resume-Based',
    question: 'Describe your most challenging project and how you overcame the obstacles.',
    difficulty: 'Hard',
    category: 'Problem-Solving'
  });

  questions.push({
    _id: String(questions.length + 1),
    type: 'Resume-Based',
    question: 'What is your biggest achievement in your professional career?',
    difficulty: 'Medium',
    category: 'Achievement'
  });

  questions.push({
    _id: String(questions.length + 1),
    type: 'Resume-Based',
    question: 'How do you stay updated with the latest technologies and trends?',
    difficulty: 'Easy',
    category: 'Learning'
  });

  questions.push({
    _id: String(questions.length + 1),
    type: 'Resume-Based',
    question: 'Tell me about a time you had to learn a new technology quickly for a project.',
    difficulty: 'Medium',
    category: 'Adaptability'
  });

  return questions.slice(0, 5);
}

// Interviews Routes
app.post('/api/interviews/start', (req, res) => {
  try {
    const { type, questionIds } = req.body;
    const interviewId = Date.now().toString();
    
    // Get full question objects from questionIds
    const cachedQuestions = generatedQuestions[type] || sampleQuestionsDB[type] || [];
    const questions = questionIds.map(id => {
      const found = cachedQuestions.find(q => q._id === id);
      return found || { _id: id, question: 'Question not available', type, difficulty: 'Medium', category: 'General' };
    });

    interviews[interviewId] = {
      _id: interviewId,
      type,
      questions: questions,
      answers: [],
      feedback: [],
      createdAt: new Date()
    };

    console.log('Interview started:', interviewId, 'with', questions.length, 'questions');
    res.json({ interviewId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/interviews/:id/submit-answer', (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    
    if (!interviews[id]) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interviews[id].answers.push(answer);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!interviews[id]) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const interview = interviews[id];
    console.log('Returning interview:', id, 'with', interview.questions.length, 'questions');
    res.json({ interview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interviews/user/history', (req, res) => {
  try {
    res.json({ interviews: Object.values(interviews) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feedback Routes - Try OpenAI first, fallback to local evaluation
app.post('/api/feedback/evaluate', async (req, res) => {
  try {
    const { interviewId, questionIndex } = req.body;
    
    if (!interviews[interviewId]) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const interview = interviews[interviewId];
    const question = interview.questions[questionIndex];
    const answer = interview.answers[questionIndex];

    // Try OpenAI if API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`Evaluating answer for question: ${question.question}`);

        const prompt = `You are an expert interviewer. Evaluate this interview answer:

Question: ${question.question}
Difficulty: ${question.difficulty}
Category: ${question.category}

Candidate's Answer: "${answer}"

Provide evaluation in JSON format with:
- score: number from 0-100
- strengths: array of 2-3 strengths
- improvements: array of 2-3 areas to improve
- suggestedAnswer: a model answer (2-3 sentences)

Return ONLY valid JSON, no other text.`;

        const message = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        const responseText = message.choices[0].message.content;

        let feedback = {};
        try {
          feedback = JSON.parse(responseText);
        } catch (parseError) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            feedback = JSON.parse(jsonMatch[0]);
          } else {
            feedback = evaluateAnswerLocally(question._id, answer);
          }
        }

        // Ensure feedback has required fields
        feedback = {
          score: Math.min(100, Math.max(0, feedback.score || 50)),
          strengths: Array.isArray(feedback.strengths) ? feedback.strengths : ['Good attempt'],
          improvements: Array.isArray(feedback.improvements) ? feedback.improvements : ['Could provide more detail'],
          suggestedAnswer: feedback.suggestedAnswer || 'A more comprehensive answer would be helpful.'
        };

        interviews[interviewId].feedback[questionIndex] = feedback;
        console.log(`Question ${question._id}: Score ${feedback.score}/100`);
        return res.json({ feedback });
      } catch (openaiError) {
        console.log(`OpenAI error: ${openaiError.message}. Using local evaluation.`);
        // Fall through to local evaluation
      }
    }

    // Use local evaluation as fallback
    const feedback = evaluateAnswerLocally(question._id, answer);
    interviews[interviewId].feedback[questionIndex] = feedback;
    console.log(`Question ${question._id}: Score ${feedback.score}/100 (local evaluation)`);
    res.json({ feedback });
  } catch (error) {
    console.error('Error evaluating answer:', error.message);
    res.status(500).json({ error: `Failed to evaluate answer: ${error.message}` });
  }
});

// Local evaluation fallback
function evaluateAnswerLocally(questionId, answer) {
  let score = 0;
  const answerLower = answer.toLowerCase();
  const words = answer.trim().split(/\s+/).filter(w => w.length > 0);
  
  // Check if answer is gibberish (repeated characters or too many consonants)
  const isGibberish = checkIfGibberish(answer);
  if (isGibberish) {
    return {
      score: 5,
      strengths: [],
      improvements: ['Please provide a meaningful answer', 'Avoid random characters', 'Write a coherent response'],
      suggestedAnswer: 'A proper answer should be meaningful and address the question asked.'
    };
  }

  // Check answer length (0-25 points)
  if (words.length < 5) {
    score += Math.max(0, (words.length / 5) * 15);
  } else if (words.length < 15) {
    score += 15;
  } else if (words.length < 30) {
    score += 20;
  } else {
    score += 25;
  }

  // Check for coherence and sentence structure (0-25 points)
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) {
    score += 25;
  } else if (sentences.length === 2) {
    score += 15;
  } else if (sentences.length === 1) {
    score += 8;
  }

  // Check for meaningful words and vocabulary (0-25 points)
  const meaningfulWords = words.filter(w => w.length > 2 && isValidWord(w));
  const meaningfulRatio = meaningfulWords.length / Math.max(1, words.length);
  score += Math.round(meaningfulRatio * 25);

  // Check for technical/domain-specific terms (0-25 points)
  const technicalTerms = [
    'function', 'variable', 'loop', 'array', 'object', 'method', 'class', 'interface',
    'database', 'query', 'api', 'server', 'client', 'request', 'response', 'protocol',
    'algorithm', 'data', 'structure', 'performance', 'optimization', 'security',
    'authentication', 'authorization', 'cache', 'memory', 'process', 'thread',
    'component', 'state', 'props', 'hook', 'effect', 'render', 'virtual', 'dom',
    'experience', 'team', 'project', 'challenge', 'solution', 'improve', 'learn',
    'skill', 'responsibility', 'achievement', 'goal', 'motivation', 'strength'
  ];
  let termCount = 0;
  technicalTerms.forEach(term => {
    if (answerLower.includes(term)) termCount++;
  });
  score += Math.min(25, termCount * 2);

  score = Math.round(Math.min(100, Math.max(5, score)));

  return {
    score,
    strengths: score >= 70 ? ['Good understanding', 'Clear explanation', 'Relevant details'] : 
               score >= 50 ? ['Addresses the question', 'Shows effort'] : 
               ['Attempt made'],
    improvements: score >= 70 ? ['Could add more examples', 'Include specific scenarios'] :
                  score >= 50 ? ['Provide more technical details', 'Include specific examples', 'Expand your explanation'] :
                  ['Provide a more meaningful answer', 'Include relevant details', 'Explain your reasoning'],
    suggestedAnswer: 'A comprehensive answer should include relevant details, specific examples, and demonstrate understanding of the topic.'
  };
}

// Check if answer is gibberish
function checkIfGibberish(text) {
  if (text.length < 5) return true;
  
  // Check for repeated characters (e.g., "asdfdfasf")
  const repeatedPattern = /(.)\1{2,}/g;
  const repeatedMatches = text.match(repeatedPattern) || [];
  if (repeatedMatches.length > 2) return true;
  
  // Check consonant-to-vowel ratio (gibberish has very high consonant ratio)
  const vowels = (text.match(/[aeiouAEIOU]/g) || []).length;
  const consonants = (text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
  const consonantRatio = consonants / (consonants + vowels + 1);
  if (consonantRatio > 0.85) return true;
  
  // Check for common words (gibberish won't have any)
  const commonWords = ['the', 'a', 'is', 'and', 'or', 'in', 'to', 'for', 'of', 'with', 'that', 'this', 'be', 'have', 'from', 'by', 'on', 'at', 'as', 'it', 'was', 'are', 'been', 'can', 'could', 'would', 'should', 'will', 'do', 'does', 'did', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their'];
  const textLower = text.toLowerCase();
  const foundCommonWords = commonWords.filter(word => textLower.includes(word)).length;
  if (foundCommonWords === 0 && text.length > 10) return true;
  
  return false;
}

// Check if word is valid (not gibberish)
function isValidWord(word) {
  // Remove non-alphabetic characters
  const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (cleanWord.length < 2) return false;
  
  // Check vowel-consonant balance
  const vowels = (cleanWord.match(/[aeiou]/g) || []).length;
  const consonants = cleanWord.length - vowels;
  
  // Valid words have reasonable vowel-consonant ratio
  if (vowels === 0 || consonants === 0) return false;
  const ratio = vowels / consonants;
  return ratio > 0.2 && ratio < 5;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  if (process.env.OPENAI_API_KEY) {
    console.log('OpenAI API configured - will try to use AI for question generation and evaluation');
  } else {
    console.log('OpenAI API not configured - using sample questions and local evaluation');
  }
  console.log('Sample questions available for: Frontend, Backend, HR');
});
