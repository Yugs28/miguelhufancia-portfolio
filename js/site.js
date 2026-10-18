// ===========================================================
// Config: documents (upload PDFs into /public/files/ with these names)
// ===========================================================
const DOCUMENTS = [
  { key: 'resume', label: 'Resume', file: 'files/resume.pdf' },
  { key: 'cv', label: 'CV', file: 'files/cv.pdf' },
];

// ===========================================================
// Helpers
// ===========================================================
const root = document.documentElement;
const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function sortByOrder(items = []) { return [...items].sort((a, b) => a.sort_order - b.sort_order); }
function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'MH';
}
function prettyCategory(key = '') {
  const map = { ui_ux_designs: 'UI/UX designs', other_creatives: 'Other creatives' };
  if (map[key]) return map[key];
  const t = key.replaceAll('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function safeUrl(url = '') {
  const v = String(url).trim();
  return /^(https?:|mailto:)/i.test(v) ? v : '';
}

const ICONS = {
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13Zm2 .32v.38L12 11l7-4.8v-.38A.5.5 0 0 0 18.5 5h-13a.5.5 0 0 0-.5.82ZM19 8.57l-6.46 4.18a1 1 0 0 1-1.08 0L5 8.57v9.93c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5V8.57Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.94 8.5A1.94 1.94 0 1 0 6.94 4.62 1.94 1.94 0 0 0 6.94 8.5ZM5.25 9.94h3.38V20H5.25V9.94ZM10.75 9.94H14v1.38h.05c.45-.86 1.56-1.76 3.2-1.76 3.43 0 4.07 2.26 4.07 5.2V20h-3.37v-4.65c0-1.1-.02-2.53-1.54-2.53-1.54 0-1.78 1.2-1.78 2.45V20h-3.38V9.94Z"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4a2 2 0 0 0-.59-1.41l-4.4-4.4A2 2 0 0 0 12.6 2H7Zm5 1.8L17.2 9H13a1 1 0 0 1-1-1V3.8ZM8 13h8v2H8v-2Zm0 4h6v2H8v-2Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3a2 2 0 0 0-2 2v1H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9Zm0 2h9v11H9V5Z"/></svg>',
};

let scrollLocks = 0;
function lockScroll() { scrollLocks++; document.body.classList.add('modal-open'); }
function unlockScroll() { scrollLocks = Math.max(0, scrollLocks - 1); if (!scrollLocks) document.body.classList.remove('modal-open'); }

let toastTimer;
function showToast(message) {
  const t = $('toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

async function copyText(text, okMessage) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) { /* ignore */ }
    ta.remove();
  }
  showToast(okMessage);
}

// ===========================================================
// Theme
// ===========================================================
$('themeToggle')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('portfolio-theme', next); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = next === 'dark' ? '#07070b' : '#ffffff';
});

// ===========================================================
// Header: scroll state, progress, back-to-top, dropdown menu
// ===========================================================
const header = $('siteHeader');
const nav = $('siteNav');
const menuToggle = $('menuToggle');

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('scrollProgress').style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  $('toTop').hidden = y < 700;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
$('toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

function setMenu(open) {
  nav.classList.toggle('open', open);
  $('navScrim').classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  $('menuText').textContent = open ? 'Close' : 'Menu';
}
const menuIsOpen = () => nav.classList.contains('open');
menuToggle.addEventListener('click', () => setMenu(!menuIsOpen()));
$('navScrim').addEventListener('click', () => setMenu(false));
nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
document.addEventListener('click', (e) => {
  if (menuIsOpen() && !e.target.closest('.site-header')) setMenu(false);
});
window.addEventListener('resize', () => { if (window.innerWidth > 960 && menuIsOpen()) setMenu(false); });

function observeSections() {
  const links = [...nav.querySelectorAll('[data-nav]')];
  const sections = links.map((l) => document.getElementById(l.dataset.nav)).filter((s) => s && !s.hidden);
  // hide menu links for sections that have no content
  links.forEach((l) => {
    const s = document.getElementById(l.dataset.nav);
    l.hidden = !s || s.hidden;
  });
  // renumber visible links
  links.filter((l) => !l.hidden).forEach((l, i) => {
    l.querySelector('.nav-num').textContent = String(i + 1).padStart(2, '0');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => {
        const on = l.dataset.nav === entry.target.id;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

function observeReveals() {
  const items = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || reduceMotion) { items.forEach((i) => i.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((i) => io.observe(i));
}

// ===========================================================
// State
// ===========================================================
const projectsById = {};
let projectList = [];
let visibleProjects = [];
let activeFilter = 'all';
let searchQuery = '';
let availableDocs = [];
let profileData = null;
const viewerGroups = {};

// ===========================================================
// Documents (resume / CV)
// ===========================================================
async function detectDocuments() {
  if (location.protocol === 'file:') return DOCUMENTS;
  const found = await Promise.all(DOCUMENTS.map(async (d) => {
    try {
      const r = await fetch(d.file, { method: 'HEAD', cache: 'no-store' });
      const type = r.headers.get('content-type') || '';
      return r.ok && !/text\/html/i.test(type) ? d : null;
    } catch (e) { return null; }
  }));
  return found.filter(Boolean);
}

function renderDocuments() {
  if (!availableDocs.length) return;

  $('heroDocs').innerHTML = availableDocs
    .map((d) => `<button type="button" class="btn btn-ghost" data-doc="${d.key}">${ICONS.doc}<span>${d.label}</span></button>`)
    .join('');

  $('docGrid').innerHTML = availableDocs.map((d) => `
    <article class="doc-card reveal">
      <span class="doc-icon" aria-hidden="true">${ICONS.doc}</span>
      <div class="doc-meta">
        <h3>${d.label}</h3>
        <p>PDF document</p>
      </div>
      <div class="doc-actions">
        <button type="button" class="btn btn-primary btn-sm" data-doc="${d.key}">View ${d.label}</button>
        <a class="btn btn-ghost btn-sm" href="${d.file}" download>Download</a>
      </div>
    </article>`).join('');
  $('docGrid').hidden = false;
  $('resume').hidden = false;
}

const docModal = $('docModal');
let docReturn = null;
function openDoc(key) {
  const d = DOCUMENTS.find((x) => x.key === key);
  if (!d) return;
  docReturn = document.activeElement;
  $('docTitle').textContent = d.label;
  $('docOpen').href = d.file;
  $('docDownload').href = d.file;
  $('docFrame').src = `${d.file}#view=FitH`;
  docModal.classList.add('open');
  docModal.setAttribute('aria-hidden', 'false');
  lockScroll();
  docModal.querySelector('.modal-close').focus();
}
function closeDoc() {
  if (!docModal.classList.contains('open')) return;
  docModal.classList.remove('open');
  docModal.setAttribute('aria-hidden', 'true');
  $('docFrame').src = 'about:blank';
  unlockScroll();
  docReturn?.focus?.();
}
docModal.querySelectorAll('[data-close-doc]').forEach((el) => el.addEventListener('click', closeDoc));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-doc]');
  if (b) openDoc(b.dataset.doc);
});

// ===========================================================
// Hero, contact, nav extras
// ===========================================================
function animateCount(el, to) {
  if (reduceMotion || to < 2) { el.textContent = to; return; }
  const start = performance.now();
  const dur = 900;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderProfile(profile) {
  const name = profile.full_name || 'Miguel Hufancia';
  $('heroName').textContent = name;
  $('brandName').textContent = name;
  $('heroTagline').textContent = profile.tagline || '';
  $('profileInitials').textContent = getInitials(name);
  $('footerText').innerHTML = `© ${new Date().getFullYear()} ${escapeHtml(name)}`;
  document.title = `${name} — UI/UX Designer & IT Student`;

  if (profile.profile_image_url) {
    const img = $('profileImage');
    img.src = profile.profile_image_url;
    img.alt = name;
    img.hidden = false;
    $('profileInitials').hidden = true;
  }
}

function renderContact(profile) {
  const name = profile?.full_name || 'Miguel Hufancia';
  const email = (profile?.email || '').trim();
  const linkedin = safeUrl(profile?.linkedin_url || '');
  const mailto = email ? `mailto:${email}?subject=${encodeURIComponent('Opportunity for ' + name)}` : '';

  if (mailto) {
    $('heroEmail').href = mailto;
    $('heroEmail').textContent = 'Email me';
    $('headerCta').href = mailto;
  }

  const actions = [];
  if (email) {
    actions.push(`<a class="btn btn-light" href="${escapeHtml(mailto)}">${ICONS.mail}<span>${escapeHtml(email)}</span></a>`);
    actions.push(`<button class="btn btn-outline-light" type="button" id="copyEmail">${ICONS.copy}<span>Copy email</span></button>`);
  }
  if (linkedin) actions.push(`<a class="btn btn-outline-light" href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer">${ICONS.linkedin}<span>LinkedIn</span></a>`);
  availableDocs.forEach((d) => actions.push(`<button class="btn btn-outline-light" type="button" data-doc="${d.key}">${ICONS.doc}<span>${d.label}</span></button>`));
  $('contactActions').innerHTML = actions.join('');
  $('copyEmail')?.addEventListener('click', () => copyText(email, 'Email address copied'));

  const extra = [];
  if (mailto) extra.push(`<a class="btn btn-primary" href="${escapeHtml(mailto)}">Let’s talk</a>`);
  availableDocs.forEach((d) => extra.push(`<button class="btn btn-ghost" type="button" data-doc="${d.key}">${d.label}</button>`));
  if (linkedin) extra.push(`<a class="btn btn-ghost" href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`);
  $('navExtra').innerHTML = extra.join('');
}

function renderAbout(profile) {
  const blocks = [];
  if (profile.designer_description) blocks.push(`<article class="about-card reveal"><span class="about-icon" aria-hidden="true">✦</span><h3>As a designer</h3><p>${escapeHtml(profile.designer_description)}</p></article>`);
  if (profile.student_description) blocks.push(`<article class="about-card reveal"><span class="about-icon" aria-hidden="true">✧</span><h3>As a student</h3><p>${escapeHtml(profile.student_description)}</p></article>`);
  if (!blocks.length) return;
  $('aboutGrid').innerHTML = blocks.join('');
  $('about').hidden = false;
}

function renderHeroExtras(skills) {
  // rotating categories
  const cats = [...new Set(projectList.map((p) => p.category))];
  if (cats.length) {
    const words = cats.map((c) => {
      const t = prettyCategory(c);
      return t.startsWith('UI') ? t : t.charAt(0).toLowerCase() + t.slice(1);
    });
    $('heroRole').hidden = false;
    const el = $('rotator');
    let i = 0;
    el.textContent = words[0];
    if (words.length > 1 && !reduceMotion) {
      setInterval(() => {
        el.classList.add('out');
        setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove('out'); }, 260);
      }, 2400);
    }
  }

  // stats from real data
  const stats = [];
  if (projectList.length) stats.push([projectList.length, projectList.length === 1 ? 'Project' : 'Projects']);
  if (cats.length > 1) stats.push([cats.length, 'Categories']);
  if (skills.length) stats.push([skills.length, 'Skills & tools']);
  if (stats.length) {
    $('heroStats').innerHTML = stats.map(([n, l]) => `<li><strong data-count="${n}">0</strong><span>${l}</span></li>`).join('');
    $('heroStats').hidden = false;
    $('heroStats').querySelectorAll('[data-count]').forEach((el) => animateCount(el, Number(el.dataset.count)));
  }

  // floating chips around the photo + marquee
  const design = skills.filter((s) => s.category === 'design').slice(0, 3);
  $('floatChips').innerHTML = design.map((s, i) => `<span class="float-chip c${i + 1}">${escapeHtml(s.name)}</span>`).join('');

  const marqueeItems = skills.filter((s) => ['design', 'programming'].includes(s.category)).map((s) => s.name);
  if (marqueeItems.length >= 3) {
    const row = marqueeItems.map((n) => `<span>${escapeHtml(n)}</span><i>✦</i>`).join('');
    $('marqueeTrack').innerHTML = row + row + row + row;
    $('marquee').hidden = false;
  }
}

// ===========================================================
// Skills (chips link to projects that use them)
// ===========================================================
const SKILL_GROUPS = [
  { key: 'design', title: 'Design' },
  { key: 'programming', title: 'Programming' },
  { key: 'professional_skills', title: 'Professional skills' },
  { key: 'soft_skills', title: 'Soft skills' },
  { key: 'other_skills', title: 'Other skills' },
];

function projectsUsing(name) {
  const n = name.toLowerCase();
  return projectList.filter((p) => [p.title, p.subtitle, p.description, p.role, p.tools].join(' ').toLowerCase().includes(n));
}

function renderSkills(skills) {
  let anyLink = false;
  const html = SKILL_GROUPS.map((g) => {
    const items = skills.filter((s) => s.category === g.key);
    if (!items.length) return '';
    const chips = items.map((s) => {
      const n = projectsUsing(s.name).length;
      if (n) {
        anyLink = true;
        return `<li><button type="button" class="chip chip-link" data-skill="${escapeHtml(s.name)}" aria-label="${escapeHtml(s.name)}: show ${n} ${n === 1 ? 'project' : 'projects'}">${escapeHtml(s.name)}<em>${n}</em></button></li>`;
      }
      return `<li><span class="chip">${escapeHtml(s.name)}</span></li>`;
    }).join('');
    return `<article class="skill-group reveal"><h3>${g.title}</h3><ul class="chip-list">${chips}</ul></article>`;
  }).join('');
  if (!html) return;
  $('skillsGrid').innerHTML = html;
  $('skillsIntro').hidden = !anyLink;
  $('skills').hidden = false;
}

$('skillsGrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-skill]');
  if (!b) return;
  activeFilter = 'all';
  setSearch(b.dataset.skill);
  renderFilters();
  document.getElementById('work').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});

// ===========================================================
// Resume: timeline + certificates (images open in the viewer)
// ===========================================================
function renderTimeline(timeline) {
  if (!timeline.length) return;
  $('timelineContainer').innerHTML = timeline.map((item) => {
    const images = sortByOrder(item.timeline_images || []);
    const gid = `tl-${item.id}`;
    viewerGroups[gid] = images.map((img) => ({ src: img.image_url, alt: img.alt_text || item.title }));
    const imageHtml = images.length
      ? `<div class="timeline-image-list">${images.map((img, i) => `
          <button type="button" class="zoomable" data-group="${gid}" data-index="${i}" aria-label="Enlarge image: ${escapeHtml(img.alt_text || item.title)}">
            <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.alt_text || item.title)}" loading="lazy">
          </button>`).join('')}</div>` : '';
    return `
      <article class="timeline-item reveal">
        <div class="timeline-dot" aria-hidden="true"></div>
        <div class="timeline-content">
          <span class="timeline-year">${escapeHtml(item.year_range)}</span>
          <h4>${escapeHtml(item.title)}</h4>
          ${item.school ? `<p class="timeline-school">${escapeHtml(item.school)}</p>` : ''}
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
          ${imageHtml}
        </div>
      </article>`;
  }).join('');
  $('timelineCol').hidden = false;
  $('resume').hidden = false;
}

function renderCertificates(certificates) {
  if (!certificates.length) return;
  $('certGrid').innerHTML = certificates.map((cert) => {
    const images = sortByOrder(cert.certificate_images || []);
    const gid = `ct-${cert.id}`;
    viewerGroups[gid] = images.map((img) => ({ src: img.image_url, alt: img.alt_text || cert.title }));
    const first = images[0];
    const meta = [cert.organization, cert.date_label].filter(Boolean).map(escapeHtml).join(' · ');
    const link = safeUrl(cert.credential_url || '');
    return `
      <article class="cert-card reveal">
        ${first ? `
          <button type="button" class="zoomable cert-thumb" data-group="${gid}" data-index="0" aria-label="Enlarge certificate: ${escapeHtml(cert.title)}">
            <img src="${escapeHtml(first.image_url)}" alt="${escapeHtml(first.alt_text || cert.title)}" loading="lazy">
            ${images.length > 1 ? `<span class="thumb-badge">${images.length}</span>` : ''}
          </button>` : ''}
        <div class="cert-body">
          <h4>${escapeHtml(cert.title)}</h4>
          ${meta ? `<p class="cert-meta">${meta}</p>` : ''}
          ${cert.description ? `<p>${escapeHtml(cert.description)}</p>` : ''}
          ${link ? `<a href="${escapeHtml(link)}" class="text-link" target="_blank" rel="noopener noreferrer">View credential ↗</a>` : ''}
        </div>
      </article>`;
  }).join('');
  $('certCol').hidden = false;
  $('resume').hidden = false;
}

// ===========================================================
// Projects: filters, search, grid
// ===========================================================
const CATEGORY_ORDER = ['websites', 'ui_ux_designs', 'branding', 'other_creatives'];

function renderFilters() {
  const bar = $('filterBar');
  const counts = {};
  projectList.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  const cats = [...CATEGORY_ORDER.filter((c) => counts[c]), ...Object.keys(counts).filter((c) => !CATEGORY_ORDER.includes(c))];

  $('workControls').hidden = !projectList.length;
  if (cats.length < 2) { bar.hidden = true; return; }

  const chips = [{ key: 'all', label: 'All', count: projectList.length }]
    .concat(cats.map((c) => ({ key: c, label: prettyCategory(c), count: counts[c] })));
  bar.innerHTML = chips.map((c) => `
    <button type="button" class="filter-chip${c.key === activeFilter ? ' active' : ''}" data-filter="${escapeHtml(c.key)}" aria-pressed="${c.key === activeFilter}">
      ${escapeHtml(c.label)} <span class="chip-count">${c.count}</span>
    </button>`).join('');
  bar.hidden = false;
}

$('filterBar').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  renderFilters();
  renderProjects();
});

function setSearch(value) {
  searchQuery = value;
  $('projectSearch').value = value;
  $('clearSearch').hidden = !value;
  renderProjects();
}
$('projectSearch').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  $('clearSearch').hidden = !searchQuery;
  renderProjects();
});
$('clearSearch').addEventListener('click', () => { setSearch(''); $('projectSearch').focus(); });

function matchesQuery(p) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;
  return q.split(/\s+/).every((word) => [p.title, p.subtitle, p.description, p.role, p.tools, prettyCategory(p.category)].join(' ').toLowerCase().includes(word));
}

function renderProjects() {
  const grid = $('projectGrid');
  grid.removeAttribute('aria-busy');

  visibleProjects = projectList.filter((p) => (activeFilter === 'all' || p.category === activeFilter) && matchesQuery(p));

  if (!projectList.length) {
    grid.innerHTML = '<p class="empty-note">Projects will appear here soon.</p>';
    $('resultCount').textContent = '';
    return;
  }

  const q = searchQuery.trim();
  $('resultCount').textContent =
    `${visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'}` +
    (activeFilter === 'all' ? '' : ` in ${prettyCategory(activeFilter)}`) + (q ? ` matching “${q}”` : '');

  if (!visibleProjects.length) {
    grid.innerHTML = `<div class="empty-state"><p>No projects match your filters.</p><button type="button" class="btn btn-ghost btn-sm" id="resetFilters">Reset filters</button></div>`;
    $('resetFilters').addEventListener('click', () => { activeFilter = 'all'; renderFilters(); setSearch(''); });
    return;
  }

  const featureFirst = visibleProjects.length >= 4;
  grid.innerHTML = visibleProjects.map((project, idx) => {
    const images = sortByOrder(project.project_images || []);
    const thumb = images[0];
    return `
      <button class="card reveal${featureFirst && idx === 0 ? ' card-featured' : ''}" type="button" data-project-id="${escapeHtml(String(project.id))}" aria-label="Open project: ${escapeHtml(project.title)}">
        <span class="card-media">
          ${thumb ? `<img src="${escapeHtml(thumb.image_url)}" alt="" loading="lazy">` : '<span class="card-image-placeholder">No preview available</span>'}
          <span class="card-tag">${escapeHtml(prettyCategory(project.category))}</span>
          ${images.length > 1 ? `<span class="card-count" aria-hidden="true">${images.length} images</span>` : ''}
        </span>
        <span class="card-body">
          <span class="card-title">${escapeHtml(project.title)}</span>
          ${project.subtitle ? `<span class="card-subtitle">${escapeHtml(project.subtitle)}</span>` : ''}
          ${project.tools ? `<span class="card-tools">${escapeHtml(project.tools)}</span>` : ''}
          <span class="card-more" aria-hidden="true">View details <span>→</span></span>
        </span>
      </button>`;
  }).join('');
  observeReveals();
}

// cursor spotlight on cards
$('projectGrid').addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const card = e.target.closest('.card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
});

// ===========================================================
// Project modal + gallery
// ===========================================================
const modal = $('projectModal');
const panel = modal.querySelector('.modal-panel');
const track = $('modalTrack');
const thumbs = $('carouselThumbs');
const prevBtn = modal.querySelector('.carousel-btn.prev');
const nextBtn = modal.querySelector('.carousel-btn.next');

let currentIndex = 0;
let imageCount = 0;
let currentProjectId = null;
let lastFocused = null;

function changeSlide(index) {
  if (!imageCount) return;
  currentIndex = (index + imageCount) % imageCount;
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  [...thumbs.children].forEach((t, i) => {
    t.classList.toggle('active', i === currentIndex);
    t.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
  });
  [...track.children].forEach((s, i) => s.setAttribute('aria-hidden', String(i !== currentIndex)));
  $('carouselCount').textContent = imageCount > 1 ? `${currentIndex + 1} / ${imageCount}` : '';
  thumbs.children[currentIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

function fillModal(projectId) {
  const project = projectsById[projectId];
  if (!project) return;
  currentProjectId = String(projectId);
  const images = sortByOrder(project.project_images || []);
  const gid = `pj-${project.id}`;
  viewerGroups[gid] = images.map((img, i) => ({ src: img.image_url, alt: img.alt_text || `${project.title} image ${i + 1}` }));

  $('modalCategory').textContent = prettyCategory(project.category);
  $('modalTitle').textContent = project.title;
  $('modalSubtitle').textContent = project.subtitle || '';
  $('modalSubtitle').hidden = !project.subtitle;
  $('modalDescription').textContent = project.description || '';
  $('modalDescription').hidden = !project.description;

  $('modalRole').textContent = project.role || '';
  $('modalTools').innerHTML = project.tools
    ? `<span class="tool-chips">${project.tools.split(/[,/•|]+/).map((t) => t.trim()).filter(Boolean).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</span>`
    : '';
  $('modalRoleWrap').hidden = !project.role;
  $('modalToolsWrap').hidden = !project.tools;
  modal.querySelector('.project-details').hidden = !project.role && !project.tools;

  const link = $('modalProjectLink');
  const url = safeUrl(project.project_url || '');
  if (url) { link.href = url; link.hidden = false; } else { link.removeAttribute('href'); link.hidden = true; }

  track.innerHTML = '';
  thumbs.innerHTML = '';
  if (images.length) {
    images.forEach((image, i) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slide-zoom';
      btn.setAttribute('aria-label', 'View image full screen');
      const img = document.createElement('img');
      img.src = image.image_url;
      img.alt = image.alt_text || `${project.title} image ${i + 1}`;
      img.loading = i === 0 ? 'eager' : 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', () => openViewer(gid, i));
      slide.appendChild(btn);
      track.appendChild(slide);

      if (images.length > 1) {
        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'thumb';
        t.setAttribute('aria-label', `Show image ${i + 1}`);
        const ti = document.createElement('img');
        ti.src = image.image_url; ti.alt = ''; ti.loading = 'lazy';
        t.appendChild(ti);
        t.addEventListener('click', () => changeSlide(i));
        thumbs.appendChild(t);
      }
    });
    $('modalGallery').hidden = false;
  } else {
    $('modalGallery').hidden = true;
  }

  imageCount = images.length;
  const multi = images.length > 1;
  prevBtn.hidden = !multi;
  nextBtn.hidden = !multi;
  thumbs.hidden = !multi;
  panel.classList.toggle('no-gallery', !images.length);
  $('expandImage').dataset.group = gid;
  changeSlide(0);

  const list = visibleProjects.length ? visibleProjects : projectList;
  const idx = list.findIndex((p) => String(p.id) === currentProjectId);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx > -1 && idx < list.length - 1 ? list[idx + 1] : null;
  $('prevProject').hidden = !prev;
  $('nextProject').hidden = !next;
  $('modalPager').hidden = !prev && !next;
  $('prevProject').dataset.id = prev ? prev.id : '';
  $('nextProject').dataset.id = next ? next.id : '';
  $('prevProjectLabel').textContent = prev ? prev.title : '';
  $('nextProjectLabel').textContent = next ? next.title : '';

  panel.scrollTop = 0;
  modal.querySelector('.modal-info').scrollTop = 0;
}

function openModal(projectId, source) {
  if (!projectsById[projectId]) return;
  if (!modal.classList.contains('open')) { lastFocused = source || document.activeElement; lockScroll(); }
  fillModal(projectId);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  if (location.hash !== `#project-${projectId}`) history.replaceState(null, '', `#project-${projectId}`);
  modal.querySelector('.modal-close').focus();
}

function closeModal() {
  if (!modal.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  unlockScroll();
  if (location.hash.startsWith('#project-')) history.replaceState(null, '', location.pathname + location.search + '#work');
  lastFocused?.focus?.();
}

prevBtn.addEventListener('click', () => changeSlide(currentIndex - 1));
nextBtn.addEventListener('click', () => changeSlide(currentIndex + 1));
$('expandImage').addEventListener('click', (e) => openViewer(e.currentTarget.dataset.group, currentIndex));
modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
$('prevProject').addEventListener('click', (e) => openModal(e.currentTarget.dataset.id));
$('nextProject').addEventListener('click', (e) => openModal(e.currentTarget.dataset.id));
$('copyProjectLink').addEventListener('click', () => {
  copyText(`${location.origin}${location.pathname}#project-${currentProjectId}`, 'Project link copied');
});
$('projectGrid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-project-id]');
  if (card) openModal(card.dataset.projectId, card);
});

(() => {
  let startX = null;
  const el = modal.querySelector('.modal-carousel');
  el.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 48) changeSlide(currentIndex + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();

// ===========================================================
// Image viewer: fit to screen, zoom, pan, gallery
// ===========================================================
const viewer = $('viewer');
const stage = $('viewerStage');
const vImg = $('viewerImg');
const vThumbs = $('viewerThumbs');

let vItems = [];
let vIndex = 0;
let vScale = 1, vX = 0, vY = 0;
let vReturn = null;
const MAX_SCALE = 6;

function vApply(animate = true) {
  vImg.classList.toggle('no-anim', !animate);
  vImg.style.transform = `translate(${vX}px, ${vY}px) scale(${vScale})`;
  stage.classList.toggle('zoomed', vScale > 1.01);
  $('vZoomOut').disabled = vScale <= 1.01;
  $('vZoomIn').disabled = vScale >= MAX_SCALE - 0.01;
  $('vFit').classList.toggle('active', vScale <= 1.01);
}

function vClamp() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const maxX = (w * (vScale - 1)) / 2, maxY = (h * (vScale - 1)) / 2;
  vX = Math.max(-maxX, Math.min(maxX, vX));
  vY = Math.max(-maxY, Math.min(maxY, vY));
  if (vScale <= 1.01) { vX = 0; vY = 0; }
}

function vZoomTo(next, cx, cy, animate = true) {
  next = Math.max(1, Math.min(MAX_SCALE, next));
  const rect = stage.getBoundingClientRect();
  const px = (cx ?? rect.left + rect.width / 2) - (rect.left + rect.width / 2);
  const py = (cy ?? rect.top + rect.height / 2) - (rect.top + rect.height / 2);
  const ratio = next / vScale;
  vX = px - (px - vX) * ratio;
  vY = py - (py - vY) * ratio;
  vScale = next;
  vClamp();
  vApply(animate);
}

function vReset() { vScale = 1; vX = 0; vY = 0; vApply(); }

function vShow(index) {
  if (!vItems.length) return;
  vIndex = (index + vItems.length) % vItems.length;
  const item = vItems[vIndex];
  vReset();
  vImg.src = item.src;
  vImg.alt = item.alt || '';
  $('vOpen').href = item.src;
  const multi = vItems.length > 1;
  $('viewerCount').textContent = multi ? `${vIndex + 1} / ${vItems.length}` : '';
  $('vPrev').hidden = !multi;
  $('vNext').hidden = !multi;
  vThumbs.hidden = !multi;
  [...vThumbs.children].forEach((t, i) => {
    t.classList.toggle('active', i === vIndex);
    t.setAttribute('aria-current', i === vIndex ? 'true' : 'false');
  });
  vThumbs.children[vIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  // preload neighbours
  [vIndex + 1, vIndex - 1].forEach((i) => { const it = vItems[(i + vItems.length) % vItems.length]; if (it) { const im = new Image(); im.src = it.src; } });
}

function openViewer(groupId, index = 0) {
  const items = viewerGroups[groupId];
  if (!items || !items.length) return;
  vItems = items;
  vReturn = document.activeElement;
  vThumbs.innerHTML = items.map((it, i) => `<button type="button" class="vthumb" data-vi="${i}" aria-label="Show image ${i + 1}"><img src="${escapeHtml(it.src)}" alt="" loading="lazy"></button>`).join('');
  vShow(index);
  viewer.classList.add('open');
  viewer.setAttribute('aria-hidden', 'false');
  lockScroll();
  $('vClose').focus();
}

function closeViewer() {
  if (!viewer.classList.contains('open')) return;
  viewer.classList.remove('open');
  viewer.setAttribute('aria-hidden', 'true');
  unlockScroll();
  vReturn?.focus?.();
}

document.addEventListener('click', (e) => {
  const z = e.target.closest('.zoomable');
  if (z) openViewer(z.dataset.group, Number(z.dataset.index) || 0);
});
vThumbs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-vi]');
  if (b) vShow(Number(b.dataset.vi));
});
$('vClose').addEventListener('click', closeViewer);
$('vPrev').addEventListener('click', () => vShow(vIndex - 1));
$('vNext').addEventListener('click', () => vShow(vIndex + 1));
$('vZoomIn').addEventListener('click', () => vZoomTo(vScale * 1.5));
$('vZoomOut').addEventListener('click', () => vZoomTo(vScale / 1.5));
$('vFit').addEventListener('click', vReset);

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  vZoomTo(vScale * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY, false);
}, { passive: false });

// pointer: pan, pinch, swipe, double tap
(() => {
  const pointers = new Map();
  let startDist = 0, startScale = 1;
  let panStart = null;
  let swipeStart = null;
  let lastTap = { t: 0, x: 0, y: 0 };
  let moved = false;

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.viewer-nav')) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 1) {
      panStart = { x: e.clientX, y: e.clientY, vx: vX, vy: vY };
      swipeStart = { x: e.clientX, y: e.clientY };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      startDist = Math.hypot(a.x - b.x, a.y - b.y);
      startScale = vScale;
      swipeStart = null;
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (startDist) vZoomTo(startScale * (d / startDist), (a.x + b.x) / 2, (a.y + b.y) / 2, false);
      moved = true;
    } else if (pointers.size === 1 && panStart) {
      const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (vScale > 1.01) {
        vX = panStart.vx + dx; vY = panStart.vy + dy;
        vClamp(); vApply(false);
      }
    }
  });

  const end = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size) { panStart = null; return; }

    if (swipeStart && vScale <= 1.01) {
      const dx = e.clientX - swipeStart.x, dy = e.clientY - swipeStart.y;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 80 && vItems.length > 1) {
        vShow(vIndex + (dx < 0 ? 1 : -1));
        swipeStart = null; panStart = null; return;
      }
    }
    if (!moved) {
      const now = Date.now();
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        vZoomTo(vScale > 1.01 ? 1 : 2.5, e.clientX, e.clientY);
        lastTap = { t: 0, x: 0, y: 0 };
      } else {
        lastTap = { t: now, x: e.clientX, y: e.clientY };
      }
    }
    panStart = null; swipeStart = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
})();

// ===========================================================
// Keyboard (viewer > document > project > menu)
// ===========================================================
function trapTab(e, container) {
  const f = [...container.querySelectorAll('button:not([hidden]):not([disabled]), a[href]:not([hidden]), iframe')]
    .filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

document.addEventListener('keydown', (e) => {
  if (viewer.classList.contains('open')) {
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowLeft') vShow(vIndex - 1);
    else if (e.key === 'ArrowRight') vShow(vIndex + 1);
    else if (e.key === '+' || e.key === '=') vZoomTo(vScale * 1.5);
    else if (e.key === '-' || e.key === '_') vZoomTo(vScale / 1.5);
    else if (e.key === '0') vReset();
    else if (e.key === 'Tab') trapTab(e, viewer);
    return;
  }
  if (docModal.classList.contains('open')) {
    if (e.key === 'Escape') closeDoc();
    else if (e.key === 'Tab') trapTab(e, docModal.querySelector('.modal-panel'));
    return;
  }
  if (modal.classList.contains('open')) {
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowLeft') changeSlide(currentIndex - 1);
    else if (e.key === 'ArrowRight') changeSlide(currentIndex + 1);
    else if (e.key === 'Tab') trapTab(e, panel);
    return;
  }
  if (e.key === 'Escape' && menuIsOpen()) { setMenu(false); menuToggle.focus(); }
});

window.addEventListener('hashchange', () => {
  const m = location.hash.match(/^#project-(.+)$/);
  if (m && projectsById[m[1]]) openModal(m[1]);
  else if (modal.classList.contains('open') && !m) closeModal();
});

// ===========================================================
// Init
// ===========================================================
async function init() {
  const [profileRes, skillsRes, projectsRes, timelineRes, certsRes, docs] = await Promise.all([
    supabaseClient.from('profile').select('*').eq('id', 1).single(),
    supabaseClient.from('skills').select('*').order('sort_order', { ascending: true }),
    supabaseClient.from('projects').select('*, project_images(*)').order('sort_order', { ascending: false }),
    supabaseClient.from('timeline').select('*, timeline_images(*)').order('sort_order', { ascending: false }),
    supabaseClient.from('certifications').select('*, certificate_images(*)').order('sort_order', { ascending: false }),
    detectDocuments(),
  ]);

  availableDocs = docs;
  profileData = profileRes.data || null;
  if (profileRes.error) console.error('Could not load profile:', profileRes.error);

  if (profileData) {
    renderProfile(profileData);
    renderAbout(profileData);
  } else {
    $('heroTagline').textContent = 'The portfolio could not be loaded right now. Please refresh in a moment.';
  }
  renderContact(profileData);
  renderDocuments();

  const skills = skillsRes.data || [];
  projectList = projectsRes.data || [];
  projectList.forEach((p) => { projectsById[p.id] = p; });

  renderHeroExtras(skills);
  renderFilters();
  renderProjects();
  renderSkills(skills);
  renderTimeline(timelineRes.data || []);
  renderCertificates(certsRes.data || []);

  observeSections();
  observeReveals();

  const m = location.hash.match(/^#project-(.+)$/);
  if (m && projectsById[m[1]]) openModal(m[1]);
  else if (location.hash.length > 1) {
    try { document.querySelector(location.hash)?.scrollIntoView(); } catch (e) { /* ignore */ }
  }
}

init();
