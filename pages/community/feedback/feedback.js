document.addEventListener("DOMContentLoaded", () => {
  // 1. Session and Authentication Verification
  const sessionNotice = document.getElementById("sessionNotice");

  async function verifySession() {
    try {
      const response = await fetch("/api/session", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          sessionNotice.className = "fb-session-notice fb-authenticated";
          const safeName = window.DOMSanitizer ? window.DOMSanitizer.escapeHtml(data.user.name) : data.user.name;
          const safeEmail = window.DOMSanitizer ? window.DOMSanitizer.escapeHtml(data.user.email) : data.user.email;
          sessionNotice.innerHTML = `Submitting feedback as <strong>${safeName}</strong> (${safeEmail})`;
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check user session:", err);
    }

    // Guest User Fallback
    sessionNotice.className = "fb-session-notice fb-guest";
    sessionNotice.innerHTML = `Submitting as <strong>Guest</strong>. <a href="login.html?next=feedback.html" class="fb-login-link">Login</a> to link this submission with your profile.`;
  }

  verifySession();

  // 2. Interactive Type Pill Selection
  const typePills = document.querySelectorAll(".fb-type-pill");
  const hiddenInput = document.getElementById("selectedFeedbackType");

  typePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      selectTypePill(pill);
    });

    pill.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectTypePill(pill);
      }
    });
  });

  function selectTypePill(selectedPill) {
    typePills.forEach((p) => {
      p.classList.remove("fb-selected");
      p.setAttribute("aria-checked", "false");
    });

    selectedPill.classList.add("fb-selected");
    selectedPill.setAttribute("aria-checked", "true");
    hiddenInput.value = selectedPill.dataset.value;

    // Remove invalid style from type field
    selectedPill.closest(".fb-field").classList.remove("fb-invalid");
  }

  // 3. Textarea Character Counter
  const messageTextarea = document.getElementById("message");
  const charCounter = document.getElementById("charCounter");

  messageTextarea.addEventListener("input", () => {
    const len = messageTextarea.value.length;
    charCounter.textContent = `${len} / 1000`;

    if (len >= 10 && len <= 1000) {
      messageTextarea.closest(".fb-field").classList.remove("fb-invalid");
    }
  });

  // Clear invalid style from subject input
  const subjectInput = document.getElementById("subject");
  subjectInput.addEventListener("input", () => {
    if (subjectInput.value.trim().length >= 3) {
      subjectInput.closest(".fb-field").classList.remove("fb-invalid");
    }
  });

  // 4. Form Validation & Submission
  const feedbackForm = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".fb-btn-text");
  const btnLoader = submitBtn.querySelector(".fb-btn-loader");
  const submitMessage = document.getElementById("formSubmitMessage");

  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    // Validate type pill selection
    if (!hiddenInput.value) {
      hiddenInput.closest(".fb-field").classList.add("fb-invalid");
      isValid = false;
    } else {
      hiddenInput.closest(".fb-field").classList.remove("fb-invalid");
    }

    // Validate subject length (min 3 chars)
    if (subjectInput.value.trim().length < 3) {
      subjectInput.closest(".fb-field").classList.add("fb-invalid");
      isValid = false;
    } else {
      subjectInput.closest(".fb-field").classList.remove("fb-invalid");
    }

    // Validate message details (min 10 chars)
    if (messageTextarea.value.trim().length < 10) {
      messageTextarea.closest(".fb-field").classList.add("fb-invalid");
      isValid = false;
    } else {
      messageTextarea.closest(".fb-field").classList.remove("fb-invalid");
    }

    if (!isValid) {
      const firstInvalid = feedbackForm.querySelector(".fb-field.fb-invalid");
      if (firstInvalid) {
        const input = firstInvalid.querySelector("input, textarea, .fb-type-pill");
        if (input) input.focus();
      }
      return;
    }

    // Transition to loading state
    submitBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    submitMessage.classList.add("hidden");
    submitMessage.textContent = "";

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackType: hiddenInput.value,
          subject: subjectInput.value.trim(),
          message: messageTextarea.value.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An error occurred while submitting feedback.");
      }

      // Submission Success
      showSuccessModal();
    } catch (err) {
      console.error("Feedback submission error:", err);
      submitMessage.textContent = err.message || "Failed to submit feedback. Please try again later.";
      submitMessage.className = "fb-submit-message";

      // Reset loading state
      submitBtn.disabled = false;
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }
  });

  // 5. Success Modal Interaction
  const successModalOverlay = document.getElementById("successModalOverlay");
  const successModalCloseBtn = document.getElementById("successModalCloseBtn");

  function showSuccessModal() {
    successModalOverlay.classList.remove("hidden");
    successModalCloseBtn.focus();
  }

  successModalCloseBtn.addEventListener("click", () => {
    successModalOverlay.classList.add("hidden");
    feedbackForm.reset();

    // Reset Type Pills
    typePills.forEach((p) => {
      p.classList.remove("fb-selected");
      p.setAttribute("aria-checked", "false");
    });
    hiddenInput.value = "";
    charCounter.textContent = "0 / 1000";

    // Reset button states
    submitBtn.disabled = false;
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");

    // Redirect to home page
    window.location.href = "index.html";
  });
});
