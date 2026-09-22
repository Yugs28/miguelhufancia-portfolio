// ===========================================================
// Theme toggle (persisted across all pages)
// ===========================================================
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('portfolio-theme', next);
});

// ===========================================================
// Shared contact rendering (used on every page)
// ===========================================================
function renderContact(container, profile) {
  if (!container || !profile) return;
  container.innerHTML = `
    <a href="mailto:${profile.email}">${profile.email}</a>
    <span class="contact-sep">&middot;</span>
    <a href="${profile.linkedin_url}" target="_blank" rel="noopener">LinkedIn</a>
  `;
}

async function loadProfile() {
  const { data, error } = await supabaseClient.from('profile').select('*').eq('id', 1).single();
  if (error) {
    console.error('Could not load profile:', error);
    return null;
  }
  return data;
}

// ===========================================================
// HOME PAGE (index.html)
// ===========================================================
async function initHomePage() {
  const heroName = document.getElementById('heroName');
  const heroTagline = document.getElementById('heroTagline');
  const homeContact = document.getElementById('homeContact');

  const profile = await loadProfile();
  if (!profile) {
    heroName.textContent = 'Could not load — check your Supabase connection';
    return;
  }
  heroName.textContent = profile.full_name;
  heroTagline.textContent = profile.tagline;
  renderContact(homeContact, profile);
}

// ===========================================================
// STUDENT PAGE (student.html)
// ===========================================================
async function initStudentPage() {
  const pageContact = document.getElementById('pageContact');
  const timelineContainer = document.getElementById('timelineContainer');
  const certGrid = document.getElementById('certGrid');

  const [profile, timelineRes, certsRes] = await Promise.all([
    loadProfile(),
    supabaseClient.from('timeline').select('*').order('sort_order', { ascending: false }),
    supabaseClient.from('certifications').select('*').order('sort_order', { ascending: false }),
  ]);

  renderContact(pageContact, profile);

  // Timeline
  if (timelineRes.error || !timelineRes.data.length) {
    timelineContainer.innerHTML = '<p class="loading-note">No timeline entries yet.</p>';
  } else {
    timelineContainer.innerHTML = timelineRes.data.map(item => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-year">${item.year_range}</span>
          <h3>${item.title}</h3>
          <p class="timeline-school">${item.school}</p>
          <p>${item.description}</p>
        </div>
      </div>
    `).join('');
  }

  // Certifications
  if (certsRes.error || !certsRes.data.length) {
    certGrid.innerHTML = '<p class="loading-note">No certifications added yet.</p>';
  } else {
    certGrid.innerHTML = certsRes.data.map(cert => `
      <div class="cert-card">
        ${cert.image_url ? `<img src="${cert.image_url}" alt="${cert.title} certificate" loading="lazy">` : ''}
        <div class="cert-body">
          <h3>${cert.title}</h3>
          <p class="cert-meta">${[cert.org, cert.date_label].filter(Boolean).join(' &middot; ')}</p>
          ${cert.credential_url ? `<a href="${cert.credential_url}" class="btn-credential" target="_blank" rel="noopener">View credential</a>` : ''}
        </div>
      </div>
    `).join('');
  }
}

// ===========================================================
// DESIGNER PAGE (designer.html)
// ===========================================================
let allProjects = {}; // keyed by id, used by the modal

async function initDesignerPage() {
  const pageContact = document.getElementById('pageContact');
  const arsenalList = document.getElementById('arsenalList');

  const [profile, arsenalRes, projectsRes] = await Promise.all([
    loadProfile(),
    supabaseClient.from('arsenal').select('*').order('sort_order', { ascending: true }),
    supabaseClient.from('projects').select('*').order('sort_order', { ascending: false }),
  ]);

  renderContact(pageContact, profile);

  // Arsenal
  if (arsenalRes.error || !arsenalRes.data.length) {
    arsenalList.innerHTML = '<li class="loading-note">No tools added yet.</li>';
  } else {
    arsenalList.innerHTML = arsenalRes.data.map(item => `<li>${item.name}</li>`).join('');
  }

  // Projects, grouped by category
  const categories = { websites: [], wireframes: [], branding: [] };
  if (!projectsRes.error) {
    projectsRes.data.forEach(p => {
      allProjects[p.id] = p;
      if (categories[p.category]) categories[p.category].push(p);
    });
  }

  Object.entries(categories).forEach(([cat, items]) => {
    const grid = document.getElementById(`cat-${cat}`);
    if (!items.length) {
      grid.innerHTML = '<p class="loading-note">No projects added yet.</p>';
      return;
    }
    grid.innerHTML = items.map(p => {
      const thumb = (p.images && p.images[0]) || '';
      return `
        <button class="card" data-project-id="${p.id}">
          ${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ''}
          <div class="card-body">
            <h3>${p.title}</h3>
            <p>${p.tag}</p>
          </div>
        </button>
      `;
    }).join('');
  });

  initModal();
}

// ===========================================================
// Project detail modal (Designer page only)
// ===========================================================
function initModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const modalTrack = modal.querySelector('.modal-track');
  const modalDots = modal.querySelector('.carousel-dots');
  const modalPrev = modal.querySelector('.carousel-btn.prev');
  const modalNext = modal.querySelector('.carousel-btn.next');
  const modalTitle = modal.querySelector('#modalTitle');
  const modalTag = modal.querySelector('.modal-tag');
  const modalDesc = modal.querySelector('.modal-desc');

  let modalIndex = 0;
  let modalImageCount = 1;

  function openModal(projectId) {
    const project = allProjects[projectId];
    if (!project) return;

    modalTitle.textContent = project.title;
    modalTag.textContent = project.tag;
    modalDesc.textContent = project.description;

    const images = project.images && project.images.length ? project.images : [];
    modalTrack.innerHTML = '';
    modalDots.innerHTML = '';
    images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${project.title} image ${i + 1}`;
      modalTrack.appendChild(img);

      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToModalSlide(i));
      modalDots.appendChild(dot);
    });

    modalImageCount = images.length || 1;
    const multiImage = images.length > 1;
    modalPrev.style.display = multiImage ? 'flex' : 'none';
    modalNext.style.display = multiImage ? 'flex' : 'none';
    modalDots.style.display = multiImage ? 'flex' : 'none';

    goToModalSlide(0);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function goToModalSlide(i) {
    modalIndex = (i + modalImageCount) % modalImageCount;
    modalTrack.style.setProperty('--slide', modalIndex);
    Array.from(modalDots.children).forEach((d, di) => d.classList.toggle('active', di === modalIndex));
  }

  modalPrev.addEventListener('click', () => goToModalSlide(modalIndex - 1));
  modalNext.addEventListener('click', () => goToModalSlide(modalIndex + 1));
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') goToModalSlide(modalIndex - 1);
    if (e.key === 'ArrowRight') goToModalSlide(modalIndex + 1);
  });

  let modalStartX = 0;
  modalTrack.addEventListener('touchstart', (e) => { modalStartX = e.touches[0].clientX; }, { passive: true });
  modalTrack.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - modalStartX;
    if (Math.abs(delta) > 40) delta < 0 ? goToModalSlide(modalIndex + 1) : goToModalSlide(modalIndex - 1);
  }, { passive: true });

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.projectId));
  });
}

// ===========================================================
// Route to the right init function based on which page we're on
// ===========================================================
if (document.getElementById('heroName')) initHomePage();
if (document.getElementById('timelineContainer')) initStudentPage();
if (document.getElementById('arsenalList')) initDesignerPage();