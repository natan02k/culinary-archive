const API_BASE = 'https://culinary-archive.onrender.com/api';
const HOST = 'https://culinary-archive.onrender.com';

// Scroll Animation Observer (Premium Feel)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1 });

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
let isDark = localStorage.getItem('theme') !== 'light';

function applyTheme() {
  if (isDark) {
    html.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    html.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme();
});
applyTheme();

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// Modal Logic
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Gamification / Confetti
function fireConfetti() {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b']
  });
}

// ─── TOAST NOTIFICATION SYSTEM ───────────────────────────────────────────────
const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️' };
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${TOAST_ICONS[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ─── HERO FOOD PARTICLES ──────────────────────────────────────────────────────
const FOOD_EMOJIS = ['🍕', '🍜', '🥗', '🍰', '🍣', '🥐', '🍔', '🥑', '🍓', '🫐', '🥘', '🌮'];
function initHeroParticles() {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const hero = canvas.parentElement;
  let W = hero.offsetWidth, H = hero.offsetHeight;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const PARTICLE_COUNT = 14;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(W, H, true));

  function createParticle(w, h, initial) {
    return {
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 30,
      size: 14 + Math.random() * 14,
      speed: 0.3 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.4,
      opacity: 0.4 + Math.random() * 0.45,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.015,
      emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)]
    };
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px serif`;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillText(p.emoji, -p.size / 2, p.size / 2);
      ctx.restore();
      p.y -= p.speed;
      p.x += p.drift;
      p.rotation += p.rotationSpeed;
      if (p.y < -40) Object.assign(p, createParticle(W, H, false), { x: Math.random() * W });
    });
    raf = requestAnimationFrame(draw);
  }
  draw();

  // Pause when out of view for performance
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!raf) draw(); }
    else { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0 });
  io.observe(canvas);

  const resizeOb = new ResizeObserver(() => {
    W = hero.offsetWidth; H = hero.offsetHeight;
    canvas.width = W; canvas.height = H;
  });
  resizeOb.observe(hero);
}

// ─── TYPEWRITER HERO PARAGRAPH ───────────────────────────────────────────────
function initTypewriter() {
  const el = document.querySelector('.hero-content p');
  if (!el || el.dataset.typed) return;
  el.dataset.typed = '1';
  const text = el.textContent.trim();
  el.textContent = '';
  el.style.opacity = '1';
  let i = 0;
  const speed = 18;
  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(type, speed);
    }
  }
  setTimeout(type, 600);
}

const app = {
  isRegistering: false,
  user: null,
  loadedRecipes: [],

  init() {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    this.checkAuth();
    this.loadRecipes();
    initHeroParticles();
    initTypewriter();
    this.initDailyQuests();
  },

  toggleAuthMode() {
    this.isRegistering = !this.isRegistering;
    document.getElementById('registerGroup1').style.display = this.isRegistering ? 'block' : 'none';
    document.getElementById('registerGroup2').style.display = this.isRegistering ? 'block' : 'none';

    if (this.isRegistering) {
      document.getElementById('authEmail').required = true;
      document.getElementById('authDate').required = true;
      document.getElementById('authSubmitText').textContent = 'Account erstellen & 0 XP starten';
      document.getElementById('toggleAuthBtn').innerHTML = '&larr; Bereits einen Account? Login';
    } else {
      document.getElementById('authEmail').required = false;
      document.getElementById('authDate').required = false;
      document.getElementById('authSubmitText').textContent = 'Einloggen';
      document.getElementById('toggleAuthBtn').innerHTML = 'Noch keinen Account? Registrieren &rarr;';
    }
  },

  async req(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: {} };

    // Add JWT token to headers if available
    const token = localStorage.getItem('jwt_token');
    if (token) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      if (body instanceof FormData) {
        opts.body = body; // let browser set content-type for multipart
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    // Remove credentials for JWT - we don't send cookies
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    let data = null;
    try { data = await res.json(); } catch (e) { }
    if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
    return data;
  },

  async handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const email = document.getElementById('authEmail').value;
    const date = document.getElementById('authDate').value;

    const btnText = document.getElementById('authSubmitText');
    const ogText = btnText.innerText;
    btnText.innerText = 'Lade...';
    try {
      if (this.isRegistering) {
        await this.req('/register', 'POST', { username, password, email, geburtsdatum: date, bio: "Let's cook!" });
        fireConfetti();
        showToast('Account erstellt! Willkommen bei Culinary Archive. 🎉', 'success');
      } else {
        const response = await this.req('/login', 'POST', { username, password });
        if (response.token) {
          localStorage.setItem('jwt_token', response.token);
        }
        closeModal('authModal');
        this.checkAuth();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnText.innerText = ogText;
    }
  },

  async checkAuth() {
    // First check if we have a JWT token
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      // No token - user is not logged in
      this.user = null;
      document.getElementById('authLinks').style.display = 'flex';
      document.getElementById('userMenu').style.display = 'none';
      if (document.getElementById('heroAuthBtn')) document.getElementById('heroAuthBtn').style.display = 'inline-block';
      document.getElementById('floatingAddBtn').style.display = 'none';
      document.getElementById('gamificationDashboard').style.display = 'none';
      this.showFeed();
      return;
    }

    try {
      // Token exists - verify it with server
      const { username } = await this.req('/check-login');
      const profile = await this.req('/profile');
      this.user = profile;
      document.getElementById('authLinks').style.display = 'none';
      document.getElementById('userMenu').style.display = 'flex';
      if (document.getElementById('heroAuthBtn')) document.getElementById('heroAuthBtn').style.display = 'none';

      // Setup Gamification Dashboard
      document.getElementById('gamificationDashboard').style.display = 'block';
      document.getElementById('dashUsername').textContent = profile.username;

      document.getElementById('floatingAddBtn').style.display = 'flex';

      this.updateGamificationUI(profile);

      // Load user favorites in background
      this.loadFavorites();

      this.showFeed(); // Default view when logging in
    } catch (err) {
      // Token is invalid - remove it and show login
      localStorage.removeItem('jwt_token');
      this.user = null;
      document.getElementById('authLinks').style.display = 'flex';
      document.getElementById('userMenu').style.display = 'none';
      if (document.getElementById('heroAuthBtn')) document.getElementById('heroAuthBtn').style.display = 'inline-block';
      document.getElementById('floatingAddBtn').style.display = 'none';
      document.getElementById('gamificationDashboard').style.display = 'none';
      this.showFeed();
    }
  },

  getRankTitle(lvl) {
    if (lvl < 3) return 'Novice Cook 🍳';
    if (lvl < 5) return 'Sous Chef 🔪';
    if (lvl < 10) return 'Head Chef 🎩';
    if (lvl < 20) return 'Master-Chef ⭐';
    return 'God of Kitchen 👑';
  },

  updateGamificationUI({ xp, level, profile_image_url, username }) {
    document.getElementById('navLevelBadge').textContent = level;
    document.getElementById('dashLevelBadge').textContent = level;
    document.getElementById('dashRankTitle').textContent = this.getRankTitle(level);

    // Epic Level Up Modal Check
    if (this._prevLevel && level > this._prevLevel) {
      this.showLevelUpModal(level);
    }
    this._prevLevel = level;

    // XP logic: Next level every 100 XP
    const currentLevelBaseXP = (level - 1) * 100;
    const progressXP = xp - currentLevelBaseXP;
    document.getElementById('dashXpLabel').textContent = `${progressXP} / 100 XP`;
    document.getElementById('dashXpBar').style.width = `${progressXP}%`;

    // Dynamic Avatar Ranks
    const avatarClass = level >= 10 ? 'avatar-rank-god' : (level >= 5 ? 'avatar-rank-chef' : 'avatar-rank-novice');

    // Profile Image Update
    const dashImg = document.getElementById('dashProfileImage');
    const dashInitials = document.getElementById('dashProfileInitials');
    dashImg.className = `profile-image ${avatarClass}`;
    dashInitials.className = `profile-initials ${avatarClass}`;

    if (profile_image_url) {
      dashImg.src = HOST + '/' + profile_image_url;
      dashImg.style.display = 'block';
      dashInitials.style.display = 'none';
    } else {
      dashImg.style.display = 'none';
      dashInitials.style.display = 'flex';
      if (username) dashInitials.textContent = username.charAt(0).toUpperCase();
    }
  },

  // --- Tags Management ---
  addTag(inputId, containerId, hiddenInputId) {
    const input = document.getElementById(inputId);
    let tag = input.value.trim().toLowerCase().replace(/[^a-z0-9ßäöü-]/gi, '');
    if (!tag) return;

    tag = tag.substring(0, 20); // max len

    const hidden = document.getElementById(hiddenInputId);
    let tags = hidden.value ? hidden.value.split(',') : [];
    if (!tags.includes(tag)) {
      tags.push(tag);
      hidden.value = tags.join(',');
      this.renderTags(containerId, hiddenInputId);
    }
    input.value = '';
  },

  renderTags(containerId, hiddenInputId) {
    const hidden = document.getElementById(hiddenInputId);
    const tags = hidden.value ? hidden.value.split(',') : [];
    const container = document.getElementById(containerId);
    container.innerHTML = tags.map(t =>
      `<span class="tag-chip" style="background: rgba(251, 113, 133, 0.1); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;">
        #${t} <span style="cursor: pointer; font-weight: bold; font-size: 1rem; line-height: 1;" onclick="app.removeTag('${t}', '${containerId}', '${hiddenInputId}')">&times;</span>
      </span>`
    ).join('');
  },

  removeTag(tag, containerId, hiddenInputId) {
    const hidden = document.getElementById(hiddenInputId);
    let tags = hidden.value ? hidden.value.split(',') : [];
    tags = tags.filter(t => t !== tag);
    hidden.value = tags.join(',');
    this.renderTags(containerId, hiddenInputId);
  },

  async logout() {
    await this.req('/logout', 'POST');

    // Remove JWT token from localStorage
    localStorage.removeItem('jwt_token');

    this.checkAuth();
  },

  async uploadProfileImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Bild zu groß! (Max 5MB)');
    const fd = new FormData();
    fd.append('profile_image', file);

    try {
      const res = await this.req('/profile/image', 'POST', fd);
      if (this.user) {
        this.user.profile_image_url = res.url;
        this.updateGamificationUI(this.user);
      }
    } catch (err) {
      alert(err.message);
    }
  },

  previewImage(e) {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const prev = document.getElementById('imagePreview');
      prev.src = url;
      prev.style.display = 'block';
    }
  },

  async submitRecipe(e) {
    e.preventDefault();
    if (!this.user) return alert('Bitte einloggen!');
    const fd = new FormData();
    fd.append('titel', document.getElementById('rTitle').value);
    fd.append('zubereitungszeit', document.getElementById('rPrep').value);
    fd.append('kochzeit', document.getElementById('rCook').value);
    fd.append('schwierigkeit', document.getElementById('rDiff').value);
    fd.append('kategorie', document.getElementById('rCat').value);
    fd.append('tags', document.getElementById('rTagsArray').value);
    fd.append('zutaten', document.getElementById('rIng').value);
    fd.append('zubereitung', document.getElementById('rSteps').value);

    const currFile = document.getElementById('recipeImageInput').files[0];
    if (currFile) fd.append('image', currFile);

    try {
      await this.req('/recipes', 'POST', fd);
      fireConfetti();
      closeModal('recipeModal');
      e.target.reset();
      document.getElementById('imagePreview').style.display = 'none';
      // Refresh user to get new XP (+50)
      this.checkAuth();
      this.loadRecipes();
    } catch (err) {
      alert(err.message);
    }
  },

  async loadRecipes() {
    // Show shimmer skeletons immediately
    const container = document.getElementById('recipesContainer');
    const SKELETON_COUNT = 6;
    container.innerHTML = Array(SKELETON_COUNT).fill(`
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-content">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>`).join('');

    try {
      const recipes = await this.req('/all-recipes');
      this.loadedRecipes = recipes;

      // Determine trending top-3 by likes
      const sorted = [...recipes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      const trendingIds = new Set(sorted.slice(0, 3).map(r => r.rezept_id));
      this._trendingIds = trendingIds;

      this.triggerSearch();

      // Also update Profile if logged in
      const profileContainer = document.getElementById('profileRecipesContainer');
      if (this.user && profileContainer) {
        const myRecipes = recipes.filter(r => r.autor === this.user.username);
        profileContainer.innerHTML = myRecipes.length > 0
          ? myRecipes.map(r => this.createRecipeCard(r)).join('')
          : '<p style="color:var(--text-muted); grid-column:1/-1;">Du hast noch keine Rezepte erstellt.</p>';
      }

      // Apply observers to new loaded content
      this._applyCardEffects();
    } catch (e) {
      container.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding: 3rem;">Rezepte konnten nicht geladen werden. 😢</p>';
      console.error(e);
    }
  },

  // ─── APPLY 3D TILT + STAGGER ───────────────────────────────────────────────
  _applyCardEffects() {
    const cards = document.querySelectorAll('.recipe-card');
    cards.forEach((card, i) => {
      observer.observe(card);

      // Stagger delay
      card.style.transitionDelay = `${i * 60}ms`;

      // 3D Tilt (disabled on touch devices)
      if (!window.matchMedia('(hover: none)').matches) {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) / (rect.width / 2);
          const dy = (e.clientY - cy) / (rect.height / 2);
          card.style.transform = `translateY(-8px) scale(1.015) perspective(700px) rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg)`;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      }
    });
  },

  triggerSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('searchCategory').value;

    if (!query) document.getElementById('searchInputGhost').value = '';

    const cleanQuery = query.replace(/^#/, '');
    const filtered = this.loadedRecipes.filter(r => {
      const matchesQuery = !query ||
        r.titel.toLowerCase().includes(query) ||
        r.autor.toLowerCase().includes(query) ||
        (r.tags && r.tags.toLowerCase().includes(cleanQuery)) ||
        (r.zutaten && r.zutaten.toLowerCase().includes(query));

      const matchesCat = !category || r.kategorie === category;
      return matchesQuery && matchesCat;
    });

    const container = document.getElementById('recipesContainer');
    if (filtered.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding: 3rem;">Keine Rezepte gefunden. 😢</p>';
    } else {
      container.innerHTML = filtered.map(r => this.createRecipeCard(r)).join('');
      this._applyCardEffects();
    }
  },

  handleSearchInput(e) {
    const input = e.target;
    const ghost = document.getElementById('searchInputGhost');
    const query = input.value;

    // Always trigger actual search filter first
    this.triggerSearch();

    if (!query) {
      ghost.value = '';
      return;
    }

    // Look for a title that starts exactly with what the user typed (case insensitive)
    const suggestion = this.loadedRecipes.find(r => r.titel.toLowerCase().startsWith(query.toLowerCase()));

    if (suggestion) {
      // Preserve the exact case the user typed, append the rest from the suggestion
      const matchRest = suggestion.titel.substring(query.length);
      ghost.value = input.value + matchRest;
    } else {
      ghost.value = '';
    }
  },

  handleSearchKeyDown(e) {
    const input = document.getElementById('searchInput');
    const ghost = document.getElementById('searchInputGhost');

    // Accept autocomplete on Tab or Right Arrow
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghost.value && ghost.value.length > input.value.length) {
      e.preventDefault(); // Prevent focus shift
      input.value = ghost.value;
      ghost.value = '';
      this.triggerSearch();
    }
  },

  filterByUser(username) {
    if (document.getElementById('searchInput')) {
      document.getElementById('searchInput').value = username;
    }
    document.getElementById('searchCategory').value = '';

    // Switch to feed view
    this.showFeed();

    this.triggerSearch();
    setTimeout(() => {
      document.getElementById('feed').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  },

  filterByTag(tag) {
    if (document.getElementById('searchInput')) {
      document.getElementById('searchInput').value = '#' + tag;
    }
    document.getElementById('searchCategory').value = '';

    // Switch to feed view
    this.showFeed();

    this.triggerSearch();
    setTimeout(() => {
      document.getElementById('feed').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  },

  showFeed() {
    document.getElementById('feed').style.display = 'block';
    document.getElementById('heroSection').style.display = 'flex';
    document.getElementById('profileMain').style.display = 'none';
    document.getElementById('gamificationDashboard').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  showProfile() {
    if (!this.user) return openModal('authModal');
    document.getElementById('feed').style.display = 'none';
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('profileMain').style.display = 'block';
    document.getElementById('gamificationDashboard').style.display = 'block';
    this.switchProfileTab('my'); // default to 'my recipes' tab
    this.loadRecipes(); // Refresh my recipes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  switchProfileTab(tab) {
    if (tab === 'my') {
      document.getElementById('tabMyRecipes').className = 'btn-primary';
      document.getElementById('tabFavorites').className = 'btn-glass';
      document.getElementById('profileRecipesContainer').style.display = 'grid';
      document.getElementById('favoritesContainer').style.display = 'none';

      const myRecipes = this.loadedRecipes.filter(r => r.autor === this.user?.username);
      const c = document.getElementById('profileRecipesContainer');
      c.innerHTML = myRecipes.length > 0 ? myRecipes.map(r => this.createRecipeCard(r)).join('') : '<p style="color:var(--text-muted); grid-column:1/-1;">Du hast noch keine Rezepte erstellt.</p>';

      // Apply observers to new loaded content
      document.querySelectorAll('#profileRecipesContainer .recipe-card').forEach(el => observer.observe(el));
    } else {
      document.getElementById('tabMyRecipes').className = 'btn-glass';
      document.getElementById('tabFavorites').className = 'btn-primary';
      document.getElementById('profileRecipesContainer').style.display = 'none';
      document.getElementById('favoritesContainer').style.display = 'grid';
      this.loadFavorites();
    }
  },

  viewRecipe(id) {
    const r = this.loadedRecipes.find(x => x.rezept_id === id);
    if (!r) return;

    document.getElementById('viewTitle').textContent = r.titel;
    document.getElementById('viewAuthor').textContent = r.autor;
    document.getElementById('viewCat').textContent = r.kategorie;
    document.getElementById('viewTime').textContent = r.zubereitungszeit + r.kochzeit;
    document.getElementById('viewDiff').textContent = r.schwierigkeit;

    const fallbackUrl = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const imgUrl = r.image_url ? `${HOST}/${r.image_url}` : fallbackUrl;
    document.getElementById('viewImg').src = imgUrl;

    const tagsContainer = document.getElementById('viewTags');
    if (r.tags) {
      tagsContainer.innerHTML = r.tags.split(',').map(t =>
        `<span onclick="app.filterByTag('${t.trim()}'); closeModal('viewRecipeModal');" style="cursor: pointer; background: rgba(251, 113, 133, 0.1); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; color: var(--primary);">#${t.trim()}</span>`
      ).join('');
      tagsContainer.style.display = 'flex';
    } else {
      tagsContainer.style.display = 'none';
      tagsContainer.innerHTML = '';
    }

    // Use marked.js to render the markdown
    document.getElementById('viewIng').innerHTML = marked.parse(r.zutaten || '');
    document.getElementById('viewSteps').innerHTML = marked.parse(r.zubereitung || '');

    // Current recipe ID for comments
    document.getElementById('viewRecipeModal').dataset.rezeptId = id;

    // Load comments
    this.loadComments(id);

    // Toggle comment form visibility
    if (this.user) {
      document.getElementById('commentForm').style.display = 'block';
      document.getElementById('commentLoginPrompt').style.display = 'none';
    } else {
      document.getElementById('commentForm').style.display = 'none';
      document.getElementById('commentLoginPrompt').style.display = 'block';
    }

    // Add edit button if the author is the current user
    const titleContainer = document.getElementById('viewTitle').parentElement;
    let existingEditBtn = document.getElementById('editRecipeIconBtn');
    if (existingEditBtn) existingEditBtn.remove();

    if (this.user && r.autor === this.user.username) {
      const editBtn = document.createElement('button');
      editBtn.id = 'editRecipeIconBtn';
      editBtn.className = 'btn-glass';
      editBtn.style.marginTop = '1rem';
      editBtn.innerHTML = '✏️ Bearbeiten';
      editBtn.onclick = () => this.openEditRecipeModal(id);
      titleContainer.appendChild(editBtn);
    }

    // Add Zen Mode Button
    let existingZenBtn = document.getElementById('zenModeBtn');
    if (existingZenBtn) existingZenBtn.remove();
    const zenBtn = document.createElement('button');
    zenBtn.id = 'zenModeBtn';
    zenBtn.className = 'btn-primary';
    zenBtn.style.width = '100%';
    zenBtn.style.marginTop = '1.5rem';
    zenBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    zenBtn.innerHTML = '🧘 Zen Koch-Modus Starten';
    zenBtn.onclick = () => this.openZenMode(id);
    document.getElementById('viewSteps').parentElement.appendChild(zenBtn);

    openModal('viewRecipeModal');
  },

  updateLivePreview(inputFieldId, previewDivId) {
    const input = document.getElementById(inputFieldId);
    const preview = document.getElementById(previewDivId);
    if (!input || !preview) return;
    const val = input.value.trim();
    if (val === '') {
      preview.innerHTML = '*Live Preview...*';
    } else {
      preview.innerHTML = marked.parse(val);
    }
  },

  // --- Profile Edit ---
  previewProfileImage(e) {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('editProfilePreviewImg').src = URL.createObjectURL(file);
      document.getElementById('editProfilePreviewImg').style.display = 'block';
      document.getElementById('editProfileInitials').style.display = 'none';
    }
  },

  openEditProfileModal() {
    if (!this.user) return;
    document.getElementById('editProfileEmail').value = this.user.email || '';
    document.getElementById('editProfileBio').value = this.user.bio || '';
    document.getElementById('editProfileDob').value = this.user.geburtsdatum || '';
    document.getElementById('editProfilePassword').value = ''; // Don't prefill password

    if (this.user.profile_image_url) {
      document.getElementById('editProfilePreviewImg').src = HOST + '/' + this.user.profile_image_url;
      document.getElementById('editProfilePreviewImg').style.display = 'block';
      document.getElementById('editProfileInitials').style.display = 'none';
    } else {
      document.getElementById('editProfilePreviewImg').style.display = 'none';
      document.getElementById('editProfileInitials').style.display = 'flex';
      document.getElementById('editProfileInitials').textContent = this.user.username.charAt(0).toUpperCase();
    }
    openModal('editProfileModal');
  },

  async submitProfileEdit(e) {
    e.preventDefault();
    const data = new FormData();
    data.append('email', document.getElementById('editProfileEmail').value.trim());
    data.append('bio', document.getElementById('editProfileBio').value.trim());
    data.append('passwort', document.getElementById('editProfilePassword').value.trim());
    data.append('geburtsdatum', document.getElementById('editProfileDob').value.trim());

    const file = document.getElementById('editProfileUpload').files[0];
    if (file) data.append('profile_image', file);

    try {
      await this.req('/profile', 'PUT', data);
      closeModal('editProfileModal');
      this.checkAuth(); // refresh UI with new profile data
    } catch (err) {
      alert("Fehler beim Aktualisieren des Profils");
    }
  },

  async deleteProfile() {
    if (!confirm("Bist du sicher, dass du deinen Account unwiderruflich löschen möchtest? Alle deine Rezepte und Daten gehen verloren.")) return;
    try {
      await this.req('/profile', 'DELETE');
      closeModal('editProfileModal');
      showToast('Account gelöscht. Auf Wiedersehen! 👋', 'info');
      this.checkAuth();
    } catch (err) {
      showToast("Fehler beim Löschen des Accounts", 'error');
    }
  },

  async openPublicProfile(username) {
    try {
      const pub = await this.req(`/profile/${username}`);
      document.getElementById('pubUsername').textContent = '@' + pub.username;
      document.getElementById('pubBio').textContent = pub.bio || 'Keine Bio vorhanden.';
      document.getElementById('pubLevelBadge').textContent = pub.level;
      document.getElementById('pubXp').textContent = pub.xp;

      const img = document.getElementById('pubProfileImg');
      img.src = pub.profile_image_url ? `${HOST}/${pub.profile_image_url}` : `https://ui-avatars.com/api/?name=${pub.username}&background=random`;

      const badge = document.getElementById('pubSpecialTitle');
      if (pub.level >= 5) {
        badge.style.display = 'block';
        img.style.borderColor = '#fbbf24'; // Gold border
        img.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.6)';
      } else {
        badge.style.display = 'none';
        img.style.borderColor = 'var(--primary)';
        img.style.boxShadow = 'none';
      }

      const viewBtn = document.getElementById('pubViewRecipesBtn');
      if (viewBtn) {
        viewBtn.onclick = () => {
          closeModal('publicProfileModal');
          this.filterByUser(pub.username);
        };
      }

      openModal('publicProfileModal');
    } catch (e) {
      alert("Profil konnte nicht geladen werden.");
    }
  },

  // --- Recipe Edit ---
  previewEditImage(e) {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('editImagePreview').src = URL.createObjectURL(file);
      document.getElementById('editImagePreview').style.display = 'block';
      document.getElementById('editRecipeRemoveBtn').style.display = 'block';
      document.getElementById('editRecipeRemoveImage').value = 'false';
    }
  },

  removeEditImage() {
    document.getElementById('editImagePreview').src = '';
    document.getElementById('editImagePreview').style.display = 'none';
    document.getElementById('editRecipeRemoveBtn').style.display = 'none';
    document.getElementById('editRecipeImageInput').value = '';
    document.getElementById('editRecipeRemoveImage').value = 'true';
  },

  openEditRecipeModal(id) {
    const r = this.loadedRecipes.find(x => x.rezept_id === id);
    if (!r) return;

    closeModal('viewRecipeModal');

    document.getElementById('editRezeptId').value = r.rezept_id;
    document.getElementById('eTitle').value = r.titel;
    document.getElementById('ePrep').value = r.zubereitungszeit;
    document.getElementById('eCook').value = r.kochzeit;
    document.getElementById('eDiff').value = r.schwierigkeit;
    document.getElementById('eCat').value = r.kategorie;
    document.getElementById('eTagsArray').value = r.tags || '';
    document.getElementById('eIng').value = r.zutaten || '';
    document.getElementById('eSteps').value = r.zubereitung || '';

    this.renderTags('eTagsContainer', 'eTagsArray');
    this.updateLivePreview('eIng', 'eIngPreview');
    this.updateLivePreview('eSteps', 'eStepsPreview');

    document.getElementById('editRecipeRemoveImage').value = 'false';
    if (r.image_url) {
      document.getElementById('editImagePreview').src = `${HOST}/${r.image_url}`;
      document.getElementById('editImagePreview').style.display = 'block';
      document.getElementById('editRecipeRemoveBtn').style.display = 'block';
    } else {
      document.getElementById('editImagePreview').src = '';
      document.getElementById('editImagePreview').style.display = 'none';
      document.getElementById('editRecipeRemoveBtn').style.display = 'none';
    }

    document.getElementById('deleteRecipeBtn').onclick = () => this.deleteRecipe(id);

    openModal('editRecipeModal');
  },

  async submitEditRecipe(e) {
    e.preventDefault();
    const id = document.getElementById('editRezeptId').value;
    const data = new FormData(document.getElementById('editRecipeForm'));

    // the ids in HTML map to diff names than backend expects:
    // We can manually map them or just use the IDs as names in HTML.
    // Since names are missing, let's just create a new FormData and append:
    const fd = new FormData();
    fd.append('titel', document.getElementById('eTitle').value);
    fd.append('zubereitungszeit', document.getElementById('ePrep').value);
    fd.append('kochzeit', document.getElementById('eCook').value);
    fd.append('schwierigkeit', document.getElementById('eDiff').value);
    fd.append('kategorie', document.getElementById('eCat').value);
    fd.append('tags', document.getElementById('eTagsArray').value);
    fd.append('zutaten', document.getElementById('eIng').value);
    fd.append('zubereitung', document.getElementById('eSteps').value);
    fd.append('remove_image', document.getElementById('editRecipeRemoveImage').value);

    const file = document.getElementById('editRecipeImageInput').files[0];
    if (file) fd.append('image', file);

    try {
      await this.req(`/recipes/${id}`, 'PUT', fd);
      closeModal('editRecipeModal');
      this.loadRecipes(); // Refresh feed
    } catch (err) {
      alert("Fehler beim Speichern");
    }
  },

  async deleteRecipe(id) {
    if (!confirm("Bist du sicher, dass du dieses Rezept löschen möchtest?")) return;
    try {
      await this.req(`/recipes/${id}`, 'DELETE');
      closeModal('editRecipeModal');
      this.loadRecipes(); // Refresh feed
    } catch (err) {
      alert("Fehler beim Löschen");
    }
  },

  async toggleLike(id, btn) {
    if (!this.user) return openModal('authModal');

    const isLiked = btn.classList.contains('liked');
    const icon = btn.querySelector('svg');
    const counterEl = btn.closest('.like-btn-group')?.querySelector('.like-counter');
    let count = parseInt(counterEl?.textContent || '0', 10);

    // Optimistic UI update
    if (isLiked) {
      btn.classList.remove('liked');
      icon.setAttribute('fill', 'none');
      if (counterEl) counterEl.textContent = Math.max(0, count - 1);
    } else {
      btn.classList.add('liked');
      icon.setAttribute('fill', 'currentColor');
      if (counterEl) counterEl.textContent = count + 1;
    }

    // Server update
    try {
      await this.req('/toggle-like', 'POST', { rezept_id: id, action: isLiked ? 0 : 1 });
      if (!isLiked) {
        confetti({ particleCount: 30, spread: 50, origin: { x: btn.getBoundingClientRect().x / window.innerWidth, y: btn.getBoundingClientRect().y / window.innerHeight } });
        const rect = btn.getBoundingClientRect();
        this.showFloatingXP(rect.left + rect.width / 2, rect.top, 5);
        this.checkQuest('like');
        this.checkAuth();
      }
    } catch (e) {
      showToast("Fehler beim Liken.", 'error');
      this.loadRecipes();
    }
  },

  async loadFavorites() {
    if (!this.user) return;
    try {
      const favs = await this.req('/favorites');
      const container = document.getElementById('favoritesContainer');
      const mapped = favs.map(r => { r.is_favorite = true; return r; });
      container.innerHTML = mapped.length > 0 ? mapped.map(r => this.createRecipeCard(r)).join('') : '<p style="color:var(--text-muted); grid-column:1/-1;">Du hast noch keine Favoriten.</p>';
      this._applyCardEffects();
    } catch (e) { }
  },

  async toggleFavorite(id, btn) {
    if (!this.user) return openModal('authModal');
    const isFav = btn.classList.contains('liked');
    const icon = btn.querySelector('svg');
    const counterEl = btn.closest('.like-btn-group')?.querySelector('.like-counter');
    let count = parseInt(counterEl?.textContent || '0', 10);

    // Optimistic UI
    if (isFav) {
      btn.classList.remove('liked');
      icon.setAttribute('fill', 'none');
      if (counterEl) counterEl.textContent = Math.max(0, count - 1);
    } else {
      btn.classList.add('liked');
      icon.setAttribute('fill', 'currentColor');
      if (counterEl) counterEl.textContent = count + 1;
      confetti({ particleCount: 20, spread: 70, shapes: ['star'], colors: ['#f59e0b', '#fbbf24'], origin: { x: btn.getBoundingClientRect().x / window.innerWidth, y: btn.getBoundingClientRect().y / window.innerHeight } });
      const rect = btn.getBoundingClientRect();
      this.showFloatingXP(rect.left + rect.width / 2, rect.top, 5);
      this.checkQuest('favorite');
    }

    try {
      if (isFav) {
        await this.req(`/favorites/${id}`, 'DELETE');
      } else {
        await this.req('/favorites', 'POST', { rezept_id: id });
      }
      this.loadFavorites();
    } catch (e) {
      showToast("Fehler beim Favorisieren.", 'error');
    }
  },

  async loadComments(recipeId) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '<div style="color:var(--text-muted);">Lade Kommentare...</div>';
    try {
      const comments = await this.req(`/comments/${recipeId}`);
      if (comments.length === 0) {
        list.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">Noch keine Kommentare. Sei der Erste!</div>';
        return;
      }
      list.innerHTML = comments.map(c => `
        <div style="background: var(--surface); border: 1px solid var(--surface-border); padding: 1rem; border-radius: 12px; display: flex; gap: 1rem;">
           <img src="${c.profile_image_url ? HOST + '/' + c.profile_image_url : 'https://ui-avatars.com/api/?name=' + c.username + '&background=random'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
           <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                 <div><strong style="color: var(--primary);">@${c.username} <span style="font-size:0.7rem; color:white; background:var(--secondary); padding: 1px 4px; border-radius:4px;">Lvl ${c.level || 1}</span></strong></div>
                 <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(c.datum).toLocaleDateString()}</div>
              </div>
              <div style="line-height: 1.4;">${c.text}</div>
           </div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<div style="color:#ef4444;">Fehler beim Laden.</div>';
    }
  },

  async submitComment(e) {
    e.preventDefault();
    const recipeId = document.getElementById('viewRecipeModal').dataset.rezeptId;
    const textObj = document.getElementById('commentText');
    if (!recipeId || !textObj.value.trim()) return;

    try {
      await this.req('/comments', 'POST', { rezept_id: parseInt(recipeId), text: textObj.value.trim() });
      textObj.value = '';
      this.loadComments(recipeId); // refresh
    } catch (err) {
      alert("Senden fehlgeschlagen.");
    }
  },

  createRecipeCard(r) {
    const fallbackUrl = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const imgUrl = r.image_url ? `${HOST}/${r.image_url}` : fallbackUrl;
    const isTrending = this._trendingIds && this._trendingIds.has(r.rezept_id);
    const likeCount = r.likes || 0;
    const favCount = r.favorites_count || 0;

    return `
      <div class="recipe-card reveal">
        ${isTrending ? '<div class="trending-badge">🔥 Trending</div>' : ''}
        <div class="recipe-image-wrap">
          <img src="${imgUrl}" alt="${r.titel}" class="recipe-image" loading="lazy" onclick="app.viewRecipe(${r.rezept_id})" style="cursor:pointer;">
        </div>
        <div class="recipe-content">
          <div class="recipe-meta">
             <span class="recipe-author" onclick="event.stopPropagation(); app.openPublicProfile('${r.autor}')" style="cursor:pointer; font-weight:bold; color:var(--primary); transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">@${r.autor}</span>
             <span>${r.kategorie}</span>
          </div>
          <h3 class="recipe-title" onclick="app.viewRecipe(${r.rezept_id})" style="cursor:pointer; transition: color 0.3s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color=''">
             ${r.titel}
          </h3>
          
          ${r.tags ? `<div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1rem;">` +
        r.tags.split(',').map(t => `<span onclick="app.filterByTag('${t.trim()}'); event.stopPropagation();" style="cursor: pointer; font-size: 0.7rem; background: rgba(251, 113, 133, 0.1); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: 8px;">#${t.trim()}</span>`).join('') +
        `</div>` : ''}

          <div class="recipe-stats">
          <div class="stat-item" title="Zubereitungszeit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${r.zubereitungszeit + r.kochzeit}m
          </div>
          <div class="stat-item" title="Schwierigkeit">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>
             ${r.schwierigkeit}
          </div>
          <div style="flex:1"></div>
          
          <span class="like-btn-group" onclick="event.stopPropagation();">
            <button class="like-btn ${r.is_favorite ? 'liked' : ''}" onclick="app.toggleFavorite(${r.rezept_id}, this)" title="Zu Favoriten hinzufügen">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${r.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            <span class="like-counter">${favCount > 0 ? favCount : ''}</span>
          </span>
          
          <span class="like-btn-group" onclick="event.stopPropagation();" style="margin-left:0.25rem;">
            <button class="like-btn ${r.is_liked ? 'liked' : ''}" onclick="app.toggleLike(${r.rezept_id}, this)" title="Liken für XP!">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${r.is_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <span class="like-counter">${likeCount > 0 ? likeCount : ''}</span>
          </span>
        </div>
        </div>
      </div>
    `;
  },

  // ─── GAMIFICATION 2.0 ────────────────────────────────────────────────────────
  showFloatingXP(x, y, amount) {
    const el = document.createElement('div');
    el.className = 'floating-xp';
    el.textContent = `+${amount} XP`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  },

  showLevelUpModal(level) {
    // Only show modal if the container exists (prevent crashes if not added to HTML yet)
    let container = document.getElementById('levelUpModal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'levelUpModal';
      container.className = 'modal-overlay';
      container.innerHTML = `
        <div class="modal">
          <div class="level-up-content">
            <div class="level-up-icon">🏆</div>
            <div class="level-up-title">LEVEL UP!</div>
            <p style="color:var(--text); font-size:1.2rem; margin-bottom:1rem;">Du hast <strong style="color:var(--primary)">Level <span id="lvlUpNum"></span></strong> erreicht!</p>
            <p style="color:var(--text-muted); margin-bottom: 2rem;">Wundervoll! Dein neuer Rang erwartet dich.</p>
            <button class="btn-primary" onclick="closeModal('levelUpModal'); fireConfetti()">Ausgezeichnet</button>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    }
    document.getElementById('lvlUpNum').textContent = level;
    openModal('levelUpModal');
    fireConfetti();
    setTimeout(fireConfetti, 500);
  },

  initDailyQuests() {
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem('culinaryQuests')) || {};
    if (stored.date !== today) {
      this.quests = {
        date: today,
        like: 0,
        favorite: 0
      };
      localStorage.setItem('culinaryQuests', JSON.stringify(this.quests));
    } else {
      this.quests = stored;
    }
    this.renderDailyQuests();
  },

  checkQuest(type) {
    if (!this.quests) return;
    const maxVals = { like: 3, favorite: 2, recipe: 1 };
    if (this.quests[type] < maxVals[type]) {
      this.quests[type]++;
      localStorage.setItem('culinaryQuests', JSON.stringify(this.quests));
      this.renderDailyQuests();
      if (this.quests[type] === maxVals[type]) {
        showToast("Quest abgeschlossen! Bonus XP!", "success");
        // Opt: trigger XP request
      }
    }
  },

  renderDailyQuests() {
    if (!this.quests) return;
    const container = document.getElementById('profileMain');
    let qWidget = document.getElementById('dailyQuestsWidget');
    if (!container) return;

    if (!qWidget) {
      qWidget = document.createElement('div');
      qWidget.id = 'dailyQuestsWidget';
      qWidget.className = 'daily-quests';
      container.appendChild(qWidget);
    }

    const likeObj = this.quests.like >= 3;
    const favObj = this.quests.favorite >= 2;

    qWidget.innerHTML = `
      <h4>📜 Tägliche Quests</h4>
      <div class="quest-item ${likeObj ? 'completed' : ''}">
        <span>Entdecker: Like 3 Rezepte (${Math.min(this.quests.like, 3)}/3)</span>
        <span class="quest-reward">+15 XP</span>
      </div>
      <div class="quest-item ${favObj ? 'completed' : ''}">
        <span>Sammler: Speichere 2 Favoriten (${Math.min(this.quests.favorite, 2)}/2)</span>
        <span class="quest-reward">+10 XP</span>
      </div>
    `;
  },

  // ─── ZEN COOKING MODE ──────────────────────────────────────────────────────
  openZenMode(recipeId) {
    const r = this.loadedRecipes.find(x => x.rezept_id === recipeId);
    if (!r || !r.zubereitung) return;

    // Parse Markdown completely out and just get flat sentences or steps
    // Split by newlines, hash tags, or list items. Keep it simple.
    let rawText = r.zubereitung;
    // Strip markdown formatting simple regex
    rawText = rawText.replace(/[#*_-]/g, '').trim();
    this.zenSteps = rawText.split(/\r?\n/).filter(s => s.trim().length > 5);

    if (this.zenSteps.length === 0) {
      this.zenSteps = [rawText]; // fallback
    }

    this.zenStepIndex = 0;
    document.getElementById('zenOverlay').classList.add('active');

    closeModal('viewRecipeModal');
    this.requestWakeLock();
    this.renderZenStep();

    // Swipe support
    this._touchStartX = 0;
    const overlay = document.getElementById('zenOverlay');
    overlay.ontouchstart = (e) => this._touchStartX = e.changedTouches[0].screenX;
    overlay.ontouchend = (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (this._touchStartX - touchEndX > 50) this.zenNext();
      if (touchEndX - this._touchStartX > 50) this.zenPrev();
    };
  },

  closeZenMode() {
    document.getElementById('zenOverlay').classList.remove('active');
    this.releaseWakeLock();
    // clear any active timers
    const activeTimers = document.querySelectorAll('.zen-timer.active');
    activeTimers.forEach(el => el.classList.remove('active'));
  },

  zenNext() {
    if (this.zenStepIndex < this.zenSteps.length - 1) {
      this.zenStepIndex++;
      this.renderZenStep();
    } else {
      this.closeZenMode();
      showToast("Rezept abgeschlossen! Guten Appetit!", "success");
      fireConfetti();
    }
  },

  zenPrev() {
    if (this.zenStepIndex > 0) {
      this.zenStepIndex--;
      this.renderZenStep();
    }
  },

  renderZenStep() {
    const textEl = document.getElementById('zenStepText');
    const pBar = document.getElementById('zenProgress');

    textEl.style.opacity = '0';
    textEl.style.transform = 'translateY(20px)';

    setTimeout(() => {
      const stepText = this.zenSteps[this.zenStepIndex];
      textEl.innerHTML = this.generateTimers(stepText);
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';

      const pct = ((this.zenStepIndex) / (this.zenSteps.length - 1)) * 100 || 0;
      pBar.style.width = pct + '%';

      document.getElementById('zenPrevBtn').disabled = this.zenStepIndex === 0;
      const nextBtn = document.getElementById('zenNextBtn');
      if (this.zenStepIndex === this.zenSteps.length - 1) {
        nextBtn.innerHTML = 'Fertig 🎉';
      } else {
        nextBtn.innerHTML = 'Weiter &rarr;';
      }
    }, 300);
  },

  generateTimers(text) {
    // Regex matches "X Minuten", "X Min.", "X Min", "X m", "X Sekunden"
    const regex = /(\d+)\s*(minuten?|min\.?|m|sekunden?|sek\.?|s\b)\b/gi;
    return text.replace(regex, (match, num, unit) => {
      let seconds = parseInt(num);
      unit = unit.toLowerCase();
      if (unit.startsWith('m')) seconds *= 60;
      return `<span class="zen-timer" onclick="app.startZenTimer(this, ${seconds})">⏱️ ${match} Starten</span>`;
    });
  },

  startZenTimer(btn, seconds) {
    if (btn.dataset.running === 'true') return;
    btn.dataset.running = 'true';
    btn.classList.add('active');
    let timeLeft = seconds;

    const update = () => {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      btn.innerHTML = `⏱️ ${m}:${s.toString().padStart(2, '0')}`;
    };

    update();
    const iv = setInterval(() => {
      timeLeft--;
      update();
      if (timeLeft <= 0) {
        clearInterval(iv);
        btn.classList.remove('active');
        btn.innerHTML = `✔️ Fertig!`;
        btn.dataset.running = 'false';
        showToast("Ein Timer ist abgelaufen!", "info");
        // Play notification sound if possible
        try { const audio = new Audio('data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'); audio.play(); } catch (e) { }
      }
    }, 1000);
  },

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }
  },

  releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release().then(() => this.wakeLock = null);
    }
  }
};

window.onload = () => {
  app.init();

  // Scroll to Top toggler
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollToTopBtn');
    if (window.scrollY > 300) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }
  });
};
