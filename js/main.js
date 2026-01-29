document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTheme();

    // Page-specific initializations
    if (document.getElementById('registration-form')) initRegistration();
    if (document.getElementById('program-grid')) initProgram();
    if (document.getElementById('contact-form')) initContact();
});

/**
 * Initialize Navigation Logic
 */
function initNavigation() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile Toggle
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
    }

    // Active Link Highlighting
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/**
 * Initialize Theme Toggle
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Registration Page Logic
 */
async function initRegistration() {
    const form = document.getElementById('registration-form');
    const countrySelect = document.getElementById('country');
    const downloadBtn = document.getElementById('download-btn');

    // Populate Countries
    try {
        const response = await fetch('data/countries.json');
        const countries = await response.json();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load countries:', error);
    }

    // Form Validation & Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm(form)) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Mailto Fallback
            const subject = encodeURIComponent('REDCap Africa Symposium Registration');
            const body = encodeURIComponent(JSON.stringify(data, null, 2));
            window.location.href = `mailto:support@witsredcap.co.za?subject=${subject}&body=${body}`;

            alert('Opening your email client to send registration...');
        }
    });

    // Download JSON
    downloadBtn.addEventListener('click', () => {
        if (validateForm(form)) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            downloadJSON(data, 'registration.json');
        }
    });
}

/**
 * Program Page Logic
 */
async function initProgram() {
    const grid = document.getElementById('program-grid');
    const filters = document.querySelectorAll('.filter-btn');
    let programData = [];

    try {
        const response = await fetch('data/program.json');
        programData = await response.json();
        renderProgram(programData);
    } catch (error) {
        grid.innerHTML = '<p class="text-center">Failed to load program data.</p>';
        console.error(error);
    }

    // Filtering
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const filteredData = filter === 'all'
                ? programData
                : programData.filter(item => item.track === filter);

            renderProgram(filteredData);
        });
    });
}

function renderProgram(data) {
    const grid = document.getElementById('program-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<p class="text-center">No sessions found for this track.</p>';
        return;
    }

    data.forEach(session => {
        const card = document.createElement('article');
        card.className = 'program-card';
        card.style.cssText = 'background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #eee;';

        card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <span style="background: var(--color-gray-100); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${session.track} | ${session.andience} </span>
        <button class="bookmark-btn" aria-label="Bookmark session" style="background: none; border: none; cursor: pointer; color: #ccc;">
          ★
        </button>
      </div>
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">${session.description}</p>
      <h3 style="margin-bottom: 0.5rem;">${session.focus}</h3>
      <p style="color: var(--color-primary); font-weight: 500; margin-bottom: 0.5rem;">${session.format}</p>
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">${session.outcome}</p>
      <div style="font-size: 0.9rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; justify-content: space-between;">
        <span>${session.day} | ${session.time}</span> <a href="${session.agenda}"><button class="btn" style="background-color:#B00020; color: white;">Agenda</button></a>
      </div>
    `;

        // Bookmark Logic
        const btn = card.querySelector('.bookmark-btn');
        const isBookmarked = localStorage.getItem(`bookmark-${session.id}`);
        if (isBookmarked) btn.style.color = 'var(--color-accent)';

        btn.addEventListener('click', () => {
            if (localStorage.getItem(`bookmark-${session.id}`)) {
                localStorage.removeItem(`bookmark-${session.id}`);
                btn.style.color = '#ccc';
            } else {
                localStorage.setItem(`bookmark-${session.id}`, 'true');
                btn.style.color = 'var(--color-accent)';
            }
        });

        grid.appendChild(card);
    });
}

/**
 * Contact Page Logic
 */
function initContact() {
    const form = document.getElementById('contact-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm(form)) {
            const formData = new FormData(form);
            const subject = encodeURIComponent(formData.get('subject') || 'Contact Inquiry');
            const body = encodeURIComponent(`Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\nMessage:\n${formData.get('message')}`);
            window.location.href = `mailto:support@witsredcap.co.za?subject=${subject}&body=${body}`;
        }
    });
}

/**
 * Utilities
 */
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach(input => {
        const errorId = `${input.id || input.name}-error`;
        const errorEl = document.getElementById(errorId);

        if (!input.value.trim() || (input.type === 'checkbox' && !input.checked)) {
            isValid = false;
            input.style.borderColor = 'var(--color-primary)';
            if (errorEl) errorEl.style.display = 'block';
        } else {
            input.style.borderColor = '#ccc';
            if (errorEl) errorEl.style.display = 'none';
        }
    });

    return isValid;
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
