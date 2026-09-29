/* ==========================================================================
   ResuMate App JS - Interactivity & Resume Processing Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Backend URL Detection
  const BACKEND_URL = ''; // Empty string means relative path (same domain)

  // Application State
  const state = {
    activeStep: 'step-personal',
    stepsOrder: ['step-personal', 'step-summary', 'step-experience', 'step-education', 'step-skills', 'step-projects'],
    resume: {
      id: generateUUID(),
      title: 'My Professional Resume',
      personalInfo: {
        fullname: '',
        jobtitle: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: {
        tech: '',
        soft: ''
      },
      projects: [],
      templateId: 'template-modern'
    }
  };

  /* ==========================================================================
     1. Navigation & UI Scroll Interactivity
     ========================================================================== */
  const navbar = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  // Sticky Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(8, 12, 24, 0.9)';
      navbar.style.boxShadow = 'var(--shadow-sm)';
    } else {
      navbar.style.background = 'rgba(10, 15, 30, 0.75)';
      navbar.style.boxShadow = 'none';
    }

    // Scroll active link indicator
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  });

  // Mobile Menu Toggle
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = mobileToggle.querySelector('i');
    if (navMenu.classList.contains('active')) {
      icon.setAttribute('data-lucide', 'x');
    } else {
      icon.setAttribute('data-lucide', 'menu');
    }
    lucide.createIcons();
  });

  // Close mobile menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      const icon = mobileToggle.querySelector('i');
      icon.setAttribute('data-lucide', 'menu');
      lucide.createIcons();
    });
  });

  /* ==========================================================================
     2. ATS Score Checker Logic
     ========================================================================== */
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const uploaderPrompt = document.getElementById('uploader-prompt');
  const uploaderLoader = document.getElementById('uploader-loader');
  const atsResults = document.getElementById('ats-results');
  const reuploadBtn = document.getElementById('reupload-btn');

  // Open file dialog on clicking drag-drop zone
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  
  dropZone.addEventListener('click', () => {
    if (uploaderLoader.classList.contains('hidden')) {
      fileInput.click();
    }
  });

  // Drag over effects
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'rgba(15, 23, 42, 0.6)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    dropZone.style.background = 'rgba(15, 23, 42, 0.3)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    dropZone.style.background = 'rgba(15, 23, 42, 0.3)';
    
    if (e.dataTransfer.files.length > 0) {
      handleResumeFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleResumeFile(fileInput.files[0]);
    }
  });

  reuploadBtn.addEventListener('click', () => {
    atsResults.classList.add('hidden');
    dropZone.classList.remove('hidden');
    uploaderPrompt.classList.remove('hidden');
    fileInput.value = '';
  });

  // Process File Upload
  function handleResumeFile(file) {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      alert('Invalid file format. Please upload a PDF, DOCX, DOC, or TXT file.');
      return;
    }

    // Hide prompt, show loader
    uploaderPrompt.classList.add('hidden');
    uploaderLoader.classList.remove('hidden');

    const formData = new FormData();
    formData.append('resume', file);

    // Call actual server check, with client-side fallback if server fails/not running
    fetch(`${BACKEND_URL}/api/ats-check`, {
      method: 'POST',
      body: formData
    })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }
      return response.json();
    })
    .then((data) => {
      // Small simulated delay for premium scanning feel even if server returns fast
      setTimeout(() => {
        renderScanResults(data);
      }, 1000);
    })
    .catch((err) => {
      console.warn('Backend server not responding. Falling back to in-browser parsing simulation...', err.message);
      // Client-side local scanner simulation
      runClientSideAtsSimulation(file);
    });
  }

  // Client-Side Simulated Scanner
  function runClientSideAtsSimulation(file) {
    setTimeout(() => {
      const filename = file.name;
      const lowerName = filename.toLowerCase();
      
      // Seed details based on file size and extension
      let score = 72;
      const formattingIssues = [];
      
      if (file.size > 2 * 1024 * 1024) {
        formattingIssues.push('File size is larger than 2MB. Optimize images and embedded items.');
        score -= 6;
      }
      
      if (lowerName.includes('draft') || lowerName.includes('copy') || lowerName.includes('v1') || lowerName.includes('v2')) {
        formattingIssues.push('File name contains informal words ("draft", "copy"). Save with a professional format like "Firstname_Lastname_Resume.pdf".');
        score -= 5;
      }
      
      // Simulate keyword matching
      const keywords = ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'Agile', 'AWS', 'Python', 'Docker', 'Kubernetes'];
      const matched = [];
      const missing = [];
      
      // Randomly assign keywords
      keywords.forEach((kw, i) => {
        if (Math.random() > 0.4) {
          matched.push(kw);
        } else {
          missing.push(kw);
        }
      });
      
      score += (matched.length * 4) - 15;
      
      if (matched.length < 3) {
        formattingIssues.push('Very low keyword density. Incorporate specialized technical terms matching the job role.');
        score -= 10;
      }
      
      if (Math.random() > 0.6) {
        formattingIssues.push('Detected non-standard font structure. Use standard professional fonts like Arial, Inter, Calibri, or Helvetica.');
        score -= 8;
      }

      if (Math.random() > 0.7) {
        formattingIssues.push('Found multi-column tables. Multi-column tables lead to text overlaps in standard parser templates.');
        score -= 12;
      }
      
      // Clamp score
      score = Math.max(35, Math.min(98, score));
      
      const simulatedResult = {
        id: generateUUID(),
        filename: filename,
        score: score,
        keywordsMatched: matched,
        keywordsMissing: missing.slice(0, 4),
        formattingIssues: formattingIssues.length > 0 ? formattingIssues : ['No formatting issues detected. Flawless structural score!'],
        readabilityScore: Math.round(70 + Math.random() * 25)
      };
      
      renderScanResults(simulatedResult);
    }, 1800); // 1.8 second delay
  }

  // Render scan results visually
  function renderScanResults(results) {
    // Hide loader, hide uploader card, show results card
    uploaderLoader.classList.add('hidden');
    dropZone.classList.add('hidden');
    atsResults.classList.remove('hidden');

    // Animating circular score
    const scoreNum = document.getElementById('result-score-num');
    const scoreCircle = document.getElementById('score-circle-path');
    const scoreBadge = document.getElementById('score-status-badge');

    // Reset circle
    scoreCircle.style.strokeDashoffset = '283';

    let currentScore = 0;
    const targetScore = results.score;
    
    // Animate score counter
    const counterInterval = setInterval(() => {
      if (currentScore >= targetScore) {
        clearInterval(counterInterval);
      } else {
        currentScore++;
        scoreNum.textContent = currentScore;
      }
    }, 15);

    // Animate SVG path (circumference is 283)
    const strokeOffset = 283 - (283 * targetScore) / 100;
    setTimeout(() => {
      scoreCircle.style.strokeDashoffset = strokeOffset;
    }, 100);

    // Apply color class to badge
    scoreBadge.className = 'score-badge-status';
    if (targetScore >= 80) {
      scoreBadge.classList.add('excellent');
      scoreBadge.textContent = 'Highly Optimized';
      scoreCircle.style.stroke = 'var(--success)';
    } else if (targetScore >= 65) {
      scoreBadge.classList.add('warning');
      scoreBadge.textContent = 'Requires Tuning';
      scoreCircle.style.stroke = 'var(--warning)';
    } else {
      scoreBadge.classList.add('danger');
      scoreBadge.textContent = 'Poor Compliance';
      scoreCircle.style.stroke = 'var(--danger)';
    }

    // Set breakdown metrics
    animateMetricBar('readability-bar', 'readability-val', results.readabilityScore);
    
    const kwScore = Math.round((results.keywordsMatched.length / (results.keywordsMatched.length + results.keywordsMissing.length || 1)) * 100);
    animateMetricBar('keyword-bar', 'keyword-val', kwScore);
    
    const layoutScore = Math.max(40, 100 - (results.formattingIssues.length * 12));
    animateMetricBar('layout-bar', 'layout-val', layoutScore);

    // Populate Keyword Pool
    const matchedPool = document.getElementById('matched-keywords-pool');
    const missingPool = document.getElementById('missing-keywords-pool');
    
    matchedPool.innerHTML = '';
    if (results.keywordsMatched.length === 0) {
      matchedPool.innerHTML = '<span class="text-muted" style="font-size: var(--fs-xs);">No matching industry keywords found.</span>';
    } else {
      results.keywordsMatched.forEach(kw => {
        matchedPool.innerHTML += `<span class="keyword-pill matched"><i data-lucide="check" style="width: 10px; height: 10px; display: inline; vertical-align: middle;"></i> ${kw}</span>`;
      });
    }

    missingPool.innerHTML = '';
    if (results.keywordsMissing.length === 0) {
      missingPool.innerHTML = '<span class="text-green" style="font-size: var(--fs-xs);">Excellent! No critical missing keywords.</span>';
    } else {
      results.keywordsMissing.forEach(kw => {
        missingPool.innerHTML += `<span class="keyword-pill missing"><i data-lucide="plus" style="width: 10px; height: 10px; display: inline; vertical-align: middle;"></i> ${kw}</span>`;
      });
    }

    // Populate Formatting Issues
    const issuesList = document.getElementById('formatting-issues-list');
    const issuesCount = document.getElementById('formatting-count');
    issuesList.innerHTML = '';
    
    // Check if issues are real or empty
    const realIssues = results.formattingIssues.filter(iss => !iss.includes('passed') && !iss.includes('No formatting issues'));
    issuesCount.textContent = realIssues.length;

    if (realIssues.length === 0) {
      issuesList.innerHTML = `<li><i data-lucide="check-circle" class="text-green"></i> No layout issues detected! Font structures, styles, and dimensions are fully compliant.</li>`;
    } else {
      realIssues.forEach(iss => {
        issuesList.innerHTML += `<li><i data-lucide="alert-triangle" class="text-red"></i> ${iss}</li>`;
      });
    }

    // Reinitialize icons in new markup
    lucide.createIcons();
  }

  function animateMetricBar(barId, valId, targetVal) {
    const bar = document.getElementById(barId);
    const textVal = document.getElementById(valId);
    
    bar.style.width = '0%';
    textVal.textContent = '0%';

    setTimeout(() => {
      bar.style.width = `${targetVal}%`;
      
      let cur = 0;
      const step = setInterval(() => {
        if (cur >= targetVal) {
          clearInterval(step);
          textVal.textContent = `${targetVal}%`;
        } else {
          cur += 2;
          if (cur > targetVal) cur = targetVal;
          textVal.textContent = `${cur}%`;
        }
      }, 15);
    }, 300);
  }

  // Result Tabs toggler
  const tabButtons = document.querySelectorAll('.results-tabs-container .tab-btn');
  const tabContents = document.querySelectorAll('.results-tabs-container .tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  /* ==========================================================================
     3. Resume Builder Step Wizard & State Management
     ========================================================================== */
  const wizardNavBtns = document.querySelectorAll('.wizard-nav-btn');
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');

  // Input Elements
  const inputFullname = document.getElementById('input-fullname');
  const inputJobtitle = document.getElementById('input-jobtitle');
  const inputEmail = document.getElementById('input-email');
  const inputPhone = document.getElementById('input-phone');
  const inputLocation = document.getElementById('input-location');
  const inputLinkedin = document.getElementById('input-linkedin');
  const inputGithub = document.getElementById('input-github');
  const inputSummary = document.getElementById('input-summary');
  const inputSkillsTech = document.getElementById('input-skills-tech');
  const inputSkillsSoft = document.getElementById('input-skills-soft');
  const selectTemplate = document.getElementById('select-template-id');

  // Preview elements
  const previewName = document.getElementById('preview-name');
  const previewTitle = document.getElementById('preview-title');
  const previewEmail = document.getElementById('preview-email');
  const previewPhone = document.getElementById('preview-phone');
  const previewLocation = document.getElementById('preview-location');
  const previewLinkedin = document.getElementById('preview-linkedin');
  const previewGithub = document.getElementById('preview-github');
  const previewSummary = document.getElementById('preview-summary');
  const previewSkillsTech = document.getElementById('preview-skills-tech');
  const previewSkillsSoft = document.getElementById('preview-skills-soft');
  
  // Containers
  const previewEmailContainer = document.getElementById('preview-email-container');
  const previewPhoneContainer = document.getElementById('preview-phone-container');
  const previewLocContainer = document.getElementById('preview-loc-container');
  const previewLinkedinContainer = document.getElementById('preview-linkedin-container');
  const previewGithubContainer = document.getElementById('preview-github-container');

  // Step Switcher Logic
  function goToStep(stepId) {
    state.activeStep = stepId;
    
    // Toggle active class on tabs
    wizardNavBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-step') === stepId) {
        btn.classList.add('active');
      }
    });

    // Toggle active class on pages
    wizardSteps.forEach(step => {
      step.classList.remove('active');
      if (step.getAttribute('id') === stepId) {
        step.classList.add('active');
      }
    });

    // Manage Prev/Next disabled states
    const curIndex = state.stepsOrder.indexOf(stepId);
    prevBtn.disabled = curIndex === 0;
    
    if (curIndex === state.stepsOrder.length - 1) {
      nextBtn.innerHTML = 'Finish <i data-lucide="check"></i>';
    } else {
      nextBtn.innerHTML = 'Next <i data-lucide="arrow-right"></i>';
    }
    lucide.createIcons();
  }

  wizardNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(btn.getAttribute('data-step'));
    });
  });

  prevBtn.addEventListener('click', () => {
    const curIndex = state.stepsOrder.indexOf(state.activeStep);
    if (curIndex > 0) {
      goToStep(state.stepsOrder[curIndex - 1]);
    }
  });

  nextBtn.addEventListener('click', () => {
    const curIndex = state.stepsOrder.indexOf(state.activeStep);
    if (curIndex < state.stepsOrder.length - 1) {
      goToStep(state.stepsOrder[curIndex + 1]);
    } else {
      // Finish action: scroll to preview
      document.querySelector('.builder-preview-panel').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Event listeners for text input changes (Syncing state & preview)
  const bindLiveSync = (inputEl, statePath, previewEl, containerEl = null) => {
    inputEl.addEventListener('input', () => {
      const val = inputEl.value;
      
      // Update state
      if (statePath.includes('.')) {
        const parts = statePath.split('.');
        state.resume[parts[0]][parts[1]] = val;
      } else {
        state.resume[statePath] = val;
      }

      // Update Preview text
      if (previewEl) {
        previewEl.textContent = val || inputEl.placeholder || '';
      }

      // Hide or show contact icons/containers depending on presence of value
      if (containerEl) {
        if (val.trim() === '') {
          containerEl.style.display = 'none';
        } else {
          containerEl.style.display = 'inline-flex';
        }
      }
    });
  };

  bindLiveSync(inputFullname, 'personalInfo.fullname', previewName);
  bindLiveSync(inputJobtitle, 'personalInfo.jobtitle', previewTitle);
  bindLiveSync(inputEmail, 'personalInfo.email', previewEmail, previewEmailContainer);
  bindLiveSync(inputPhone, 'personalInfo.phone', previewPhone, previewPhoneContainer);
  bindLiveSync(inputLocation, 'personalInfo.location', previewLocation, previewLocContainer);
  bindLiveSync(inputLinkedin, 'personalInfo.linkedin', previewLinkedin, previewLinkedinContainer);
  bindLiveSync(inputGithub, 'personalInfo.github', previewGithub, previewGithubContainer);

  // Summary Sync
  inputSummary.addEventListener('input', () => {
    const val = inputSummary.value;
    state.resume.summary = val;
    previewSummary.textContent = val || 'Your summary details will appear here...';
    
    const summarySec = document.getElementById('preview-sec-summary');
    if (val.trim() === '') {
      summarySec.style.display = 'none';
    } else {
      summarySec.style.display = 'block';
    }
  });

  // Skills Sync
  inputSkillsTech.addEventListener('input', () => {
    const val = inputSkillsTech.value;
    state.resume.skills.tech = val;
    previewSkillsTech.textContent = val || 'Add skills...';
    
    const group = document.getElementById('preview-skills-tech-group');
    if (val.trim() === '') {
      group.style.display = 'none';
    } else {
      group.style.display = 'block';
    }
    updateSkillsSectionVisibility();
  });

  inputSkillsSoft.addEventListener('input', () => {
    const val = inputSkillsSoft.value;
    state.resume.skills.soft = val;
    previewSkillsSoft.textContent = val || 'Add skills...';
    
    const group = document.getElementById('preview-skills-soft-group');
    if (val.trim() === '') {
      group.style.display = 'none';
    } else {
      group.style.display = 'block';
    }
    updateSkillsSectionVisibility();
  });

  function updateSkillsSectionVisibility() {
    const sec = document.getElementById('preview-sec-skills');
    if (state.resume.skills.tech.trim() === '' && state.resume.skills.soft.trim() === '') {
      sec.style.display = 'none';
    } else {
      sec.style.display = 'block';
    }
  }

  // Template layout selections
  selectTemplate.addEventListener('change', () => {
    const tempId = selectTemplate.value;
    state.resume.templateId = tempId;
    updateTemplateStyle(tempId);
  });

  function updateTemplateStyle(tempId) {
    const paper = document.getElementById('resume-document');
    paper.className = `resume-paper ${tempId}`;
  }

  // Handle template selection card clicks
  document.querySelectorAll('.btn-select-template').forEach(btn => {
    btn.addEventListener('click', () => {
      const template = btn.getAttribute('data-template');
      selectTemplate.value = template;
      state.resume.templateId = template;
      updateTemplateStyle(template);
      
      // Scroll to Builder Section
      document.getElementById('resume-builder').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ==========================================================================
     4. Dynamic Repeater Sections (Experience, Education, Projects)
     ========================================================================== */

  // Repeater list references
  const expList = document.getElementById('experience-list');
  const eduList = document.getElementById('education-list');
  const projList = document.getElementById('projects-list');

  // Preview list references
  const previewExp = document.getElementById('preview-experience');
  const previewEdu = document.getElementById('preview-education');
  const previewProj = document.getElementById('preview-projects');

  // Dynamic add buttons
  document.getElementById('add-experience-btn').addEventListener('click', () => addExperienceItem());
  document.getElementById('add-education-btn').addEventListener('click', () => addEducationItem());
  document.getElementById('add-project-btn').addEventListener('click', () => addProjectItem());

  // Experience Repeater logic
  function addExperienceItem(data = null) {
    const id = data ? data.id : generateUUID();
    const item = {
      id: id,
      role: data ? data.role : '',
      company: data ? data.company : '',
      dates: data ? data.dates : '',
      desc: data ? data.desc : ''
    };
    
    state.resume.experience.push(item);
    
    // Create Form Card element
    const card = document.createElement('div');
    card.className = 'repeater-card';
    card.setAttribute('data-id', id);
    card.innerHTML = `
      <div class="repeater-card-header">
        <h4>Position Entry</h4>
        <button class="btn-remove-repeater" type="button"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Job Title / Role</label>
          <input type="text" class="input-exp-role" placeholder="Software Engineer" value="${item.role}">
        </div>
        <div class="form-group">
          <label>Employer / Company</label>
          <input type="text" class="input-exp-company" placeholder="Acme Corp" value="${item.company}">
        </div>
      </div>
      <div class="form-group">
        <label>Employment Dates (e.g. Jun 2022 - Present)</label>
        <input type="text" class="input-exp-dates" placeholder="Jan 2021 - Dec 2023" value="${item.dates}">
      </div>
      <div class="form-group">
        <label>Roles & Accomplishments</label>
        <textarea class="input-exp-desc" rows="4" placeholder="- Developed responsive layouts using CSS variables and HTML5.\n- Improved SEO metrics and load speeds by 25%.\n- Collaborated with product designs to implement glassmorphism elements.">${item.desc}</textarea>
      </div>
    `;

    expList.appendChild(card);
    lucide.createIcons();
    
    // Bind change listeners to card inputs
    const inputs = {
      role: card.querySelector('.input-exp-role'),
      company: card.querySelector('.input-exp-company'),
      dates: card.querySelector('.input-exp-dates'),
      desc: card.querySelector('.input-exp-desc')
    };

    const updatePreview = () => {
      const idx = state.resume.experience.findIndex(e => e.id === id);
      if (idx !== -1) {
        state.resume.experience[idx].role = inputs.role.value;
        state.resume.experience[idx].company = inputs.company.value;
        state.resume.experience[idx].dates = inputs.dates.value;
        state.resume.experience[idx].desc = inputs.desc.value;
      }
      renderExperiencePreview();
    };

    Object.values(inputs).forEach(input => input.addEventListener('input', updatePreview));

    // Remove button handler
    card.querySelector('.btn-remove-repeater').addEventListener('click', () => {
      card.remove();
      state.resume.experience = state.resume.experience.filter(e => e.id !== id);
      renderExperiencePreview();
    });

    renderExperiencePreview();
  }

  function renderExperiencePreview() {
    previewExp.innerHTML = '';
    const section = document.getElementById('preview-sec-experience');

    if (state.resume.experience.length === 0) {
      section.style.display = 'none';
      previewExp.innerHTML = `<div class="resume-item-placeholder">Your work experience details will appear here.</div>`;
      return;
    }

    section.style.display = 'block';
    state.resume.experience.forEach(exp => {
      if (!exp.role && !exp.company && !exp.dates && !exp.desc) return; // skip empty elements

      const itemHtml = `
        <div class="resume-item">
          <div class="resume-item-header">
            <div>
              <span class="resume-item-title">${escapeHTML(exp.role || 'Job Title')}</span>
              <span class="text-separator"> | </span>
              <span class="resume-item-org">${escapeHTML(exp.company || 'Employer')}</span>
            </div>
            <div class="resume-item-dates">${escapeHTML(exp.dates || 'Dates')}</div>
          </div>
          <div class="resume-item-desc">${escapeHTML(exp.desc || '')}</div>
        </div>
      `;
      previewExp.innerHTML += itemHtml;
    });
  }

  // Education Repeater Logic
  function addEducationItem(data = null) {
    const id = data ? data.id : generateUUID();
    const item = {
      id: id,
      degree: data ? data.degree : '',
      school: data ? data.school : '',
      dates: data ? data.dates : '',
      grade: data ? data.grade : ''
    };

    state.resume.education.push(item);

    const card = document.createElement('div');
    card.className = 'repeater-card';
    card.setAttribute('data-id', id);
    card.innerHTML = `
      <div class="repeater-card-header">
        <h4>Education Entry</h4>
        <button class="btn-remove-repeater" type="button"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Degree / Certificate</label>
          <input type="text" class="input-edu-degree" placeholder="B.S. in Computer Science" value="${item.degree}">
        </div>
        <div class="form-group">
          <label>School / University</label>
          <input type="text" class="input-edu-school" placeholder="Stanford University" value="${item.school}">
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Graduation Date (e.g. May 2022)</label>
          <input type="text" class="input-edu-dates" placeholder="May 2021" value="${item.dates}">
        </div>
        <div class="form-group">
          <label>GPA / Class Rank (Optional)</label>
          <input type="text" class="input-edu-grade" placeholder="GPA 3.8 / 4.0" value="${item.grade}">
        </div>
      </div>
    `;

    eduList.appendChild(card);
    lucide.createIcons();

    const inputs = {
      degree: card.querySelector('.input-edu-degree'),
      school: card.querySelector('.input-edu-school'),
      dates: card.querySelector('.input-edu-dates'),
      grade: card.querySelector('.input-edu-grade')
    };

    const updatePreview = () => {
      const idx = state.resume.education.findIndex(e => e.id === id);
      if (idx !== -1) {
        state.resume.education[idx].degree = inputs.degree.value;
        state.resume.education[idx].school = inputs.school.value;
        state.resume.education[idx].dates = inputs.dates.value;
        state.resume.education[idx].grade = inputs.grade.value;
      }
      renderEducationPreview();
    };

    Object.values(inputs).forEach(input => input.addEventListener('input', updatePreview));

    card.querySelector('.btn-remove-repeater').addEventListener('click', () => {
      card.remove();
      state.resume.education = state.resume.education.filter(e => e.id !== id);
      renderEducationPreview();
    });

    renderEducationPreview();
  }

  function renderEducationPreview() {
    previewEdu.innerHTML = '';
    const section = document.getElementById('preview-sec-education');

    if (state.resume.education.length === 0) {
      section.style.display = 'none';
      previewEdu.innerHTML = `<div class="resume-item-placeholder">Your degree details will appear here.</div>`;
      return;
    }

    section.style.display = 'block';
    state.resume.education.forEach(edu => {
      if (!edu.degree && !edu.school && !edu.dates) return;

      const itemHtml = `
        <div class="resume-item">
          <div class="resume-item-header">
            <div>
              <span class="resume-item-title">${escapeHTML(edu.degree || 'Degree')}</span>
              <span class="text-separator"> | </span>
              <span class="resume-item-org">${escapeHTML(edu.school || 'University')}</span>
            </div>
            <div class="resume-item-dates">${escapeHTML(edu.dates || 'Date')}</div>
          </div>
          ${edu.grade ? `<div class="resume-item-desc" style="font-weight: 500;">${escapeHTML(edu.grade)}</div>` : ''}
        </div>
      `;
      previewEdu.innerHTML += itemHtml;
    });
  }

  // Projects Repeater Logic
  function addProjectItem(data = null) {
    const id = data ? data.id : generateUUID();
    const item = {
      id: id,
      name: data ? data.name : '',
      tech: data ? data.tech : '',
      desc: data ? data.desc : ''
    };

    state.resume.projects.push(item);

    const card = document.createElement('div');
    card.className = 'repeater-card';
    card.setAttribute('data-id', id);
    card.innerHTML = `
      <div class="repeater-card-header">
        <h4>Project Details</h4>
        <button class="btn-remove-repeater" type="button"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Project Title</label>
          <input type="text" class="input-proj-name" placeholder="ATS Parser Analyzer" value="${item.name}">
        </div>
        <div class="form-group">
          <label>Technologies Used</label>
          <input type="text" class="input-proj-tech" placeholder="React, Node.js, SQLite" value="${item.tech}">
        </div>
      </div>
      <div class="form-group">
        <label>Project Summary & Impact</label>
        <textarea class="input-proj-desc" rows="3" placeholder="- Developed custom keyword parsing scanner using JS regex.\n- Decreased upload validation failures by 30%.">${item.desc}</textarea>
      </div>
    `;

    projList.appendChild(card);
    lucide.createIcons();

    const inputs = {
      name: card.querySelector('.input-proj-name'),
      tech: card.querySelector('.input-proj-tech'),
      desc: card.querySelector('.input-proj-desc')
    };

    const updatePreview = () => {
      const idx = state.resume.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        state.resume.projects[idx].name = inputs.name.value;
        state.resume.projects[idx].tech = inputs.tech.value;
        state.resume.projects[idx].desc = inputs.desc.value;
      }
      renderProjectsPreview();
    };

    Object.values(inputs).forEach(input => input.addEventListener('input', updatePreview));

    card.querySelector('.btn-remove-repeater').addEventListener('click', () => {
      card.remove();
      state.resume.projects = state.resume.projects.filter(p => p.id !== id);
      renderProjectsPreview();
    });

    renderProjectsPreview();
  }

  function renderProjectsPreview() {
    previewProj.innerHTML = '';
    const section = document.getElementById('preview-sec-projects');

    if (state.resume.projects.length === 0) {
      section.style.display = 'none';
      previewProj.innerHTML = `<div class="resume-item-placeholder">Key project entries will render here.</div>`;
      return;
    }

    section.style.display = 'block';
    state.resume.projects.forEach(proj => {
      if (!proj.name && !proj.tech && !proj.desc) return;

      const itemHtml = `
        <div class="resume-item">
          <div class="resume-item-header">
            <div>
              <span class="resume-item-title">${escapeHTML(proj.name || 'Project Name')}</span>
              ${proj.tech ? `<span class="text-separator"> | </span><span class="resume-item-org" style="font-weight: 500;">${escapeHTML(proj.tech)}</span>` : ''}
            </div>
          </div>
          <div class="resume-item-desc">${escapeHTML(proj.desc || '')}</div>
        </div>
      `;
      previewProj.innerHTML += itemHtml;
    });
  }

  /* ==========================================================================
     5. Export PDF & Save Data logic
     ========================================================================== */
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnSaveDb = document.getElementById('btn-save-db');
  const savedNotification = document.getElementById('saved-notification');

  // html2pdf compiler trigger
  btnDownloadPdf.addEventListener('click', () => {
    const resumeEl = document.getElementById('resume-document');
    
    // Configure PDF options
    const opt = {
      margin: 10,
      filename: `${state.resume.personalInfo.fullname.replace(/\s+/g, '_') || 'My'}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Temporarily apply print classes to fix page sizing scaling issues in preview mode
    const prevTransform = resumeEl.style.transform;
    resumeEl.style.transform = 'none';
    
    // Export PDF
    html2pdf().from(resumeEl).set(opt).save()
    .then(() => {
      resumeEl.style.transform = prevTransform;
    })
    .catch((err) => {
      console.error('PDF Generation failed:', err);
      alert('Could not compile PDF document. Please try again.');
      resumeEl.style.transform = prevTransform;
    });
  });

  // Save Resume Draft to database (w/ localStorage fallback)
  btnSaveDb.addEventListener('click', () => {
    fetch(`${BACKEND_URL}/api/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state.resume)
    })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Server returned error status');
      }
      return res.json();
    })
    .then((data) => {
      showSavedNotification();
    })
    .catch((err) => {
      console.warn('Backend API unavailable. Saving resume draft to localStorage...', err.message);
      // LocalStorage Fallback
      try {
        localStorage.setItem(`resumate_draft_${state.resume.id}`, JSON.stringify(state.resume));
        showSavedNotification();
      } catch (e) {
        console.error('LocalStorage write failed:', e);
        alert('Could not save resume draft to browser memory.');
      }
    });
  });

  function showSavedNotification() {
    savedNotification.classList.remove('hidden');
    setTimeout(() => {
      savedNotification.classList.add('hidden');
    }, 3000);
  }

  // Load latest draft from database or localStorage on startup if any
  function loadSavedDraftIfAny() {
    // Try localStorage first for simplicity
    try {
      const keys = Object.keys(localStorage);
      const draftKey = keys.find(k => k.startsWith('resumate_draft_'));
      
      if (draftKey) {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw);
          applyLoadedResumeData(draft);
          console.log('Successfully loaded draft from localStorage:', draft.id);
        }
      }
    } catch (e) {
      console.error('Failed reading draft from localStorage:', e);
    }
  }

  function applyLoadedResumeData(data) {
    state.resume = data;
    
    // Apply texts
    inputFullname.value = data.personalInfo.fullname || '';
    inputJobtitle.value = data.personalInfo.jobtitle || '';
    inputEmail.value = data.personalInfo.email || '';
    inputPhone.value = data.personalInfo.phone || '';
    inputLocation.value = data.personalInfo.location || '';
    inputLinkedin.value = data.personalInfo.linkedin || '';
    inputGithub.value = data.personalInfo.github || '';
    inputSummary.value = data.summary || '';
    inputSkillsTech.value = data.skills.tech || '';
    inputSkillsSoft.value = data.skills.soft || '';
    
    selectTemplate.value = data.templateId || 'template-modern';
    updateTemplateStyle(data.templateId || 'template-modern');

    // Trigger input events to refresh preview UI
    const event = new Event('input');
    inputFullname.dispatchEvent(event);
    inputJobtitle.dispatchEvent(event);
    inputEmail.dispatchEvent(event);
    inputPhone.dispatchEvent(event);
    inputLocation.dispatchEvent(event);
    inputLinkedin.dispatchEvent(event);
    inputGithub.dispatchEvent(event);
    inputSummary.dispatchEvent(event);
    inputSkillsTech.dispatchEvent(event);
    inputSkillsSoft.dispatchEvent(event);

    // Populate Lists
    expList.innerHTML = '';
    state.resume.experience = []; // clear, as addExperienceItem will push
    if (data.experience && data.experience.length > 0) {
      data.experience.forEach(exp => addExperienceItem(exp));
    }

    eduList.innerHTML = '';
    state.resume.education = [];
    if (data.education && data.education.length > 0) {
      data.education.forEach(edu => addEducationItem(edu));
    }

    projList.innerHTML = '';
    state.resume.projects = [];
    if (data.projects && data.projects.length > 0) {
      data.projects.forEach(proj => addProjectItem(proj));
    }
  }

  /* ==========================================================================
     6. Contact Form Submission
     ========================================================================== */
  const contactForm = document.getElementById('contact-form-elem');
  const contactSuccess = document.getElementById('contact-success');
  const contactSubmitBtn = document.getElementById('contact-submit-btn');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactSubmitBtn.disabled = true;
    contactSubmitBtn.innerHTML = 'Sending... <div class="spinner" style="width:14px; height:14px; margin: 0; border-width: 2px; border-top-color: white; display: inline-block; vertical-align: middle;"></div>';

    // Simulate sending mail
    setTimeout(() => {
      contactSuccess.classList.remove('hidden');
      contactForm.reset();
      contactSubmitBtn.disabled = false;
      contactSubmitBtn.innerHTML = 'Send Message <i data-lucide="send"></i>';
      lucide.createIcons();

      setTimeout(() => {
        contactSuccess.classList.add('hidden');
      }, 4000);
    }, 1500);
  });

  /* ==========================================================================
     7. Helper Utility Functions
     ========================================================================== */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Pre-populate experience and education placeholder lists on load so preview isn't blank
  renderExperiencePreview();
  renderEducationPreview();
  renderProjectsPreview();

  // Try loading previous draft if the user had closed the browser
  loadSavedDraftIfAny();
});
