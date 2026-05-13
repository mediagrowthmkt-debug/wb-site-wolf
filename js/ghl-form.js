/**
 * ghl-form.js — Wolf Carpenters
 * Submits all site forms to GHL via submit-form.php (Hostinger).
 * Source is always set to "site" server-side.
 *
 * Handles:
 *   - form[data-feedback]   → quote modal (index.html)
 *   - #contactForm          → contact.html
 *   - #serviceContactForm   → services/*.html
 */

(function () {
  'use strict';

  const ENDPOINT = '/submit-form.php';

  /* ── Helpers ──────────────────────────────────────────── */

  function getVal(form, name) {
    return (form.querySelector(`[name="${name}"]`)?.value || '').trim();
  }

  function showErr(input, msg) {
    // Try next sibling .form-error, or any [id$="_error"] near the input
    const sibling = input?.nextElementSibling;
    if (sibling && sibling.classList.contains('form-error')) {
      sibling.textContent = msg;
    }
  }

  function clearErrs(form) {
    form.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
  }

  async function sendToGHL(form) {
    const payload = {
      name:    getVal(form, 'name'),
      email:   getVal(form, 'email'),
      phone:   getVal(form, 'phone'),
      service: getVal(form, 'service'),
      message: getVal(form, 'message'),
      address: getVal(form, 'address'),
      source:  'site',
    };

    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Server ${res.status}`);
    return res.json();
  }

  function setBtn(btn, html, disabled) {
    if (!btn) return;
    btn.disabled  = disabled;
    btn.innerHTML = html;
  }

  /* ── Service page form (#serviceContactForm) ──────────── */
  // Each service page uses a unique prefix (br_, cr_, gc_, hr_, kr_)
  // but all inputs share the same name="" attributes.
  // Validation uses the .form-error sibling of each input.

  function initServiceForm() {
    const form = document.getElementById('serviceContactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrs(form);

      let valid = true;

      const nameEl  = form.querySelector('[name="name"]');
      const emailEl = form.querySelector('[name="email"]');
      const msgEl   = form.querySelector('[name="message"]');

      if (!nameEl?.value.trim()) {
        showErr(nameEl, 'Please enter your name.');
        valid = false;
      }
      if (!emailEl?.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        showErr(emailEl, 'Please enter a valid email address.');
        valid = false;
      }
      if (!msgEl?.value.trim()) {
        showErr(msgEl, 'Please describe your project.');
        valid = false;
      }

      if (!valid) return;

      const btn  = form.querySelector('button[type="submit"]');
      const orig = btn?.innerHTML;
      setBtn(btn, 'Sending&hellip;', true);

      try {
        await sendToGHL(form);
        // Find the success element: first [id$="_form_success"] or fallback
        const success = form.querySelector('[id$="_form_success"]') ||
                        document.getElementById('br_form_success');
        if (success) success.style.display = 'block';
        form.reset();
        setBtn(btn, orig, false);
      } catch {
        setBtn(btn, orig, false);
      }
    });
  }

  /* ── Contact page form (#contactForm) ─────────────────── */

  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn  = form.querySelector('button[type="submit"]');
      const orig = btn?.innerHTML;
      setBtn(btn, 'Sending&hellip;', true);

      try {
        await sendToGHL(form);
        const success = document.getElementById('contact-success');
        if (success) {
          success.style.display = 'flex';
          setTimeout(() => (success.style.display = 'none'), 6000);
        }
        form.reset();
        setBtn(btn, orig, false);
      } catch {
        setBtn(btn, orig, false);
      }
    });
  }

  /* ── Quote modal form (data-feedback, no specific id) ──── */

  function initFeedbackForms() {
    document.querySelectorAll('form[data-feedback]').forEach((form) => {
      if (form.id === 'contactForm' || form.id === 'serviceContactForm') return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn  = form.querySelector('button[type="submit"]');
        const orig = btn?.innerHTML;
        setBtn(btn, 'Sending&hellip;', true);

        try {
          await sendToGHL(form);
          const feedbackId = form.dataset.feedback;
          const msg = (feedbackId && document.getElementById(feedbackId))
            || form.querySelector('.form-success');
          if (msg) {
            msg.style.display = 'block';
            setTimeout(() => (msg.style.display = 'none'), 6000);
          }
          form.reset();
          setBtn(btn, orig, false);
        } catch {
          setBtn(btn, orig, false);
        }
      });
    });
  }

  /* ── Boot ─────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    initFeedbackForms();
    initContactForm();
    initServiceForm();
  });

})();
