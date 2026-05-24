// ============================================
// PREMIUM ADMIN PANEL - JAVASCRIPT
// ============================================

const API_URL = "/api";

// ============================================
// STATE MANAGEMENT
// ============================================
let token = localStorage.getItem("adminToken");
let projects = [];
let messages = [];
let editingProjectId = null;
let deletingProjectId = null;

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  // Login
  loginOverlay: document.getElementById("loginOverlay"),
  dashboard: document.getElementById("dashboard"),
  loginForm: document.getElementById("loginForm"),
  loginError: document.getElementById("loginError"),

  // Navigation
  tabs: document.querySelectorAll(".sidebar-nav li[data-tab]"),
  tabContents: document.querySelectorAll(".tab-content"),
  logoutBtn: document.getElementById("logoutBtn"),
  menuToggle: document.getElementById("menuToggle"),
  sidebar: document.querySelector(".sidebar"),

  projectCount: document.getElementById("projectCount"),
  messageCount: document.getElementById("messageCount"),
  msgBadge: document.getElementById("msgBadge"),
  currentDate: document.getElementById("currentDate"),
  recentProjects: document.getElementById("recentProjects"),

  projectsList: document.getElementById("projectsList"),
  projectModal: document.getElementById("projectModal"),
  addProjectBtn: document.getElementById("addProjectBtn"),
  quickAddProject: document.getElementById("quickAddProject"),
  closeModalBtns: document.querySelectorAll(".close-modal, .close-modal-btn"),
  projectForm: document.getElementById("projectForm"),
  modalTitle: document.getElementById("modalTitle"),

  deleteModal: document.getElementById("deleteModal"),
  confirmDelete: document.getElementById("confirmDelete"),
  cancelDelete: document.getElementById("cancelDelete"),

  // Messages
  messagesList: document.getElementById("messagesList"),
  quickViewMessages: document.getElementById("quickViewMessages"),
  clearAllMessages: document.getElementById("clearAllMessages"),

  // Toast
  toastContainer: document.getElementById("toastContainer"),

  // Particles
  particles: document.getElementById("particles"),
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initParticles();
  setCurrentDate();

  if (token) {
    showDashboard();
  }

  initEventListeners();
});

// ============================================
// THEME TOGGLE
// ============================================
function initTheme() {
  const savedTheme = localStorage.getItem("adminTheme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("adminTheme", newTheme);
  updateThemeIcon(newTheme);

  showToast(`Switched to ${newTheme} mode`, "info");
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const icon = themeToggle.querySelector("i");
    if (icon) {
      icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
  }
}

// ============================================
// PARTICLE EFFECTS
// ============================================
function initParticles() {
  if (!elements.particles) return;

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 15 + "s";
    particle.style.animationDuration = 15 + Math.random() * 10 + "s";
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    particle.style.width = particle.style.height = 2 + Math.random() * 4 + "px";

    const colors = ["#6366f1", "#ec4899", "#06b6d4", "#10b981"];
    particle.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    particle.style.boxShadow = `0 0 10px ${particle.style.background}`;

    elements.particles.appendChild(particle);
  }
}

// ============================================
// DATE DISPLAY
// ============================================
function setCurrentDate() {
  if (elements.currentDate) {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    elements.currentDate.textContent = new Date().toLocaleDateString(
      "en-US",
      options,
    );
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = "info") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-circle",
    info: "fa-info-circle",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

  elements.toastContainer.appendChild(toast);

  // Auto remove
  const timeout = setTimeout(() => removeToast(toast), 5000);

  // Manual close
  toast.querySelector(".toast-close").addEventListener("click", () => {
    clearTimeout(timeout);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.classList.add("removing");
  setTimeout(() => toast.remove(), 300);
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
  // Login Form
  elements.loginForm.addEventListener("submit", handleLogin);

  // Logout
  elements.logoutBtn.addEventListener("click", handleLogout);

  // Mobile Menu Toggle
  if (elements.menuToggle) {
    elements.menuToggle.addEventListener("click", () => {
      elements.sidebar.classList.toggle("open");
    });
  }

  // Tab Navigation
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab));
  });

  // Quick Actions
  if (elements.quickAddProject) {
    elements.quickAddProject.addEventListener("click", () => {
      switchToTab("projects");
      openProjectModal();
    });
  }

  if (elements.quickViewMessages) {
    elements.quickViewMessages.addEventListener("click", () => {
      switchToTab("messages");
    });
  }

  // Add Project Button
  if (elements.addProjectBtn) {
    elements.addProjectBtn.addEventListener("click", openProjectModal);
  }

  // Close Modal Buttons
  elements.closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeProjectModal);
  });

  // Modal Backdrop Click
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      closeProjectModal();
      closeDeleteModal();
    });
  });

  // Project Form Submit
  elements.projectForm.addEventListener("submit", handleProjectSubmit);

  // Delete Modal
  if (elements.confirmDelete) {
    elements.confirmDelete.addEventListener("click", confirmDeleteProject);
  }
  if (elements.cancelDelete) {
    elements.cancelDelete.addEventListener("click", closeDeleteModal);
  }

  // Clear All Messages
  if (elements.clearAllMessages) {
    elements.clearAllMessages.addEventListener("click", handleClearAllMessages);
  }

  // Close sidebar on outside click (mobile)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 1024) {
      if (
        !elements.sidebar.contains(e.target) &&
        !elements.menuToggle.contains(e.target) &&
        elements.sidebar.classList.contains("open")
      ) {
        elements.sidebar.classList.remove("open");
      }
    }
  });
}

// ============================================
// AUTHENTICATION
// ============================================
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.ok) {
      // Site editor (load/save)
      const loadSiteBtn = document.getElementById("loadSiteBtn");
      const saveSiteBtn = document.getElementById("saveSiteBtn");
      const siteEditor = document.getElementById("siteJsonEditor");
      if (loadSiteBtn)
        loadSiteBtn.addEventListener("click", async () => {
          try {
            const res = await fetch(`${API_URL}/site`);
            const data = await res.json();
            siteEditor.value = JSON.stringify(data, null, 2);
            showToast("Site data loaded", "success");
          } catch (err) {
            showToast("Failed to load site data", "error");
          }
        });
      if (saveSiteBtn)
        saveSiteBtn.addEventListener("click", async () => {
          try {
            const payload = JSON.parse(siteEditor.value);
            const res = await fetch(`${API_URL}/site`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.ok) {
              showToast("Site data saved", "success");
              await loadDashboardData();
            } else {
              showToast("Failed to save site data", "error");
            }
          } catch (err) {
            showToast("Invalid JSON or save error", "error");
          }
        });
      token = data.token;
      localStorage.setItem("adminToken", token);
      showDashboard();
      showToast("Welcome back, Admin!", "success");
    } else {
      elements.loginError.textContent = data.error || "Invalid credentials";
      elements.loginError.style.animation = "none";
      setTimeout(
        () => (elements.loginError.style.animation = "shake 0.5s ease"),
        10,
      );
    }
  } catch (err) {
    elements.loginError.textContent = "Connection error. Please try again.";
    showToast("Connection error", "error");
  }
}

function handleLogout() {
  token = null;
  localStorage.removeItem("adminToken");
  elements.loginOverlay.classList.remove("hidden");
  elements.dashboard.classList.add("hidden");
  showToast("Logged out successfully", "info");

  // Reset form
  elements.loginForm.reset();
  elements.loginError.textContent = "";
}

function showDashboard() {
  elements.loginOverlay.classList.add("hidden");
  elements.dashboard.classList.remove("hidden");

  // Load initial data
  loadDashboardData();
}

async function loadDashboardData() {
  await Promise.all([loadProjects(), loadMessages()]);
  updateStats();
  renderRecentProjects();
}

// ============================================
// TAB NAVIGATION
// ============================================
function switchTab(tab) {
  const targetId = tab.getAttribute("data-tab");
  switchToTab(targetId);
}

function switchToTab(targetId) {
  // Update tab states
  elements.tabs.forEach((t) => t.classList.remove("active"));
  document.querySelector(`[data-tab="${targetId}"]`)?.classList.add("active");

  // Update content
  elements.tabContents.forEach((c) => c.classList.remove("active"));
  document.getElementById(`${targetId}Tab`)?.classList.add("active");

  // Close mobile sidebar
  if (window.innerWidth <= 1024) {
    elements.sidebar.classList.remove("open");
  }

  // Load data based on tab
  if (targetId === "projects") loadProjects();
  if (targetId === "messages") loadMessages();
}

// ============================================
// STATS
// ============================================
function updateStats() {
  // Animate numbers
  animateNumber(elements.projectCount, projects.length);
  animateNumber(elements.messageCount, messages.length);

  if (elements.msgBadge) {
    elements.msgBadge.textContent = messages.length;
    elements.msgBadge.style.display = messages.length > 0 ? "block" : "none";
  }
}

function animateNumber(element, target) {
  if (!element) return;

  let current = 0;
  const increment = target / 30;
  const duration = 1000;
  const stepTime = duration / 30;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepTime);
}

// ============================================
// PROJECTS MANAGEMENT
// ============================================
async function loadProjects() {
  try {
    const res = await fetch(`${API_URL}/projects`);
    projects = await res.json();
    renderProjects();
  } catch (err) {
    showToast("Failed to load projects", "error");
  }
}

function renderProjects() {
  if (!elements.projectsList) return;

  if (projects.length === 0) {
    elements.projectsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Yet</h3>
                <p>Click "Add New Project" to create your first project</p>
            </div>
        `;
    return;
  }

  elements.projectsList.innerHTML = projects
    .map(
      (p) => `
        <div class="project-card" data-id="${p.id}">
            <div class="project-card-header">
                <div class="project-card-icon">
                    <i class="${p.icon || "fas fa-code"}"></i>
                </div>
                <div class="project-card-title">
                    <h3>${escapeHtml(p.title)}</h3>
                    <span class="project-card-category">${getCategoryEmoji(p.category)} ${p.category}</span>
                </div>
            </div>
            <div class="project-card-body">
                <p class="project-card-desc">${escapeHtml(p.description)}</p>
                <div class="project-card-links">
                    ${p.live ? `<a href="${p.live}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> Live</a>` : ""}
                </div>
                <div class="project-card-actions">
                    <button class="btn-edit" onclick="openEditModal(${p.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="openDeleteModal(${p.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderRecentProjects() {
  if (!elements.recentProjects) return;

  const recent = projects.slice(0, 4);

  if (recent.length === 0) {
    elements.recentProjects.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Recent Projects</h3>
                <p>Your latest projects will appear here</p>
            </div>
        `;
    return;
  }

  elements.recentProjects.innerHTML = recent
    .map(
      (p) => `
        <div class="recent-project-card">
            <div class="recent-project-icon">
                <i class="${p.icon || "fas fa-code"}"></i>
            </div>
            <div class="recent-project-info">
                <h4>${escapeHtml(p.title)}</h4>
                <p>${p.category}</p>
            </div>
        </div>
    `,
    )
    .join("");
}

function getCategoryEmoji(category) {
  const emojis = { web: "🌐", app: "📱", game: "🎮" };
  return emojis[category] || "📁";
}

function openProjectModal() {
  editingProjectId = null;
  elements.modalTitle.innerHTML =
    '<i class="fas fa-folder-plus"></i> Add Project';
  elements.projectForm.reset();
  elements.projectModal.classList.remove("hidden");
}

function openEditModal(id) {
  const project = projects.find((p) => p.id === id);
  if (!project) return;

  editingProjectId = id;
  elements.modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Project';

  document.getElementById("pTitle").value = project.title;
  document.getElementById("pCategory").value = project.category;
  document.getElementById("pIcon").value = project.icon || "";
  document.getElementById("pDesc").value = project.description;
  document.getElementById("pGithub").value = project.github || "";
  document.getElementById("pLive").value = project.live || "";

  elements.projectModal.classList.remove("hidden");
}

function closeProjectModal() {
  elements.projectModal.classList.add("hidden");
  editingProjectId = null;
}

async function handleProjectSubmit(e) {
  e.preventDefault();

  const projectData = {
    title: document.getElementById("pTitle").value,
    category: document.getElementById("pCategory").value,
    icon: document.getElementById("pIcon").value,
    description: document.getElementById("pDesc").value,
    github: document.getElementById("pGithub").value,
    live: document.getElementById("pLive").value,
  };

  try {
    if (editingProjectId) {
      // Update existing project
      await fetch(`${API_URL}/projects/${editingProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      showToast("Project updated successfully!", "success");
    } else {
      // Create new project
      await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      showToast("Project created successfully!", "success");
    }

    closeProjectModal();
    await loadDashboardData();
  } catch (err) {
    showToast("Failed to save project", "error");
  }
}

function openDeleteModal(id) {
  deletingProjectId = id;
  elements.deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  elements.deleteModal.classList.add("hidden");
  deletingProjectId = null;
}

async function confirmDeleteProject() {
  if (!deletingProjectId) return;

  try {
    await fetch(`${API_URL}/projects/${deletingProjectId}`, {
      method: "DELETE",
    });
    showToast("Project deleted successfully!", "success");
    closeDeleteModal();
    await loadDashboardData();
  } catch (err) {
    showToast("Failed to delete project", "error");
  }
}

// ============================================
// MESSAGES MANAGEMENT
// ============================================
async function loadMessages() {
  try {
    const res = await fetch(`${API_URL}/messages`);
    messages = await res.json();
    renderMessages();
    updateStats();
  } catch (err) {
    showToast("Failed to load messages", "error");
  }
}

function renderMessages() {
  if (!elements.messagesList) return;

  if (messages.length === 0) {
    elements.messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope-open"></i>
                <h3>No Messages</h3>
                <p>Messages from your contact form will appear here</p>
            </div>
        `;
    return;
  }

  elements.messagesList.innerHTML = messages
    .reverse()
    .map(
      (m) => `
        <div class="message-card" data-id="${m.id || m.date}">
            <div class="message-header">
                <div class="message-sender">
                    <div class="message-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="message-sender-info">
                        <h4>${escapeHtml(m.name)}</h4>
                        <p>${escapeHtml(m.email)}</p>
                    </div>
                </div>
                <div class="message-date">
                    <i class="fas fa-clock"></i>
                    ${formatDate(m.date)}
                </div>
            </div>
            <div class="message-body">
                <p class="message-subject">${escapeHtml(m.subject)}</p>
                <p class="message-phone">
                    <i class="fas fa-phone"></i>
                    ${escapeHtml(m.phone)}
                </p>
            </div>
            <div class="message-actions">
                <a href="mailto:${m.email}" class="msg-btn reply">
                    <i class="fas fa-reply"></i> Reply
                </a>
                <button class="msg-btn delete" onclick="deleteMessage('${m.date}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

async function deleteMessage(date) {
  try {
    await fetch(`${API_URL}/messages/${encodeURIComponent(date)}`, {
      method: "DELETE",
    });
    showToast("Message deleted", "success");
    await loadMessages();
  } catch (err) {
    showToast("Failed to delete message", "error");
  }
}

async function handleClearAllMessages() {
  if (!confirm("Are you sure you want to delete all messages?")) return;

  try {
    // Delete messages one by one (would be better as batch API)
    for (const m of messages) {
      await fetch(`${API_URL}/messages/${encodeURIComponent(m.date)}`, {
        method: "DELETE",
      });
    }
    showToast("All messages cleared", "success");
    await loadMessages();
  } catch (err) {
    showToast("Failed to clear messages", "error");
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Make functions available globally for onclick handlers
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.deleteMessage = deleteMessage;
