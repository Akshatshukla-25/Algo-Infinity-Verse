let roadmapsData = null;
let activeRoadmap = 'beginner';
let currentView = 'list';
let currentQuizAnswers = {};
let roadmapModalOpen = false;

// Helper to expose state for testing & debugging
if (typeof window !== 'undefined') {
  window.getRoadmapState = () => ({ activeRoadmap, currentView, roadmapModalOpen });
}

// ── Roadmap Data Fetching ──────────────────────────────────────────────────

async function fetchRoadmaps() {
  try {
    const res = await fetch('/api/roadmaps');
    if (!res.ok) throw new Error('Failed to fetch roadmaps');
    roadmapsData = await res.json();
    // Check URL for ?tab= query parameter
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['beginner', 'intermediate', 'advanced'].includes(tabParam)) {
      activeRoadmap = tabParam;
      document.querySelectorAll('.hub-tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.roadmap === activeRoadmap);
      });
    }
    renderRoadmap();
  } catch (err) {
    console.error(err);
    document.getElementById('timelineContainer').innerHTML = `
      <p style="text-align: center; color: #ef4444; padding: 2rem;">
        Failed to load roadmaps from registry. Please try again later.
      </p>
    `;
  }
}

// ── Render Functions ───────────────────────────────────────────────────────

function getResumeAnalysisData() {
  try {
    const raw = localStorage.getItem('resumeAnalysis');
    if (raw) return JSON.parse(raw);
  } catch (_err) {
    // ignore storage error
  }
  if (window.userProgress && window.userProgress.resumeAnalysis) {
    return window.userProgress.resumeAnalysis;
  }
  return null;
}

function isStepRecommended(step, recommendedTopics = [], missingSkills = []) {
  if (!step) return false;
  const title = (step.title || '').toLowerCase();
  const desc = (step.desc || step.description || '').toLowerCase();
  const theory = (step.theory || '').toLowerCase();
  const full = `${title} ${desc} ${theory}`;

  const candidates = [...(recommendedTopics || []), ...(missingSkills || [])];
  for (const item of candidates) {
    if (!item) continue;
    const term = String(item).toLowerCase();
    if (full.includes(term)) return true;
    if (term.includes('graph') && full.includes('graph')) return true;
    if ((term.includes('dynamic') || term.includes('dp')) && full.includes('dynamic')) return true;
    if (term.includes('tree') && full.includes('tree')) return true;
    if (term.includes('array') && full.includes('array')) return true;
    if (term.includes('string') && full.includes('string')) return true;
    if (term.includes('linked list') && (full.includes('linked list') || full.includes('link')))
      return true;
    if (term.includes('system design') && full.includes('system design')) return true;
  }
  return false;
}

function renderTailoredBannerHub() {
  const container = document.querySelector('.hub-detail');
  if (!container) return;

  const analysis = getResumeAnalysisData();
  let banner = document.getElementById('tailoredRoadmapHubBanner');

  if (!analysis || !analysis.missingSkills || analysis.missingSkills.length === 0) {
    if (banner) banner.remove();
    return;
  }

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'tailoredRoadmapHubBanner';
    banner.className = 'tailored-roadmap-banner';
    const detailHeader = container.querySelector('.detail-header');
    if (detailHeader) {
      detailHeader.after(banner);
    } else {
      container.prepend(banner);
    }
  }

  const role = analysis.targetRole || 'Software Engineer';
  const skills = (analysis.missingSkills || []).slice(0, 4).join(', ');

  banner.innerHTML = `
    <div class="banner-content">
      <div class="banner-badge"><i class="fas fa-sparkles"></i> Resume Tailored Path</div>
      <div class="banner-info">
        <strong>Target Role: ${role}</strong> &bull; Prioritized Missing Skills: <em>${skills}</em> (ATS: ${analysis.atsScore || 0}%)
      </div>
    </div>
    <button type="button" class="btn btn-outline btn-sm reset-tailored-btn" onclick="clearTailoredRoadmapHubView()">
      <i class="fas fa-undo"></i> Reset View
    </button>
  `;
}

function clearTailoredRoadmapHubView() {
  try {
    localStorage.removeItem('resumeAnalysis');
    if (window.userProgress) delete window.userProgress.resumeAnalysis;
  } catch (_err) {
    // ignore storage error
  }
  const banner = document.getElementById('tailoredRoadmapHubBanner');
  if (banner) banner.remove();
  renderRoadmap();
}
window.clearTailoredRoadmapHubView = clearTailoredRoadmapHubView;

function renderRoadmap() {
  if (!roadmapsData) return;
  const roadmap = roadmapsData[activeRoadmap];
  if (!roadmap) return;

  document.getElementById('currentRoadmapTitle').textContent = roadmap.title;
  document.getElementById('currentRoadmapDesc').textContent = roadmap.description;
  document.getElementById('currentRoadmapTime').textContent = `Estimated: ${roadmap.estimatedTime}`;

  renderTailoredBannerHub();
  const analysis = getResumeAnalysisData();

  const searchQuery = document.getElementById('stepSearch').value.toLowerCase().trim();
  const filteredSteps = roadmap.steps.filter((step) => {
    return (
      step.title.toLowerCase().includes(searchQuery) ||
      step.desc.toLowerCase().includes(searchQuery)
    );
  });

  const sortedSteps = [...filteredSteps];
  if (analysis && (analysis.recommendedTopics || analysis.missingSkills)) {
    sortedSteps.sort((a, b) => {
      const aRec = isStepRecommended(a, analysis.recommendedTopics, analysis.missingSkills);
      const bRec = isStepRecommended(b, analysis.recommendedTopics, analysis.missingSkills);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return 0;
    });
  }

  renderListView(sortedSteps);
  renderTreeView(roadmap.steps);
}

function renderListView(steps) {
  const timelineContainer = document.getElementById('timelineContainer');
  if (steps.length === 0) {
    timelineContainer.innerHTML = `
      <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No steps match your search query.
      </p>
    `;
    return;
  }

  const analysis = getResumeAnalysisData();

  timelineContainer.innerHTML = steps
    .map((step, idx) => {
      const isRecommended = analysis
        ? isStepRecommended(step, analysis.recommendedTopics, analysis.missingSkills)
        : false;
      const recBadge = isRecommended
        ? `<span class="recommendation-badge"><i class="fas fa-sparkles"></i> Recommended</span>`
        : '';

      return `
    <div class="timeline-item ${isRecommended ? 'recommended-step' : ''}">
      <div class="timeline-icon-box">
        <i class="fas ${step.icon || 'fa-code'}"></i>
      </div>
      <div class="timeline-content">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.4rem;">
          <h3>${idx + 1}. ${step.title}</h3>
          ${recBadge}
        </div>
        <p>${step.desc}</p>
        <div class="timeline-footer">
          <span class="badge badge-${step.difficulty.toLowerCase()}">${step.difficulty}</span>
          <span class="time-estimate"><i class="far fa-clock"></i> ${step.estimatedTime}</span>
          <button type="button" class="btn btn-primary btn-sm" onclick="openStepDetail(${step.id}, '${activeRoadmap}')">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    </div>
  `;
    })
    .join('');
}

function renderTreeView(allSteps) {
  const treeContainer = document.getElementById('roadmapVisualTree');
  if (!treeContainer) return;

  // Clear previous tree
  treeContainer.innerHTML = '';

  if (window.initRoadmapTree) {
    window.initRoadmapTree(activeRoadmap, allSteps);
  }
}

// ── View Toggle ────────────────────────────────────────────────────────────

function switchView(view) {
  currentView = view;
  const listBtn = document.getElementById('listViewBtn');
  const treeBtn = document.getElementById('treeViewBtn');
  const timelineContainer = document.getElementById('timelineContainer');
  const treeViewContainer = document.getElementById('treeViewContainer');

  listBtn.classList.toggle('active', view === 'list');
  treeBtn.classList.toggle('active', view === 'tree');

  if (view === 'list') {
    timelineContainer.classList.remove('hidden');
    treeViewContainer.classList.add('hidden');
  } else {
    timelineContainer.classList.add('hidden');
    treeViewContainer.classList.remove('hidden');
    // Re-render tree when switching to tree view
    if (roadmapsData && roadmapsData[activeRoadmap]) {
      renderTreeView(roadmapsData[activeRoadmap].steps);
    }
  }
}

// ── Step Detail Modal ──────────────────────────────────────────────────────

function openStepDetail(stepId, roadmapKey) {
  if (!roadmapsData || !roadmapsData[roadmapKey]) return;
  const step = roadmapsData[roadmapKey].steps.find((s) => s.id === stepId);
  if (!step) return;

  const modal = document.getElementById('roadmapStepModal');
  if (!modal) return;

  currentQuizAnswers = {};
  roadmapModalOpen = true;

  // Set step badge
  const badgeEl = document.getElementById('roadmapStepBadge');
  if (badgeEl) badgeEl.textContent = `Step ${step.id}`;

  // Set title
  const titleEl = document.getElementById('roadmapStepModalTitle');
  if (titleEl) titleEl.textContent = step.title;

  // Set theory
  const theoryEl = document.getElementById('roadmapStepTheoryContent');
  if (theoryEl) theoryEl.innerHTML = step.theory || '<p>No theory content available.</p>';

  // Complexity section
  const complexitySection = document.getElementById('roadmapStepComplexitySection');
  const complexityBody = document.getElementById('roadmapStepComplexityBody');
  if (step.complexity && step.complexity.length > 0 && complexitySection && complexityBody) {
    complexitySection.classList.remove('hidden');
    complexityBody.innerHTML = step.complexity
      .map((item) => `<tr><td>${item.op}</td><td>${item.time}</td><td>${item.space}</td></tr>`)
      .join('');
  } else if (complexitySection) {
    complexitySection.classList.add('hidden');
  }

  // Quiz section
  const quizSection = document.getElementById('roadmapStepQuizSection');
  const problemsSection = document.getElementById('roadmapStepProblemsSection');
  const quizContent = document.getElementById('roadmapStepQuizContent');
  const submitBtn = document.getElementById('roadmapStepSubmitBtn');

  if (step.type === 'quiz' && step.quiz && step.quiz.length > 0) {
    quizSection.classList.remove('hidden');
    problemsSection.classList.add('hidden');

    if (quizContent) {
      quizContent.innerHTML = step.quiz
        .map(
          (q, qIndex) => `
        <div class="quiz-question-container" data-qindex="${qIndex}">
          <div class="quiz-question-text">${qIndex + 1}. ${q.question}</div>
          <ul class="quiz-options-list">
            ${q.options
              .map(
                (opt, oIndex) => `
              <li class="quiz-option-item" data-oindex="${oIndex}" onclick="hubSelectQuizOption(${qIndex}, ${oIndex}, this)">
                ${opt}
              </li>`
              )
              .join('')}
          </ul>
          <div class="quiz-feedback hidden"></div>
        </div>`
        )
        .join('');
    }

    if (submitBtn) {
      submitBtn.style.display = 'block';
      submitBtn.onclick = () => submitQuiz(step, roadmapKey);
    }
  } else if (step.problems && step.problems.length > 0) {
    quizSection.classList.add('hidden');
    problemsSection.classList.remove('hidden');

    const problemsList = document.getElementById('roadmapStepProblemsList');
    if (problemsList) {
      problemsList.innerHTML = step.problems
        .map(
          (pid) => `
        <li class="roadmap-problem-item">
          <div class="roadmap-problem-info">
            <span class="roadmap-problem-title">Problem #${pid}</span>
            <span class="difficulty-badge medium">Practice Problem</span>
          </div>
          <div class="roadmap-problem-action">
            <button class="btn btn-outline btn-sm" onclick="closeStepModal(); goToProblem(${pid})">
              <i class="fas fa-play"></i> Solve
            </button>
          </div>
        </li>`
        )
        .join('');
    }
  } else {
    quizSection.classList.add('hidden');
    problemsSection.classList.add('hidden');
  }

  modal.classList.add('active');
}

function hubSelectQuizOption(qIndex, oIndex, element) {
  const container = element.closest('.quiz-question-container');
  container.querySelectorAll('.quiz-option-item').forEach((el) => el.classList.remove('selected'));
  element.classList.add('selected');
  currentQuizAnswers[qIndex] = oIndex;
}

function submitQuiz(step, _roadmapKey) {
  const container = document.getElementById('roadmapStepQuizContent');
  if (!container) return;

  let allCorrect = true;
  let allAnswered = true;

  step.quiz.forEach((q, qIndex) => {
    if (currentQuizAnswers[qIndex] === undefined) allAnswered = false;
  });

  if (!allAnswered) {
    if (typeof window.showNotification === 'function') {
      window.showNotification('Please answer all questions before submitting!', 'error');
    }
    return;
  }

  step.quiz.forEach((q, qIndex) => {
    const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
    const feedbackEl = qContainer.querySelector('.quiz-feedback');
    const selected = currentQuizAnswers[qIndex];

    qContainer.querySelectorAll('.quiz-option-item').forEach((optEl, oIndex) => {
      optEl.classList.remove('selected', 'correct', 'incorrect');
      optEl.style.pointerEvents = 'none';
      optEl.style.cursor = 'default';
      if (oIndex === q.correct) optEl.classList.add('correct');
      else if (oIndex === selected) optEl.classList.add('incorrect');
    });

    feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
    if (selected === q.correct) {
      feedbackEl.textContent = `Correct! ${q.explanation}`;
      feedbackEl.className = 'quiz-feedback correct';
    } else {
      allCorrect = false;
      feedbackEl.textContent = `Incorrect. ${q.explanation}`;
      feedbackEl.className = 'quiz-feedback incorrect';
    }
  });

  if (allCorrect) {
    if (typeof window.addXP === 'function') window.addXP(50);
    if (typeof window.showNotification === 'function') {
      window.showNotification(`Quiz Passed! +50 XP!`, 'success');
    }
    const submitBtn = document.getElementById('roadmapStepSubmitBtn');
    if (submitBtn) submitBtn.style.display = 'none';
  } else {
    if (typeof window.showNotification === 'function') {
      window.showNotification('Some answers were incorrect. Please review and try again!', 'error');
    }
    setTimeout(() => {
      step.quiz.forEach((q, qIndex) => {
        if (currentQuizAnswers[qIndex] !== q.correct) {
          const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
          if (qContainer) {
            qContainer.querySelectorAll('.quiz-option-item').forEach((optEl) => {
              optEl.style.pointerEvents = 'auto';
              optEl.style.cursor = 'pointer';
              optEl.classList.remove('correct', 'incorrect', 'selected');
            });
            const feedbackEl = qContainer.querySelector('.quiz-feedback');
            if (feedbackEl) feedbackEl.classList.add('hidden');
          }
          delete currentQuizAnswers[qIndex];
        }
      });
    }, 3000);
  }
}

function closeStepModal() {
  const modal = document.getElementById('roadmapStepModal');
  if (modal) {
    modal.classList.remove('active');
    roadmapModalOpen = false;
  }
}

function goToProblem(problemId) {
  // Navigate to practice page with problem ID
  window.location.href = `/pages/practice/problems.html?id=${problemId}`;
}

// ── Event Setup ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Load partials
  if (typeof window.loadPartial === 'function') {
    window.loadPartial('navbar-placeholder', '/partials/navbar.html');
    window.loadPartial('footer-placeholder', '/partials/footer.html');
  }

  // Fetch roadmaps
  fetchRoadmaps();

  // Setup tab click handlers
  document.querySelectorAll('.hub-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.hub-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeRoadmap = tab.dataset.roadmap;
      // Update URL without page reload
      const url = new URL(window.location);
      url.searchParams.set('tab', activeRoadmap);
      window.history.replaceState({}, '', url);
      currentView = 'list';
      renderRoadmap();
      switchView('list');
    });
  });

  // Setup search input listener
  document.getElementById('stepSearch').addEventListener('input', renderRoadmap);

  // Setup view toggle
  const listBtn = document.getElementById('listViewBtn');
  const treeBtn = document.getElementById('treeViewBtn');
  if (listBtn && treeBtn) {
    listBtn.addEventListener('click', () => switchView('list'));
    treeBtn.addEventListener('click', () => switchView('tree'));
  }

  // Setup modal close handlers
  const closeBtn1 = document.getElementById('roadmapStepModalClose');
  const closeBtn2 = document.getElementById('roadmapStepModalCloseBtn');
  const modal = document.getElementById('roadmapStepModal');

  if (closeBtn1 && modal) {
    closeBtn1.addEventListener('click', closeStepModal);
  }
  if (closeBtn2 && modal) {
    closeBtn2.addEventListener('click', closeStepModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeStepModal();
    });
  }
});

// Expose functions globally
window.openStepDetail = openStepDetail;
window.hubSelectQuizOption = hubSelectQuizOption;
window.closeStepModal = closeStepModal;
window.goToProblem = goToProblem;

// Back button
document.getElementById('rmBackBtn')?.addEventListener('click', () => {
  if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});
