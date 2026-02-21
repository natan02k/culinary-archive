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

const app = {
  isRegistering: false,
  user: null,
  loadedRecipes: [],

  init() {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    this.checkAuth();
    this.loadRecipes();
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
    const opts = { method, headers: {}, credentials: 'omit' };
    if (body) {
      if (body instanceof FormData) {
        opts.body = body; // let browser set content-type for multipart
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }
    // Very important: fetch with credentials
    opts.credentials = 'include';
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
        alert('Account erstellt! Willkommen bei EpicRecipes.');
      }
      await this.req('/login', 'POST', { username, password });
      closeModal('authModal');
      this.checkAuth();
    } catch (err) {
      alert(err.message);
    } finally {
      btnText.innerText = ogText;
    }
  },

  async checkAuth() {
    try {
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

    // XP logic: Next level every 100 XP
    const currentLevelBaseXP = (level - 1) * 100;
    const progressXP = xp - currentLevelBaseXP;
    document.getElementById('dashXpLabel').textContent = `${progressXP} / 100 XP`;
    document.getElementById('dashXpBar').style.width = `${progressXP}%`;

    // Profile Image
    if (profile_image_url) {
      document.getElementById('dashProfileImage').src = HOST + '/' + profile_image_url;
      document.getElementById('dashProfileImage').style.display = 'block';
      document.getElementById('dashProfileInitials').style.display = 'none';
    } else {
      document.getElementById('dashProfileImage').style.display = 'none';
      document.getElementById('dashProfileInitials').style.display = 'flex';
      if (username) {
        document.getElementById('dashProfileInitials').textContent = username.charAt(0).toUpperCase();
      }
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
    try {
      const recipes = await this.req('/all-recipes');
      this.loadedRecipes = recipes; // Store for the modal view

      const container = document.getElementById('recipesContainer');
      // Trigger search will handle populating the feed based on current filter values
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
      document.querySelectorAll('.recipe-grid .recipe-card').forEach(el => observer.observe(el));
    } catch (e) {
      console.error(e);
    }
  },

  triggerSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('searchCategory').value;

    // Clear ghost suggestion if query becomes empty or changes significantly
    if (!query) document.getElementById('searchInputGhost').value = '';

    const cleanQuery = query.replace(/^#/, ''); // Remove # if they typed it
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
      // Re-apply observers to new loaded content
      document.querySelectorAll('#recipesContainer .recipe-card').forEach(el => observer.observe(el));
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
      this.checkAuth(); // this will log them out and refresh UX
    } catch (err) {
      alert("Fehler beim Löschen des Accounts");
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

    // Optimistic UI update
    const isLiked = btn.classList.contains('liked');
    const icon = btn.querySelector('svg');
    if (isLiked) {
      btn.classList.remove('liked');
      icon.setAttribute('fill', 'none');
    } else {
      btn.classList.add('liked');
      icon.setAttribute('fill', 'currentColor');
    }

    // Server update
    try {
      await this.req('/toggle-like', 'POST', { rezept_id: id, action: isLiked ? 0 : 1 });
      if (!isLiked) {
        // If they just liked it, a little spark
        confetti({ particleCount: 30, spread: 50, origin: { x: btn.getBoundingClientRect().x / window.innerWidth, y: btn.getBoundingClientRect().y / window.innerHeight } });
        this.checkAuth(); // their local level might not change immediately unless it was their own recipe, but let's refresh just in case
      }
    } catch (e) {
      // Revert if error
      alert("Fehler beim Likes");
      this.loadRecipes();
    }
  },

  async loadFavorites() {
    if (!this.user) return;
    try {
      const favs = await this.req('/favorites');
      const container = document.getElementById('favoritesContainer');
      // Tag them so the heart/star icon renders correctly as liked
      const mapped = favs.map(r => { r.is_favorite = true; return r; });
      container.innerHTML = mapped.length > 0 ? mapped.map(r => this.createRecipeCard(r)).join('') : '<p style="color:var(--text-muted); grid-column:1/-1;">Du hast noch keine Favoriten.</p>';

      // Apply observers to new loaded content
      document.querySelectorAll('#favoritesContainer .recipe-card').forEach(el => observer.observe(el));
    } catch (e) { }
  },

  async toggleFavorite(id, btn) {
    if (!this.user) return openModal('authModal');
    const isFav = btn.classList.contains('liked');
    const icon = btn.querySelector('svg');

    // Optimistic UI
    if (isFav) {
      btn.classList.remove('liked');
      icon.setAttribute('fill', 'none');
    } else {
      btn.classList.add('liked');
      icon.setAttribute('fill', 'currentColor');
      // Little star explosion
      confetti({ particleCount: 20, spread: 70, shapes: ['star'], colors: ['#f59e0b', '#fbbf24'], origin: { x: btn.getBoundingClientRect().x / window.innerWidth, y: btn.getBoundingClientRect().y / window.innerHeight } });
    }

    try {
      if (isFav) {
        await this.req(`/favorites/${id}`, 'DELETE');
      } else {
        await this.req('/favorites', 'POST', { rezept_id: id });
      }
      this.loadFavorites(); // Refresh list silently
    } catch (e) {
      alert("Fehler beim Favorisieren.");
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

    return `
      <div class="recipe-card reveal">
        <img src="${imgUrl}" alt="${r.titel}" class="recipe-image" loading="lazy" onclick="app.viewRecipe(${r.rezept_id})" style="cursor:pointer;">
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
          
          <button class="like-btn ${r.is_favorite ? 'liked' : ''}" onclick="event.stopPropagation(); app.toggleFavorite(${r.rezept_id}, this)" title="Zu Favoriten hinzufügen" style="margin-right:0.5rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="${r.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          
          <button class="like-btn ${r.is_liked ? 'liked' : ''}" onclick="event.stopPropagation(); app.toggleLike(${r.rezept_id}, this)" title="Liken für XP!">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="${r.is_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        </div>
      </div>
    `;
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
