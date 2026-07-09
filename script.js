const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const icon = themeToggle ? themeToggle.querySelector("i") : null;
const currentTheme =
  localStorage.getItem("theme") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");

if (currentTheme === "light") {
  body.setAttribute("data-theme", "light");
  if (icon) icon.className = "fas fa-moon";
} else {
  body.setAttribute("data-theme", "dark");
  if (icon) icon.className = "fas fa-sun";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = body.getAttribute("data-theme") === "dark" || !body.getAttribute("data-theme");
    if (isDark) {
      body.setAttribute("data-theme", "light");
      if (icon) icon.className = "fas fa-moon";
      localStorage.setItem("theme", "light");
    } else {
      body.setAttribute("data-theme", "dark");
      if (icon) icon.className = "fas fa-sun";
      localStorage.setItem("theme", "dark");
    }
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Small helper to escape text for safe HTML insertion
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML;
}

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add("reveal");

    if (el.id === "skills") {
      const skillCards = el.querySelectorAll(".skill-card");
      skillCards.forEach((card, index) => {
        setTimeout(() => card.classList.add("animate"), index * 200);
      });
    }

    if (el.id === "experience") {
      const items = el.querySelectorAll(".timeline-item");
      items.forEach((it, idx) =>
        setTimeout(() => it.classList.add("in-view"), idx * 180),
      );
    }
  });
}, observerOptions);

document
  .querySelectorAll("section")
  .forEach((section) => observer.observe(section));

// Dynamic Projects Loading
const projectsGrid = document.getElementById("projectsGrid");
const filterBtns = document.querySelectorAll(".filter-btn");

async function fetchProjects() {
  if (!projectsGrid) return;
  try {
    const res = await fetch("/db/projects.json");
    const list = res.ok ? await res.json() : [];

    projectsGrid.innerHTML = "";
    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "project-card holo-card";
      card.dataset.category = p.category || "";
      card.innerHTML = `
        <div class="project-card-image-placeholder">
          <i class="fas fa-laptop-code"></i>
        </div>
        <div class="project-content">
          <span class="project-category">${escapeHtml(p.category || "")}</span>
          <h3>${escapeHtml(p.title || "")}</h3>
          <p>${escapeHtml(p.description || "")}</p>
          <div class="project-links">
            <a href="${p.live || "#"}" target="_blank" class="project-link">
              <i class="fas fa-external-link-alt"></i> Live Demo
            </a>
          </div>
        </div>
      `;
      // start hidden for animation
      card.style.opacity = "0";
      card.style.transform = "scale(0.95)";
      projectsGrid.appendChild(card);
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
      }, 10);
    });

    // Re-initialize modal listeners for new cards
    initializeModalListeners();
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

// Filter Logic
if (filterBtns && filterBtns.length > 0) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat =
        btn.dataset.filter || btn.getAttribute("data-filter") || "all";
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cards = projectsGrid.querySelectorAll(".project-card");
      cards.forEach((card) => {
        if (cat === "all" || card.dataset.category === cat) {
          card.style.display = "block";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
          }, 10);
        } else {
          card.style.opacity = "0";
          card.style.transform = "scale(0.8)";
          setTimeout(() => {
            card.style.display = "none";
          }, 300);
        }
      });
    });
  });
}

// Initial Load
fetchProjects();

function initializeModalListeners() {
  const projectCards = document.querySelectorAll(".project-card");
  const projectModal = document.getElementById("projectModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");

  projectCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent opening modal if clicking links
      if (e.target.closest("a")) return;

      const title = card.querySelector("h3")?.textContent || "Project";
      const desc =
        card.querySelector("p")?.textContent || "Project description";

      if (modalTitle) modalTitle.textContent = title;
      if (modalDescription) modalDescription.textContent = desc;
      if (projectModal) projectModal.classList.add("active");
    });
  });
}

const contactForm = document.getElementById("contactForm");
const statusMessage = document.getElementById("statusMessage");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let isValid = true;
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const subject = document.getElementById("subject").value.trim();

    if (!name || !email || !phone || !subject) {
      isValid = false;
      statusMessage.innerHTML =
        '<p style="color: #ff6b6b;">Iltimos, barcha maydonlarni to\'ldiring!</p>';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      isValid = false;
      statusMessage.innerHTML =
        "<p style=\"color: #ff6b6b;\">Email noto'g'ri!</p>";
      return;
    }

    if (isValid) {
      try {
        const response = await fetch("/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, subject }),
        });
        const data = await response.json();
        if (data.ok) {
          statusMessage.innerHTML =
            '<p style="color: #00ff88;">Xabar muvaffaqiyatli yuborildi! Tez orada javob beraman. ✨</p>';
          contactForm.reset();
        } else {
          statusMessage.innerHTML =
            '<p style="color: #ff6b6b;">Xato yuz berdi. Qayta urinib ko\'ring.</p>';
        }
      } catch (error) {
        statusMessage.innerHTML =
          '<p style="color: #ff6b6b;">Server xatosi: ' + error.message + "</p>";
      }
    }
  });
}

const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  if (!backToTop) return;
  if (window.pageYOffset > 300) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
  const header = document.getElementById("header");
  if (header) {
    if (window.pageYOffset > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
});
if (backToTop) backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

const mobileMenu = document.querySelector(".mobile-menu");
const navLinks = document.querySelector(".nav-links");

function openMobileMenu() {
  if (!navLinks || !mobileMenu) return;
  navLinks.classList.add("open");
  mobileMenu.classList.add("open");
  document.body.classList.add("menu-open");
  mobileMenu.setAttribute("aria-expanded", "true");
}

function closeMobileMenu() {
  if (!navLinks || !mobileMenu) return;
  navLinks.classList.remove("open");
  mobileMenu.classList.remove("open");
  document.body.classList.remove("menu-open");
  mobileMenu.setAttribute("aria-expanded", "false");
}

if (mobileMenu) {
  mobileMenu.setAttribute("role", "button");
  mobileMenu.setAttribute("aria-expanded", "false");
  mobileMenu.addEventListener("click", (e) => {
    if (navLinks && navLinks.classList.contains("open")) closeMobileMenu();
    else openMobileMenu();
  });

  // Close when clicking outside the menu area
  document.addEventListener("click", (e) => {
    if (!navLinks || !mobileMenu) return;
    if (!navLinks.classList.contains("open")) return;
    if (e.target.closest(".nav-links") || e.target.closest(".mobile-menu"))
      return;
    closeMobileMenu();
  });

  // Close when a nav link is clicked (mobile)
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeMobileMenu();
    });
  });
}

function animateCounters() {
  const counters = document.querySelectorAll(".stat h4");
  counters.forEach((counter) => {
    const target = parseInt(counter.textContent);
    let count = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
      count += increment;
      if (count >= target) {
        counter.textContent = target + "+";
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(count) + "+";
      }
    }, 20);
  });
}
const aboutSection = document.getElementById("about");
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounters();
      counterObserver.unobserve(entry.target);
    }
  });
});
if (aboutSection) {
  counterObserver.observe(aboutSection);
}

window.addEventListener("load", () => {
  const loading = document.getElementById("loading");
  setTimeout(() => {
    loading.classList.add("hidden");
  }, 1000);
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
const handleResize = debounce(() => {
  if (!navLinks || !mobileMenu) return;
  if (window.innerWidth > 768) {
    // ensure desktop layout
    navLinks.classList.remove("open");
    mobileMenu.classList.remove("open");
    document.body.classList.remove("menu-open");
    navLinks.style.display = "flex";
    navLinks.style.flexDirection = "row";
  } else {
    // mobile: hide desktop inline styles
    navLinks.style.display = "none";
    navLinks.style.flexDirection = "column";
  }
}, 250);
window.addEventListener("resize", handleResize);
document.addEventListener("DOMContentLoaded", () => {
  // ensure mobile menu closed on load
  try {
    closeMobileMenu();
  } catch (e) {}
  document.querySelector(".hero").classList.add("reveal");
  // Load site data (testimonials, certificates, contact links)
  fetchSite();
});

// Fetch site data from API and render testimonials/certificates/contact
async function fetchSite() {
  try {
    const res = await fetch("/db/site.json");
    if (!res.ok) throw new Error("Failed to fetch site");
    const site = await res.json();
    renderTestimonials(site.testimonials || []);
    renderCertificates(site.certificates || []);
    updateContactLinks(site.contact || {});
  } catch (err) {
    console.error("Site load error:", err);
  }
}

function renderTestimonials(list) {
  const container =
    document.getElementById("dynamicTestimonials") ||
    document.getElementById("testimonialsContainer");
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML =
      '<p style="text-align:center; color:var(--text-secondary);">No testimonials yet.</p>';
    return;
  }
  container.innerHTML = list
    .map(
      (t) => `
    <div class="testimonial-card">
      <div class="testimonial-content">
        <div class="quote-icon"><i class="fas fa-quote-left"></i></div>
        <p>${escapeHtml(t.text)}</p>
      </div>
      <div class="testimonial-author">
        <div class="author-avatar"><i class="fas fa-user"></i></div>
        <div class="author-info">
          <h4>${escapeHtml(t.author)}</h4>
          <p>${escapeHtml(t.role || "")}</p>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
  // Re-init slider so new testimonials are included
  if (typeof setupTestimonialSlider === "function") setupTestimonialSlider();
}

function renderCertificates(list) {
  const container =
    document.getElementById("dynamicCertificates") ||
    document.getElementById("certificatesContainer");
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML =
      '<p style="text-align:center; color:var(--text-secondary);">No certificates yet.</p>';
    return;
  }
  container.innerHTML = list
    .map(
      (c) => `
    <div class="certificate-card holo-card">
      <div class="certificate-icon"><i class="fas fa-award"></i></div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.issuer || "")}</p>
      <span class="certificate-date">${escapeHtml(c.date || "")}</span>
    </div>
  `,
    )
    .join("");
}

function updateContactLinks(contact) {
  if (!contact) return;
  const socialLinks = document.querySelectorAll(".social-links a");
  if (!socialLinks) return;
  // Update known links
  const map = contact.links || {};
  const hrefs = {
    github: map.github || "#",
    linkedin: map.linkedin || "#",
    telegram: map.telegram || "#",
    instagram: map.instagram || "#",
  };
  socialLinks.forEach((a) => {
    const title = (a.getAttribute("title") || "").toLowerCase();
    if (title.includes("github")) a.href = hrefs.github;
    if (title.includes("linkedin")) a.href = hrefs.linkedin;
    if (title.includes("telegram")) a.href = hrefs.telegram;
    if (title.includes("instagram")) a.href = hrefs.instagram;
  });
}

const languageToggle = document.getElementById("languageToggle");
const translateElement = document.getElementById("google_translate_element");
if (languageToggle && translateElement) {
  languageToggle.addEventListener("click", () => {
    translateElement.style.display =
      translateElement.style.display === "block" ? "none" : "block";
  });
} else if (translateElement) {
  // show translate selector by default when the toggle button is removed
  translateElement.style.display = "block";
}

const buttons = document.querySelectorAll(".btn");
buttons.forEach((button) => {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple");
    this.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.body.classList.contains("menu-open")) {
      closeMobileMenu();
    }
  }
});

const focusableElements = document.querySelectorAll(
  "a, button, input, textarea, [tabindex]",
);
focusableElements.forEach((el) => {
  el.addEventListener("focus", () => {
    el.style.outline = "2px solid var(--primary-color)";
    el.style.outlineOffset = "2px";
  });
  el.addEventListener("blur", () => {
    el.style.outline = "none";
  });
});
// ============================================
// PROFESSIONAL PORTFOLIO ENHANCEMENTS
// ============================================

// 1. Scroll Progress Bar
const scrollProgress = document.getElementById("scrollProgress");
window.addEventListener("scroll", () => {
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  if (scrollProgress) {
    scrollProgress.style.width = progress + "%";
  }
});

// 2. Custom Cursor
const cursor = document.getElementById("cursor");
const cursorFollower = document.getElementById("cursor-follower");

if (cursor && cursorFollower) {
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    cursorFollower.style.left = e.clientX + "px";
    cursorFollower.style.top = e.clientY + "px";
  });

  const hoverElements = document.querySelectorAll(
    "a, button, .project-card, .skill-card",
  );
  hoverElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("hover");
      cursorFollower.classList.add("hover");
    });
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("hover");
      cursorFollower.classList.remove("hover");
    });
  });
}

// 3. Typing Animation
const typedTextElement = document.getElementById("typedText");
const textArray = [
  "Full Stack Developer",
  "Frontend Expert",
  "Python Developer",
  "Problem Solver",
  "Creative Coder",
];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeText() {
  if (!typedTextElement) return;

  const currentText = textArray[textIndex];

  if (isDeleting) {
    typedTextElement.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typedTextElement.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }

  let typeSpeed = isDeleting ? 50 : 100;

  if (!isDeleting && charIndex === currentText.length) {
    typeSpeed = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % textArray.length;
    typeSpeed = 500;
  }

  setTimeout(typeText, typeSpeed);
}

setTimeout(typeText, 1000);

// 4. Particles Background
function createParticles() {
  const container = document.getElementById("particles-container");
  if (!container) return;

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = Math.random() * 10 + 10 + "s";
    particle.style.animationDelay = Math.random() * 10 + "s";
    particle.style.width = Math.random() * 5 + 2 + "px";
    particle.style.height = particle.style.width;

    const colors = ["#00d9ff", "#b537ff", "#ff00ff", "#00ff88"];
    particle.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    particle.style.boxShadow = `0 0 10px ${particle.style.background}`;

    container.appendChild(particle);
  }
}

createParticles();

// 5. Testimonials Slider (re-initializable to include dynamic testimonials)
let testimonialIntervalId = null;
let testimonialCards = [];
let dots = [];
let currentTestimonial = 0;

function showTestimonial(index) {
  testimonialCards.forEach((card, i) => {
    card.classList.remove("active");
    if (dots[i]) dots[i].classList.remove("active");
  });

  if (testimonialCards[index]) {
    testimonialCards[index].classList.add("active");
  }
  if (dots[index]) {
    dots[index].classList.add("active");
  }
  currentTestimonial = index;
}

function setupTestimonialSlider() {
  // refresh nodes
  testimonialCards = Array.from(document.querySelectorAll(".testimonial-card"));
  dots = Array.from(document.querySelectorAll(".testimonial-dots .dot"));

  // remove previous dot handlers
  dots.forEach((dot, idx) => {
    dot.replaceWith(dot.cloneNode(true));
  });
  dots = Array.from(document.querySelectorAll(".testimonial-dots .dot"));

  dots.forEach((dot, idx) =>
    dot.addEventListener("click", () => showTestimonial(idx)),
  );

  // start autoplay
  if (testimonialIntervalId) clearInterval(testimonialIntervalId);
  if (testimonialCards.length > 0) {
    currentTestimonial = 0;
    showTestimonial(0);
    testimonialIntervalId = setInterval(() => {
      if (testimonialCards.length > 0) {
        currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
        showTestimonial(currentTestimonial);
      }
    }, 5000);
  }
}

// initialize on load
setupTestimonialSlider();

// 6. Timeline & Skill Card Scroll-In Animations
const timelineItems = document.querySelectorAll(".timeline-item");
const skillCards = document.querySelectorAll(".skill-card");

const scrollInObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      scrollInObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

timelineItems.forEach((item) => scrollInObserver.observe(item));

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const fill = entry.target.querySelector(".progress-fill");
      const level = entry.target.dataset.skill;
      if (fill && level) {
        fill.style.setProperty("--skill-level", level + "%");
        entry.target.classList.add("animate");
      }
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

skillCards.forEach((card) => skillObserver.observe(card));

const projectModal = document.getElementById("projectModal");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");

// Modal listeners are now handled in initializeModalListeners() called after renderProjects

if (modalClose) {
  modalClose.addEventListener("click", () => {
    projectModal.classList.remove("active");
  });
}

if (projectModal) {
  projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) {
      projectModal.classList.remove("active");
    }
  });
}

const downloadCV = document.getElementById("downloadCV");
if (downloadCV) {
  downloadCV.addEventListener("click", (e) => {
    e.preventDefault();
    alert("CV download will be available soon! Contact me for my resume.");
  });
}

function animateValue(element, start, end, duration) {
  const startTime = performance.now();
  const suffix = element.textContent.includes("+") ? "+" : "";

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeOut);

    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const heroImage = document.querySelector(".hero-image");
  if (heroImage) {
    heroImage.style.transform = `translateY(${scrolled * 0.1}px)`;
  }
});

const clickSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";
  gainNode.gain.value = 0.1;

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.1,
  );
  oscillator.stop(audioContext.currentTime + 0.1);
};

console.log(" Portfolio enhancements loaded successfully!");

// =============================================================
// MASTER SCROLL-REVEAL CONTROLLER
// =============================================================
(function initScrollReveal() {
  const opts = { threshold: 0.15 };

  // 1. Section Titles — clip-path wipe
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("title-revealed");
      }
    });
  }, { threshold: 0.2 }).forEach
    ? null
    : void 0;
  document.querySelectorAll(".section-title").forEach(el => {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("title-revealed");
        }
      });
    }, { threshold: 0.3 }).observe(el);
  });

  // 2. About image + text — left/right split
  const aboutImg = document.querySelector(".about-image");
  const aboutTxt = document.querySelector(".about-text");
  if (aboutImg || aboutTxt) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (aboutImg) aboutImg.classList.add("about-img-revealed");
          if (aboutTxt) aboutTxt.classList.add("about-text-revealed");
        }
      });
    }, opts).observe(document.getElementById("about") || document.body);
  }

  // 3. Stats — drop from above
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll(".stat").forEach(s => s.classList.add("stat-revealed"));
      }
    });
  }, opts).observe(document.querySelector(".about-stats") || document.body);

  // 4. Timeline — grow like a tree
  const timeline = document.querySelector(".timeline");
  if (timeline) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          timeline.classList.add("tree-growing");
          // Items sprout after trunk starts growing
          document.querySelectorAll(".timeline-item").forEach((item, i) => {
            setTimeout(() => item.classList.add("in-view"), 300 + i * 320);
          });
        }
      });
    }, { threshold: 0.05 }).observe(timeline);
  }

  // 5. Certificates — burst from corners
  const certGrid = document.querySelector(".certificates-grid");
  if (certGrid) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll(".certificate-card").forEach(c => c.classList.add("cert-revealed"));
        }
      });
    }, { threshold: 0.1 }).observe(certGrid);
  }

  // 6. Project cards — pop up (also re-run after dynamic load)
  function revealProjects() {
    const projGrid = document.querySelector(".projects-grid");
    if (!projGrid) return;
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll(".project-card").forEach(c => c.classList.add("proj-revealed"));
        }
      });
    }, { threshold: 0.05 }).observe(projGrid);
  }
  revealProjects();
  // Re-observe after dynamic project fetch completes
  setTimeout(revealProjects, 2500);

  // 7. Hobbies & languages — slide left one by one
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll(".hobby-language-item").forEach(i => i.classList.add("hobby-revealed"));
      }
    });
  }, { threshold: 0.1 }).observe(document.getElementById("skills") || document.body);

  // 8. Testimonials — fade+scale
  const slider = document.querySelector(".testimonials-slider");
  if (slider) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) slider.classList.add("slider-revealed");
      });
    }, opts).observe(slider);
  }

  // 9. Contact — left / right split
  const contactInfo = document.querySelector(".contact-info");
  const contactMsg  = document.querySelector(".message");
  if (contactInfo || contactMsg) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (contactInfo) contactInfo.classList.add("contact-revealed");
          if (contactMsg)  contactMsg.classList.add("message-revealed");
        }
      });
    }, opts).observe(document.getElementById("contact") || document.body);
  }

  // 10. Footer — fade up
  const footer = document.querySelector("footer");
  if (footer) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) footer.classList.add("footer-revealed");
      });
    }, { threshold: 0.1 }).observe(footer);
  }
})();

