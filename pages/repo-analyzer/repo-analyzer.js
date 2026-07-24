(function () {
  'use strict';

  /* ---- DOM Cache ---- */
  var dom = {
    analyzeBtn: document.getElementById('analyzeBtn'),
    repoUrlInput: document.getElementById('repoUrlInput'),
    errorBanner: document.getElementById('errorBanner'),
    errorText: document.getElementById('errorText'),
    errorDismiss: document.getElementById('errorDismiss'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    resultsContainer: document.getElementById('resultsContainer'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    depsIcon: document.getElementById('depsIcon'),
    depsText: document.getElementById('depsText'),
    testsIcon: document.getElementById('testsIcon'),
    testsText: document.getElementById('testsText'),
    recommendationsList: document.getElementById('recommendationsList'),
  };

  /* ---- Validation ---- */

  function validateUrl(raw) {
    if (!raw || raw.trim().length === 0) {
      return 'Enter a repository URL to analyze.';
    }
    try {
      var parsed = new URL(raw.trim());
      var host = parsed.hostname.toLowerCase();
      if (
        !host.includes('github.com') &&
        !host.includes('gitlab.com') &&
        !host.includes('bitbucket.org')
      ) {
        return 'URL must point to a GitHub, GitLab, or Bitbucket repository.';
      }
      return null;
    } catch (_) {
      return 'Enter a valid URL (e.g. https://github.com/user/repo).';
    }
  }

  function sanitizeUrl(raw) {
    return raw.trim();
  }

  /* ---- Escape HTML (XSS prevention) ---- */

  function escapeHtml(text) {
    var el = document.createElement('div');
    el.appendChild(document.createTextNode(text));
    return el.innerHTML;
  }

  /* ---- Error Banner ---- */

  function showError(message) {
    dom.errorText.textContent = message;
    dom.errorBanner.classList.add('visible');
  }

  function hideError() {
    dom.errorBanner.classList.remove('visible');
    dom.errorText.textContent = '';
  }

  /* ---- Loading State ---- */

  function setLoading(loading) {
    if (loading) {
      dom.loadingIndicator.classList.add('visible');
      dom.resultsContainer.classList.remove('visible');
      dom.analyzeBtn.disabled = true;
    } else {
      dom.loadingIndicator.classList.remove('visible');
      dom.analyzeBtn.disabled = false;
    }
  }

  /* ---- Score Animation ---- */

  function animateScore(target) {
    var current = 0;
    var frame = 0;
    var totalFrames = 30;
    var step = target / totalFrames;

    dom.scoreDisplay.textContent = '0';

    function tick() {
      frame++;
      if (frame >= totalFrames) {
        dom.scoreDisplay.textContent = target;
        return;
      }
      current = Math.round(step * frame);
      dom.scoreDisplay.textContent = current;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ---- Main Analysis ---- */

  function handleAnalysis() {
    hideError();

    var rawUrl = dom.repoUrlInput.value;
    var error = validateUrl(rawUrl);

    if (error) {
      showError(error);
      return;
    }

    var repoUrl = sanitizeUrl(rawUrl);
    setLoading(true);

    fetch('/api/analyze-repository', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl: repoUrl }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (data) {
            throw new Error(data.error || 'Failed to analyze repository.');
          });
        }
        return response.json();
      })
      .then(function (data) {
        animateScore(data.score);

        /* Dependencies */
        if (data.details && data.details.hasDependencies) {
          dom.depsIcon.innerHTML =
            '<i class="fas fa-check-circle icon-success"></i>';
          dom.depsText.textContent = 'Configured';
        } else {
          dom.depsIcon.innerHTML =
            '<i class="fas fa-times-circle icon-error"></i>';
          dom.depsText.textContent = 'Missing';
        }

        /* Tests */
        if (data.details && data.details.hasTests) {
          dom.testsIcon.innerHTML =
            '<i class="fas fa-check-circle icon-success"></i>';
          dom.testsText.textContent = 'Configured';
        } else {
          dom.testsIcon.innerHTML =
            '<i class="fas fa-times-circle icon-error"></i>';
          dom.testsText.textContent = 'Missing';
        }

        /* Recommendations */
        if (data.recommendations && data.recommendations.length > 0) {
          dom.recommendationsList.innerHTML = data.recommendations
            .map(function (rec) {
              return (
                '<li><i class="fas fa-arrow-right"></i> ' +
                escapeHtml(rec) +
                '</li>'
              );
            })
            .join('');
        } else {
          dom.recommendationsList.innerHTML =
            '<li><i class="fas fa-check-circle" style="color: var(--ra-emerald)"></i> No recommendations needed — your repository looks solid.</li>';
        }

        dom.resultsContainer.classList.add('visible');
      })
      .catch(function (err) {
        console.error('Analysis error:', err);
        showError(err.message || 'An unexpected error occurred.');
      })
      .finally(function () {
        setLoading(false);
      });
  }

  /* ---- Event Wiring ---- */

  dom.analyzeBtn.addEventListener('click', handleAnalysis);

  dom.repoUrlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      dom.analyzeBtn.click();
    }
  });

  dom.errorDismiss.addEventListener('click', hideError);
})();
