const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory buffer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx|doc|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOCX, DOC, or TXT files are allowed.'));
  }
});

// Resumes Endpoints

// 1. Get all resumes (list)
app.get('/api/resumes', (req, res) => {
  db.listResumes((err, resumes) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while listing resumes' });
    }
    res.json(resumes);
  });
});

// 2. Get resume by ID
app.get('/api/resumes/:id', (req, res) => {
  db.getResume(req.params.id, (err, resume) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while retrieving resume' });
    }
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  });
});

// 3. Save or update resume
app.post('/api/resumes', (req, res) => {
  const resume = req.body;
  if (!resume.id) {
    resume.id = uuidv4();
  }
  
  db.saveResume(resume, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while saving resume' });
    }
    res.json({ success: true, id: resume.id, message: 'Resume saved successfully' });
  });
});

// ATS Checker Endpoint

// 4. Upload and check resume
app.post('/api/ats-check', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filename = req.file.originalname;
  const bufferText = req.file.buffer.toString('utf8'); // simple buffer convert for text search
  
  // ATS Scanning Logic (Dynamic matching on buffer or filename)
  const keywordsList = [
    'React', 'Node.js', 'Python', 'SQL', 'JavaScript', 'TypeScript', 'Agile', 'Scrum', 'Git',
    'HTML', 'CSS', 'Project Management', 'Software Engineer', 'Data Analysis', 'AWS', 'Docker',
    'Cloud', 'DevOps', 'Machine Learning', 'API', 'Restful', 'Kubernetes', 'Java', 'Linux'
  ];

  const matchedKeywords = [];
  const missingKeywords = [];

  // Simple scanner of content
  const lowerContent = (bufferText + ' ' + filename).toLowerCase();
  
  keywordsList.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  // Calculate scores and compile lists of formatting issues
  const formattingIssues = [];
  let score = 70; // baseline

  // Size constraints
  if (req.file.size > 2 * 1024 * 1024) {
    formattingIssues.push('File size is larger than 2MB. Some ATS systems reject large files.');
    score -= 5;
  }

  // File extension checks
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.docx' || ext === '.doc') {
    // DOCX is generally fine
  } else if (ext === '.pdf') {
    // Check if pdf is image-only (simulated by checking if it contains standard characters)
    if (bufferText.length < 100) {
      formattingIssues.push('Resume appears to be scanned/image-only PDF. ATS scanners cannot read scanned images.');
      score -= 25;
    }
  } else if (ext === '.txt') {
    formattingIssues.push('Plain text files lack professional styling, though readable by ATS.');
    score -= 5;
  }

  // Formatting hints based on file name or length
  if (filename.includes('copy') || filename.includes('v2') || filename.includes('draft')) {
    formattingIssues.push('File name contains informal terms like "copy", "v2", or "draft". Use a professional name like "Firstname_Lastname_Resume.pdf".');
    score -= 5;
  }

  // Look for section headers
  const sections = ['experience', 'education', 'skills', 'projects', 'summary'];
  let sectionCount = 0;
  sections.forEach(sec => {
    if (lowerContent.includes(sec)) sectionCount++;
  });

  if (sectionCount < 4) {
    formattingIssues.push('Missing core standard resume sections (e.g. "Work Experience", "Education", "Skills", "Projects").');
    score -= 15;
  }

  // Contact info check
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(lowerContent);
  const hasPhone = /\+?\d[\d\s-]{8,14}/.test(lowerContent);
  if (!hasEmail) {
    formattingIssues.push('Could not detect a valid email address. Always list contact information clearly at the top.');
    score -= 10;
  }
  if (!hasPhone) {
    formattingIssues.push('Could not detect a phone number. Include active contact details.');
    score -= 5;
  }

  // Adjust keyword portion of score
  const matchRatio = matchedKeywords.length / (matchedKeywords.length + missingKeywords.length || 1);
  score += Math.round(matchRatio * 35) - 10; // Add weight to keyword matches

  // Clamp score between 10 and 100
  score = Math.max(10, Math.min(100, score));

  // Determine readability score
  let readabilityScore = 80;
  if (lowerContent.length > 5000) {
    formattingIssues.push('Resume is excessively long. Try to keep it within 1-2 pages.');
    readabilityScore -= 15;
  } else if (lowerContent.length < 500) {
    formattingIssues.push('Content is too brief. Elaborate on your accomplishments and responsibilities.');
    readabilityScore -= 20;
  }

  // Select a subset of missing keywords to suggest (limit to 5)
  const randomMissing = missingKeywords
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  const scanResult = {
    id: uuidv4(),
    filename: filename,
    score: score,
    keywordsMatched: matchedKeywords,
    keywordsMissing: randomMissing,
    formattingIssues: formattingIssues,
    readabilityScore: readabilityScore
  };

  db.saveAtsScan(scanResult, (err) => {
    if (err) {
      console.error('Error saving scan results:', err.message);
      // Still return the result even if db save failed
    }
    res.json(scanResult);
  });
});

// 5. Get scan history
app.get('/api/ats-history', (req, res) => {
  db.getScanHistory((err, scans) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while retrieving history' });
    }
    res.json(scans);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something broke on the server!' });
});

// Catch-all route to serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
