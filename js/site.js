// ===========================================================
// Theme toggle
// ===========================================================

const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('portfolio-theme');

if (savedTheme) {
  root.setAttribute('data-theme', savedTheme);
}

themeToggle?.addEventListener('click', () => {
  const nextTheme =
    root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

  root.setAttribute('data-theme', nextTheme);
  localStorage.setItem('portfolio-theme', nextTheme);
});

// ===========================================================
// Helpers
// ===========================================================

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sortByOrder(items = []) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'MH';
}

function renderContact(container, profile) {
  if (!container || !profile) return;

  const email = profile.email?.trim();
  const linkedin = profile.linkedin_url?.trim();

  const links = [];

  if (email) {
    links.push(
      `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
    );
  }

  if (linkedin) {
    links.push(
      `<a href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
    );
  }

  container.innerHTML = links.join('<span class="contact-sep">·</span>');
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from('profile')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Could not load profile:', error);
    return null;
  }

  return data;
}

// ===========================================================
// HOME PAGE
// ===========================================================

async function initHomePage() {
  const heroName = document.getElementById('heroName');
  const heroTagline = document.getElementById('heroTagline');
  const profileImage = document.getElementById('profileImage');
  const profileInitials = document.getElementById('profileInitials');
  const emailLink = document.getElementById('emailLink');
  const linkedinLink = document.getElementById('linkedinLink');

  const profile = await loadProfile();

  if (!profile) {
    heroName.textContent = 'Could not load portfolio';
    return;
  }

  heroName.textContent = profile.full_name;
  heroTagline.textContent = profile.tagline;
  profileInitials.textContent = getInitials(profile.full_name);

  if (profile.profile_image_url) {
    profileImage.src = profile.profile_image_url;
    profileImage.alt = profile.full_name;
    profileImage.hidden = false;
    profileInitials.hidden = true;
  }

  if (profile.email) {
    emailLink.href = `mailto:${profile.email}`;
  } else {
    emailLink.hidden = true;
  }

  if (profile.linkedin_url) {
    linkedinLink.href = profile.linkedin_url;
  } else {
    linkedinLink.hidden = true;
  }
}

// ===========================================================
// STUDENT PAGE
// ===========================================================

function renderStudentSkills(skills, category, container) {
  if (!container) return;

  const categorySkills = skills.filter((skill) => skill.category === category);

  if (!categorySkills.length) {
    container.innerHTML = '<p class="loading-note">No skills added yet.</p>';
    return;
  }

  container.innerHTML = categorySkills
    .map(
      (skill) => `
        <article class="skill-card">
          <p>${escapeHtml(skill.name)}</p>
        </article>
      `
    )
    .join('');
}

function renderTimeline(timeline, container) {
  if (!container) return;

  if (!timeline.length) {
    container.innerHTML = '<p class="loading-note">No timeline entries yet.</p>';
    return;
  }

  container.innerHTML = timeline
    .map((item) => {
      const images = sortByOrder(item.timeline_images || []);

      const imageHtml = images.length
        ? `
          <div class="timeline-image-list">
            ${images
              .map(
                (image) => `
                  <img
                    src="${escapeHtml(image.image_url)}"
                    alt="${escapeHtml(image.alt_text || item.title)}"
                    loading="lazy"
                  >
                `
              )
              .join('')}
          </div>
        `
        : '';

      return `
        <article class="timeline-item">
          <div class="timeline-dot" aria-hidden="true"></div>

          <div class="timeline-content">
            <span class="timeline-year">${escapeHtml(item.year_range)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            ${item.school ? `<p class="timeline-school">${escapeHtml(item.school)}</p>` : ''}
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
            ${imageHtml}
          </div>
        </article>
      `;
    })
    .join('');
}

function renderCertificates(certificates, container) {
  if (!container) return;

  if (!certificates.length) {
    container.innerHTML =
      '<p class="loading-note">No certificates added yet.</p>';
    return;
  }

  container.innerHTML = certificates
    .map((certificate) => {
      const images = sortByOrder(certificate.certificate_images || []);
      const firstImage = images[0];

      const meta = [certificate.organization, certificate.date_label]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' · ');

      return `
        <article class="cert-card">
          ${
            firstImage
              ? `
                <img
                  src="${escapeHtml(firstImage.image_url)}"
                  alt="${escapeHtml(firstImage.alt_text || certificate.title)}"
                  loading="lazy"
                >
              `
              : ''
          }

          <div class="cert-body">
            <h3>${escapeHtml(certificate.title)}</h3>
            ${meta ? `<p class="cert-meta">${meta}</p>` : ''}
            ${
              certificate.description
                ? `<p>${escapeHtml(certificate.description)}</p>`
                : ''
            }
            ${
              certificate.credential_url
                ? `
                  <a
                    href="${escapeHtml(certificate.credential_url)}"
                    class="btn-credential"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View credential
                  </a>
                `
                : ''
            }
          </div>
        </article>
      `;
    })
    .join('');
}

async function initStudentPage() {
  const studentDescription = document.getElementById('studentDescription');
  const softSkillsGrid = document.getElementById('softSkillsGrid');
  const otherSkillsGrid = document.getElementById('otherSkillsGrid');
  const timelineContainer = document.getElementById('timelineContainer');
  const certGrid = document.getElementById('certGrid');
  const pageContact = document.getElementById('pageContact');

  const [profile, skillsRes, timelineRes, certificatesRes] = await Promise.all([
    loadProfile(),
    supabaseClient
      .from('skills')
      .select('*')
      .eq('page', 'student')
      .order('sort_order', { ascending: true }),
    supabaseClient
      .from('timeline')
      .select('*, timeline_images(*)')
      .order('sort_order', { ascending: false }),
    supabaseClient
      .from('certifications')
      .select('*, certificate_images(*)')
      .order('sort_order', { ascending: false }),
  ]);

  if (profile) {
    studentDescription.textContent = profile.student_description;
    renderContact(pageContact, profile);
  }

  const skills = skillsRes.data || [];
  renderStudentSkills(skills, 'soft_skills', softSkillsGrid);
  renderStudentSkills(skills, 'other_skills', otherSkillsGrid);
  renderTimeline(timelineRes.data || [], timelineContainer);
  renderCertificates(certificatesRes.data || [], certGrid);
}

// ===========================================================
// DESIGNER PAGE
// ===========================================================

const allProjects = {};

function renderArsenalSkills(skills, category, container) {
  if (!container) return;

  const categorySkills = skills.filter((skill) => skill.category === category);

  if (!categorySkills.length) {
    container.innerHTML = '<li class="loading-note">No skills added yet.</li>';
    return;
  }

  container.innerHTML = categorySkills
    .map((skill) => `<li>${escapeHtml(skill.name)}</li>`)
    .join('');
}

function renderProjectCategory(projects, category) {
  const grid = document.getElementById(`cat-${category}`);
  if (!grid) return;

  const items = projects.filter((project) => project.category === category);

  if (!items.length) {
    grid.innerHTML = '<p class="loading-note">No projects added yet.</p>';
    return;
  }

  grid.innerHTML = items
    .map((project) => {
      const images = sortByOrder(project.project_images || []);
      const thumbnail = images[0];

      return `
        <button class="card" type="button" data-project-id="${project.id}">
          ${
            thumbnail
              ? `
                <img
                  src="${escapeHtml(thumbnail.image_url)}"
                  alt=""
                  loading="lazy"
                >
              `
              : '<div class="card-image-placeholder">No preview available</div>'
          }

          <span class="card-body">
            <span class="card-title">${escapeHtml(project.title)}</span>
            ${
              project.subtitle
                ? `<span class="card-subtitle">${escapeHtml(project.subtitle)}</span>`
                : ''
            }
          </span>
        </button>
      `;
    })
    .join('');
}

async function initDesignerPage() {
  const designerDescription = document.getElementById('designerDescription');
  const programmingSkills = document.getElementById('programmingSkills');
  const designSkills = document.getElementById('designSkills');
  const professionalSkills = document.getElementById('professionalSkills');
  const pageContact = document.getElementById('pageContact');

  const [profile, skillsRes, projectsRes] = await Promise.all([
    loadProfile(),
    supabaseClient
      .from('skills')
      .select('*')
      .eq('page', 'designer')
      .order('sort_order', { ascending: true }),
    supabaseClient
      .from('projects')
      .select('*, project_images(*)')
      .order('sort_order', { ascending: false }),
  ]);

  if (profile) {
    designerDescription.textContent = profile.designer_description;
    renderContact(pageContact, profile);
  }

  const skills = skillsRes.data || [];
  renderArsenalSkills(skills, 'programming', programmingSkills);
  renderArsenalSkills(skills, 'design', designSkills);
  renderArsenalSkills(skills, 'professional_skills', professionalSkills);

  const projects = projectsRes.data || [];

  projects.forEach((project) => {
    allProjects[project.id] = project;
  });

  [
    'websites',
    'ui_ux_designs',
    'branding',
    'other_creatives',
  ].forEach((category) => renderProjectCategory(projects, category));

  initModal();
}

// ===========================================================
// PROJECT MODAL + IMAGE CAROUSEL
// ===========================================================

function initModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const track = document.getElementById('modalTrack');
  const dots = document.getElementById('carouselDots');
  const previousButton = modal.querySelector('.carousel-btn.prev');
  const nextButton = modal.querySelector('.carousel-btn.next');

  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalRole = document.getElementById('modalRole');
  const modalTools = document.getElementById('modalTools');
  const modalRoleWrap = document.getElementById('modalRoleWrap');
  const modalToolsWrap = document.getElementById('modalToolsWrap');
  const modalProjectLink = document.getElementById('modalProjectLink');

  let currentIndex = 0;
  let imageCount = 0;
  let lastFocusedCard = null;

  function changeSlide(index) {
    if (!imageCount) return;

    currentIndex = (index + imageCount) % imageCount;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === currentIndex);
    });
  }

  function openModal(projectId, sourceCard) {
    const project = allProjects[projectId];
    if (!project) return;

    lastFocusedCard = sourceCard;
    const images = sortByOrder(project.project_images || []);

    modalCategory.textContent = project.category.replaceAll('_', ' ');
    modalTitle.textContent = project.title;
    modalSubtitle.textContent = project.subtitle || '';
    modalDescription.textContent = project.description || '';

    modalRole.textContent = project.role || '';
    modalTools.textContent = project.tools || '';
    modalRoleWrap.hidden = !project.role;
    modalToolsWrap.hidden = !project.tools;

    if (project.project_url) {
      modalProjectLink.href = project.project_url;
      modalProjectLink.hidden = false;
    } else {
      modalProjectLink.hidden = true;
    }

    track.innerHTML = '';
    dots.innerHTML = '';

    if (images.length) {
      images.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const imageElement = document.createElement('img');
        imageElement.src = image.image_url;
        imageElement.alt = image.alt_text || `${project.title} image ${index + 1}`;
        imageElement.loading = 'lazy';

        slide.appendChild(imageElement);
        track.appendChild(slide);

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show image ${index + 1}`);
        dot.addEventListener('click', () => changeSlide(index));
        dots.appendChild(dot);
      });
    } else {
      track.innerHTML =
        '<div class="carousel-slide carousel-empty">No project images added yet.</div>';
    }

    imageCount = images.length || 1;
    const hasMultipleImages = images.length > 1;

    previousButton.hidden = !hasMultipleImages;
    nextButton.hidden = !hasMultipleImages;
    dots.hidden = !hasMultipleImages;

    changeSlide(0);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocusedCard?.focus();
  }

  previousButton.addEventListener('click', () => changeSlide(currentIndex - 1));
  nextButton.addEventListener('click', () => changeSlide(currentIndex + 1));

  modal.querySelectorAll('[data-close]').forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('open')) return;

    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') changeSlide(currentIndex - 1);
    if (event.key === 'ArrowRight') changeSlide(currentIndex + 1);
  });

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      openModal(card.dataset.projectId, card);
    });
  });
}

// ===========================================================
// Start the correct page
// ===========================================================

if (document.getElementById('heroName')) initHomePage();
if (document.getElementById('timelineContainer')) initStudentPage();
if (document.getElementById('programmingSkills')) initDesignerPage();