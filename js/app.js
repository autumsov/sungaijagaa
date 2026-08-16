// Default Data Configuration
const FALLBACK_WHATSAPP = "6281234567890";
const FALLBACK_HERO_IMAGE = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80";
const FALLBACK_KADES_NAME = "Bpk. Supriadi";

// Security Sanitization Helpers (XSS Protection)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url) {
  if (!url) return "";
  const clean = String(url).trim();
  if (/^(https?:\/\/|data:image\/|\.\/|\/)/i.test(clean)) {
    return clean;
  }
  return "";
}

const DEFAULT_GALLERY = [
  {
    id: "g1",
    src: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80",
    title: "Aliran Hulu Rimbun"
  },
  {
    id: "g2",
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    title: "Hutan Tropis Tepi Sungai"
  },
  {
    id: "g3",
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    title: "Kabut Pagi Kalimantan"
  },
  {
    id: "g4",
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
    title: "Perahu Tradisional Nelayan"
  }
];

// Load and Render Data from LocalStorage or Supabase Database
async function loadPageData() {
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

  let whatsapp = FALLBACK_WHATSAPP;
  let kadesName = FALLBACK_KADES_NAME;
  let heroImage = FALLBACK_HERO_IMAGE;
  let galleryData = DEFAULT_GALLERY;

  if (client) {
    try {
      // 1. Fetch settings from Supabase 'settings' table
      const { data: settings, error: settingsError } = await client
        .from('settings')
        .select('*');

      if (!settingsError && settings && settings.length > 0) {
        const settingsMap = {};
        settings.forEach(row => {
          settingsMap[row.key] = row.value;
        });
        if (settingsMap.sj_whatsapp) whatsapp = settingsMap.sj_whatsapp;
        if (settingsMap.sj_kades_name) kadesName = settingsMap.sj_kades_name;
        if (settingsMap.sj_hero_image) heroImage = settingsMap.sj_hero_image;
      }

      // 2. Fetch gallery items from Supabase 'gallery' table
      const { data: galleryItems, error: galleryError } = await client
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (!galleryError && galleryItems) {
        galleryData = galleryItems.map(item => ({
          id: item.id,
          src: item.src,
          title: item.title
        }));
      }
    } catch (err) {
      console.warn("Koneksi Supabase gagal/belum dikonfigurasi, menggunakan LocalStorage fallback:", err);
    }
  } else {
    // LocalStorage Fallback Mode
    whatsapp = localStorage.getItem("sj_whatsapp") || FALLBACK_WHATSAPP;
    kadesName = localStorage.getItem("sj_kades_name") || FALLBACK_KADES_NAME;
    heroImage = localStorage.getItem("sj_hero_image") || FALLBACK_HERO_IMAGE;
    try {
      const raw = localStorage.getItem("sj_gallery");
      galleryData = raw ? JSON.parse(raw) : DEFAULT_GALLERY;
    } catch (e) {
      galleryData = DEFAULT_GALLERY;
    }
  }

  // 1. WhatsApp Sync
  whatsapp = String(whatsapp).replace(/\D/g, "");
  if (whatsapp.startsWith("0")) {
    whatsapp = "62" + whatsapp.slice(1);
  } else if (whatsapp.startsWith("+")) {
    whatsapp = whatsapp.slice(1);
  }
  
  const whatsappUrl = `https://wa.me/${encodeURIComponent(whatsapp)}?text=Halo%20Semesta%20Desa%20Sungai%20Jaga%20A%2C%20saya%20ingin%20bertanya%20mengenai...`;
  
  document.querySelectorAll(".btn-whatsapp").forEach(btn => {
    btn.href = whatsappUrl;
  });

  // 2. Kades Name
  const kadesElement = document.getElementById("kadesName");
  if (kadesElement) {
    kadesElement.textContent = kadesName;
  }

  // 3. Hero Image Sync
  const cleanHeroImage = sanitizeUrl(heroImage) || FALLBACK_HERO_IMAGE;
  const heroBgElement = document.getElementById("heroBg");
  if (heroBgElement) {
    heroBgElement.style.backgroundImage = `linear-gradient(135deg, rgba(6, 78, 59, 0.45) 0%, rgba(2, 44, 34, 0.6) 100%), url('${cleanHeroImage}')`;
  }

  const galleryGrid = document.getElementById("galleryGrid");
  if (galleryGrid) {
    galleryGrid.innerHTML = "";
    if (!Array.isArray(galleryData) || galleryData.length === 0) {
      galleryGrid.innerHTML = `<div class="text-center w-full" style="grid-column: 1 / -1; padding: 40px; color: var(--color-text-light);">Belum ada dokumentasi foto galeri.</div>`;
    } else {
      galleryData.forEach(item => {
        const div = document.createElement("div");
        div.className = "gallery-item scroll-trigger";
        const cleanSrc = sanitizeUrl(item.src) || FALLBACK_HERO_IMAGE;
        const cleanTitle = escapeHtml(item.title || 'Foto Sungai Jaga A');

        div.innerHTML = `
          <img src="${cleanSrc}" alt="${cleanTitle}" class="gallery-image" loading="lazy">
          <div class="gallery-item-overlay">
            <div class="gallery-icon-box">
              <i data-lucide="zoom-in"></i>
            </div>
          </div>
        `;
        // Setup Lightbox trigger
        div.addEventListener("click", () => {
          openLightbox(cleanSrc, item.title || "Dokumentasi Sungai Jaga A");
        });
        galleryGrid.appendChild(div);
      });
      // Re-create lucide icons for dynamic gallery elements
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  // Initialize/re-initialize Scroll Animations
  setupScrollAnimations();
}

// Mobile Menu Navigation Controls
function setupNavbar() {
  const navbar = document.getElementById("navbar");
  const mobileToggle = document.getElementById("mobileToggle");
  const navMenu = document.getElementById("navMenu");
  const navLinks = document.querySelectorAll(".nav-link");
  const menuIcon = document.getElementById("menuIcon");

  // Sticky border & shadow on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Toggle dynamic mobile menu
  mobileToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
    const isOpen = navMenu.classList.contains("open");
    
    // Change menu icon to X if open
    if (isOpen) {
      menuIcon.setAttribute("data-lucide", "x");
    } else {
      menuIcon.setAttribute("data-lucide", "menu");
    }
    if (window.lucide) window.lucide.createIcons();
  });

  // Close nav on click link & set active
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      if (navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        menuIcon.setAttribute("data-lucide", "menu");
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });

  // Update active section link based on scroll position
  window.addEventListener("scroll", () => {
    let current = "";
    const sections = document.querySelectorAll("section, footer");
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

// Scroll Intersection Observers (Fade In effect)
function setupScrollAnimations() {
  const scrollElements = document.querySelectorAll(".scroll-trigger");
  
  const elementObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        elementObserver.unobserve(entry.target); // Trigger once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  });

  scrollElements.forEach(el => {
    elementObserver.observe(el);
  });
}

// Lightbox modal functions
const lightboxModal = document.getElementById("lightboxModal");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightboxModal.classList.add("active");
  document.body.style.overflow = "hidden"; // disable scroll
}

function closeLightbox() {
  lightboxModal.classList.remove("active");
  document.body.style.overflow = ""; // enable scroll
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}
if (lightboxModal) {
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) {
      closeLightbox();
    }
  });
}

// Set footer year
const yearElement = document.getElementById("currentYear");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Real-time synchronization
window.addEventListener("storage", (e) => {
  if (e.key === "sj_whatsapp" || e.key === "sj_hero_image" || e.key === "sj_gallery" || e.key === "sj_kades_name") {
    loadPageData();
  }
});

// Update data whenever page becomes visible/active again (in case edits occurred on this tab/browser session)
window.addEventListener("focus", loadPageData);

// Startup Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadPageData();
  setupNavbar();
  
  // Setup Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
