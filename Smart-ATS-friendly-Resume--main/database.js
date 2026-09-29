const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'resumes.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    // Resumes table to store builder data
    db.run(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        personal_info TEXT,
        summary TEXT,
        experience TEXT,
        education TEXT,
        skills TEXT,
        projects TEXT,
        template_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating resumes table:', err.message);
    });

    // ATS scans table to store uploaded resume score history
    db.run(`
      CREATE TABLE IF NOT EXISTS ats_scans (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        score INTEGER NOT NULL,
        keywords_matched TEXT,
        keywords_missing TEXT,
        formatting_issues TEXT,
        readability_score INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating ats_scans table:', err.message);
    });
  });
}

// Database helper functions
const dbHelpers = {
  // Save or update resume
  saveResume: (resume, callback) => {
    const query = `
      INSERT INTO resumes (id, title, personal_info, summary, experience, education, skills, projects, template_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        personal_info = excluded.personal_info,
        summary = excluded.summary,
        experience = excluded.experience,
        education = excluded.education,
        skills = excluded.skills,
        projects = excluded.projects,
        template_id = excluded.template_id,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    db.run(
      query,
      [
        resume.id,
        resume.title || 'Untitled Resume',
        JSON.stringify(resume.personalInfo || {}),
        resume.summary || '',
        JSON.stringify(resume.experience || []),
        JSON.stringify(resume.education || []),
        JSON.stringify(resume.skills || []),
        JSON.stringify(resume.projects || []),
        resume.templateId || 'template-modern',
      ],
      function (err) {
        callback(err, this);
      }
    );
  },

  // Get resume by ID
  getResume: (id, callback) => {
    const query = `SELECT * FROM resumes WHERE id = ?`;
    db.get(query, [id], (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(null, null);
      
      // Parse JSON strings back to objects
      try {
        const resume = {
          id: row.id,
          title: row.title,
          personalInfo: JSON.parse(row.personal_info),
          summary: row.summary,
          experience: JSON.parse(row.experience),
          education: JSON.parse(row.education),
          skills: JSON.parse(row.skills),
          projects: JSON.parse(row.projects),
          templateId: row.template_id,
          updatedAt: row.updated_at
        };
        callback(null, resume);
      } catch (e) {
        callback(e);
      }
    });
  },

  // List all resumes
  listResumes: (callback) => {
    const query = `SELECT id, title, updated_at FROM resumes ORDER BY updated_at DESC`;
    db.all(query, [], (err, rows) => {
      callback(err, rows);
    });
  },

  // Save ATS scan record
  saveAtsScan: (scan, callback) => {
    const query = `
      INSERT INTO ats_scans (id, filename, score, keywords_matched, keywords_missing, formatting_issues, readability_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      query,
      [
        scan.id,
        scan.filename,
        scan.score,
        JSON.stringify(scan.keywordsMatched || []),
        JSON.stringify(scan.keywordsMissing || []),
        JSON.stringify(scan.formattingIssues || []),
        scan.readabilityScore,
      ],
      function (err) {
        callback(err, this);
      }
    );
  },

  // Get scan history
  getScanHistory: (callback) => {
    const query = `SELECT * FROM ats_scans ORDER BY created_at DESC LIMIT 10`;
    db.all(query, [], (err, rows) => {
      if (err) return callback(err);
      try {
        const scans = rows.map(row => ({
          id: row.id,
          filename: row.filename,
          score: row.score,
          keywordsMatched: JSON.parse(row.keywords_matched),
          keywordsMissing: JSON.parse(row.keywords_missing),
          formatting_issues: JSON.parse(row.formatting_issues),
          readabilityScore: row.readability_score,
          createdAt: row.created_at
        }));
        callback(null, scans);
      } catch (e) {
        callback(e);
      }
    });
  }
};

module.exports = dbHelpers;
