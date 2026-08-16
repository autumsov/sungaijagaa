// Default Fallback Configurations
const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80";
const DEFAULT_WHATSAPP = "6281234567890";
const DEFAULT_KADES_NAME = "Bpk. Supriadi";

// Security Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 5 * 60 * 1000; // 5 Menit Lockout
const SESSION_MAX_AGE_MS = 30 * 60 * 1000; // 30 Menit Auto-Logout

// Security Helpers: XSS Sanitization & URL validation
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

const FALLBACK_GALLERY = [
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

let lockoutInterval = null;

// Lockout State Checker with Realtime Countdown Timer
function checkLockoutState() {
  const loginAlert = document.getElementById("loginAlert");
  if (!loginAlert) return false;

  const lockoutUntil = localStorage.getItem("sj_admin_lockout");
  if (lockoutUntil) {
    const lockoutTime = parseInt(lockoutUntil, 10);
    const now = Date.now();
    if (now < lockoutTime) {
      const remainingSec = Math.ceil((lockoutTime - now) / 1000);
      loginAlert.textContent = `Akses terkunci karena kesalahan login berulang. Coba lagi dalam ${remainingSec} detik.`;
      loginAlert.style.display = "block";

      if (!lockoutInterval) {
        lockoutInterval = setInterval(() => {
          const currentNow = Date.now();
          if (currentNow < lockoutTime) {
            const sec = Math.ceil((lockoutTime - currentNow) / 1000);
            loginAlert.textContent = `Akses terkunci karena kesalahan login berulang. Coba lagi dalam ${sec} detik.`;
          } else {
            clearInterval(lockoutInterval);
            lockoutInterval = null;
            localStorage.removeItem("sj_admin_lockout");
            localStorage.removeItem("sj_admin_failed_attempts");
            loginAlert.style.display = "none";
          }
        }, 1000);
      }
      return true;
    } else {
      localStorage.removeItem("sj_admin_lockout");
      localStorage.removeItem("sj_admin_failed_attempts");
      loginAlert.style.display = "none";
      if (lockoutInterval) {
        clearInterval(lockoutInterval);
        lockoutInterval = null;
      }
    }
  }
  return false;
}

// Verify Authentication & Session Expiration (Supabase Auth / Local Fallback)
async function checkAuth() {
  const loginWrapper = document.getElementById("loginWrapper");
  const dashboardWrapper = document.getElementById("dashboardWrapper");

  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

  if (client) {
    // 1. Supabase Secure Session Check
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
      loginWrapper.classList.add("hidden");
      dashboardWrapper.classList.remove("hidden");
      await initDashboard();
    } else {
      loginWrapper.classList.remove("hidden");
      dashboardWrapper.classList.add("hidden");
      checkLockoutState();
    }

    // Subscribe to auth state changes
    client.auth.onAuthStateChange((event, session) => {
      if (session) {
        loginWrapper.classList.add("hidden");
        dashboardWrapper.classList.remove("hidden");
        initDashboard();
      } else {
        loginWrapper.classList.remove("hidden");
        dashboardWrapper.classList.add("hidden");
        checkLockoutState();
      }
    });
  } else {
    // 2. Local Fallback Session Check
    const isLoggedIn = sessionStorage.getItem("sj_admin_logged_in");
    const loginTime = sessionStorage.getItem("sj_admin_login_time");

    if (isLoggedIn === "true" && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed > SESSION_MAX_AGE_MS) {
        sessionStorage.removeItem("sj_admin_logged_in");
        sessionStorage.removeItem("sj_admin_login_time");
        alert("Sesi Anda telah berakhir untuk keamanan. Silakan login kembali.");
        location.reload();
        return;
      }

      sessionStorage.setItem("sj_admin_login_time", Date.now().toString());
      loginWrapper.classList.add("hidden");
      dashboardWrapper.classList.remove("hidden");
      await initDashboard();
    } else {
      loginWrapper.classList.remove("hidden");
      dashboardWrapper.classList.add("hidden");
      checkLockoutState();
    }
  }
}

// Initializing Dashboard Elements
async function initDashboard() {
  const whatsappInput = document.getElementById("inputWhatsapp");
  const kadesInput = document.getElementById("inputKadesName");
  
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

  if (client) {
    try {
      const { data: settings } = await client.from('settings').select('*');
      if (settings && settings.length > 0) {
        const map = {};
        settings.forEach(row => map[row.key] = row.value);
        whatsappInput.value = map.sj_whatsapp || DEFAULT_WHATSAPP;
        kadesInput.value = map.sj_kades_name || DEFAULT_KADES_NAME;
      } else {
        whatsappInput.value = DEFAULT_WHATSAPP;
        kadesInput.value = DEFAULT_KADES_NAME;
      }
    } catch (e) {
      whatsappInput.value = localStorage.getItem("sj_whatsapp") || DEFAULT_WHATSAPP;
      kadesInput.value = localStorage.getItem("sj_kades_name") || DEFAULT_KADES_NAME;
    }
  } else {
    whatsappInput.value = localStorage.getItem("sj_whatsapp") || DEFAULT_WHATSAPP;
    kadesInput.value = localStorage.getItem("sj_kades_name") || DEFAULT_KADES_NAME;
  }

  // Load Hero Preview
  await renderHeroPreview();

  // Load Gallery List
  await renderAdminGallery();
}

// Helper Function: Compresses & resizes image file for optimal size
function compressImage(file, maxWidth, maxHeight, quality, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      callback(compressedDataUrl);
    };
  };
}

// Upload File helper to Supabase Storage Bucket
async function uploadToSupabaseStorage(file, pathPrefix = "uploads") {
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
  if (!client) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const bucketName = (typeof SUPABASE_CONFIG !== "undefined" && SUPABASE_CONFIG.storageBucket) ? SUPABASE_CONFIG.storageBucket : "sungai-jaga-assets";

  const { data, error } = await client.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw error;
  }

  const { data: publicUrlData } = client.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData ? publicUrlData.publicUrl : null;
}

// Render Hero image section elements
async function renderHeroPreview() {
  const heroPreviewImg = document.getElementById("heroPreviewImg");
  let heroUrl = DEFAULT_HERO_IMAGE;

  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
  if (client) {
    try {
      const { data } = await client.from('settings').select('value').eq('key', 'sj_hero_image').single();
      if (data && data.value) {
        heroUrl = data.value;
      }
    } catch (e) {
      heroUrl = localStorage.getItem("sj_hero_image") || DEFAULT_HERO_IMAGE;
    }
  } else {
    heroUrl = localStorage.getItem("sj_hero_image") || DEFAULT_HERO_IMAGE;
  }

  heroPreviewImg.src = sanitizeUrl(heroUrl) || DEFAULT_HERO_IMAGE;
}

// Render gallery records safely with XSS protection
async function renderAdminGallery() {
  let galleryData = [];
  const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

  if (client) {
    try {
      const { data, error } = await client.from('gallery').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        galleryData = data;
      } else {
        galleryData = FALLBACK_GALLERY;
      }
    } catch (e) {
      galleryData = FALLBACK_GALLERY;
    }
  } else {
    try {
      const raw = localStorage.getItem("sj_gallery");
      galleryData = raw ? JSON.parse(raw) : FALLBACK_GALLERY;
    } catch (e) {
      galleryData = FALLBACK_GALLERY;
    }
  }

  document.getElementById("galleryCount").textContent = Array.isArray(galleryData) ? galleryData.length : 0;
  const adminGalleryGrid = document.getElementById("adminGalleryGrid");
  adminGalleryGrid.innerHTML = "";

  if (!Array.isArray(galleryData) || galleryData.length === 0) {
    adminGalleryGrid.innerHTML = `<div class="text-center w-full" style="grid-column: 1 / -1; padding: 30px; color: var(--color-text-light);">Belum ada koleksi foto galeri.</div>`;
    return;
  }

  galleryData.forEach(item => {
    const div = document.createElement("div");
    div.className = "admin-gallery-item";
    const cleanSrc = sanitizeUrl(item.src) || DEFAULT_HERO_IMAGE;
    const cleanTitle = escapeHtml(item.title || "Foto Galeri");
    const cleanId = escapeHtml(item.id);

    div.innerHTML = `
      <div class="admin-gallery-imgwrap">
        <img src="${cleanSrc}" alt="${cleanTitle}">
      </div>
      <div class="admin-gallery-details">
        <span class="admin-gallery-name" title="${cleanTitle}">${cleanTitle}</span>
        <button class="btn btn-danger btn-delete-item" data-id="${cleanId}">
          <i data-lucide="trash-2"></i> Hapus Foto
        </button>
      </div>
    `;

    div.querySelector(".btn-delete-item").addEventListener("click", () => {
      deleteGalleryItem(item.id);
    });

    adminGalleryGrid.appendChild(div);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Delete image from gallery list
async function deleteGalleryItem(id) {
  if (confirm("Apakah Anda yakin ingin menghapus foto ini dari galeri?")) {
    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

    if (client) {
      try {
        const { error } = await client.from('gallery').delete().eq('id', id);
        if (error) {
          alert("Gagal menghapus foto dari database: " + error.message);
          return;
        }
        await renderAdminGallery();
        showToast("Foto berhasil dihapus dari database galeri.");
        return;
      } catch (err) {
        alert("Gagal menghapus foto dari Supabase.");
        return;
      }
    }

    // LocalStorage Fallback
    let galleryData = [];
    try {
      const raw = localStorage.getItem("sj_gallery");
      galleryData = raw ? JSON.parse(raw) : FALLBACK_GALLERY;
    } catch (e) {
      galleryData = FALLBACK_GALLERY;
    }

    galleryData = galleryData.filter(item => item.id !== id);
    localStorage.setItem("sj_gallery", JSON.stringify(galleryData));
    
    await renderAdminGallery();
    showToast("Foto berhasil dihapus dari galeri.");
  }
}

// Trigger screen Toast notifications
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const toastMsg = toast.querySelector(".toast-message");
  toastMsg.textContent = escapeHtml(message);
  
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Auth Login handler with Supabase Auth or Brute-force Local Protection
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const loginAlert = document.getElementById("loginAlert");

    if (checkLockoutState()) {
      return;
    }

    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

    if (client) {
      // 1. Supabase Auth Integration
      loginAlert.style.display = "none";
      loginAlert.textContent = "Memverifikasi kredensial aman...";
      
      const { data, error } = await client.auth.signInWithPassword({
        email: user,
        password: pass
      });

      if (error) {
        // Increment Failed Attempts
        let failedAttempts = parseInt(localStorage.getItem("sj_admin_failed_attempts") || "0", 10) + 1;
        localStorage.setItem("sj_admin_failed_attempts", failedAttempts.toString());

        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_TIME_MS;
          localStorage.setItem("sj_admin_lockout", lockoutTime.toString());
          checkLockoutState();
        } else {
          const remaining = MAX_LOGIN_ATTEMPTS - failedAttempts;
          loginAlert.textContent = `Autentikasi Gagal: ${error.message}. Sisa percobaan: ${remaining}x`;
          loginAlert.style.display = "block";
        }
      } else {
        localStorage.removeItem("sj_admin_failed_attempts");
        localStorage.removeItem("sj_admin_lockout");
        loginAlert.style.display = "none";
        await checkAuth();
        showToast("Selamat datang! Terhubung secara aman ke Supabase.");
      }
    } else {
      // 2. Local Fallback Check (Local Demo mode)
      if (user === "admin" && pass === "admin123") {
        sessionStorage.setItem("sj_admin_logged_in", "true");
        sessionStorage.setItem("sj_admin_login_time", Date.now().toString());
        localStorage.removeItem("sj_admin_failed_attempts");
        localStorage.removeItem("sj_admin_lockout");
        if (lockoutInterval) {
          clearInterval(lockoutInterval);
          lockoutInterval = null;
        }
        loginAlert.style.display = "none";
        await checkAuth();
        showToast("Selamat datang! Anda berhasil masuk secara aman.");
      } else {
        let failedAttempts = parseInt(localStorage.getItem("sj_admin_failed_attempts") || "0", 10) + 1;
        localStorage.setItem("sj_admin_failed_attempts", failedAttempts.toString());

        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_TIME_MS;
          localStorage.setItem("sj_admin_lockout", lockoutTime.toString());
          checkLockoutState();
        } else {
          const remaining = MAX_LOGIN_ATTEMPTS - failedAttempts;
          loginAlert.textContent = `Kredensial salah. Sisa percobaan: ${remaining} kali sebelum terkunci.`;
          loginAlert.style.display = "block";
        }
      }
    }
  });
}

// Logout handler
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
    if (client) {
      await client.auth.signOut();
    }
    sessionStorage.removeItem("sj_admin_logged_in");
    sessionStorage.removeItem("sj_admin_login_time");
    location.reload();
  });
}

// Navbar Tabs switching
const tabs = document.querySelectorAll(".menu-tab");
const panes = document.querySelectorAll(".tab-pane");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    panes.forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    document.getElementById(`tab-${target}`).classList.add("active");

    const titleVal = tab.textContent.trim();
    document.getElementById("currentTabTitle").textContent = escapeHtml(titleVal);
    document.getElementById("currentTabBreadcrumb").textContent = escapeHtml(titleVal);
  });
});

// Update WhatsApp & Kades Name Form Submission
const generalForm = document.getElementById("generalSettingsForm");
if (generalForm) {
  generalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawKadesName = document.getElementById("inputKadesName").value.trim();
    let whatsappValue = document.getElementById("inputWhatsapp").value.trim();

    const cleanKadesName = escapeHtml(rawKadesName);

    whatsappValue = whatsappValue.replace(/\D/g, ""); // Keep only digits
    if (whatsappValue.startsWith("0")) {
      whatsappValue = "62" + whatsappValue.slice(1);
    }

    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
    if (client) {
      try {
        const { error: err1 } = await client.from('settings').upsert({ key: 'sj_kades_name', value: cleanKadesName });
        const { error: err2 } = await client.from('settings').upsert({ key: 'sj_whatsapp', value: whatsappValue });

        if (err1 || err2) {
          alert("Gagal menyimpan pengaturan ke Supabase: " + (err1?.message || err2?.message));
          return;
        }

        showToast("Profil & kontak WhatsApp desa berhasil disimpan ke Supabase Database!");
        return;
      } catch (err) {
        alert("Gagal terhubung ke Supabase Database.");
        return;
      }
    }

    // LocalStorage Fallback
    localStorage.setItem("sj_kades_name", cleanKadesName);
    localStorage.setItem("sj_whatsapp", whatsappValue);
    showToast("Profil & kontak WhatsApp desa berhasil disimpan!");
  });
}

// Hero background file manager
const inputHeroFile = document.getElementById("inputHeroFile");
const heroDropArea = document.getElementById("heroDropArea");

if (inputHeroFile) {
  const handleHeroUpload = async (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert("Keamanan File: Hanya format gambar JPG, PNG, atau WEBP yang diperbolehkan!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Keamanan File: Ukuran berkas terlalu besar! Maksimal ukuran file adalah 5 MB.");
      return;
    }

    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

    if (client) {
      try {
        showToast("Mengunggah foto Hero ke Supabase Cloud Storage...");
        const publicUrl = await uploadToSupabaseStorage(file, "hero");
        if (publicUrl) {
          await client.from('settings').upsert({ key: 'sj_hero_image', value: publicUrl });
          await renderHeroPreview();
          showToast("Gambar Hero berhasil diperbarui di Supabase Cloud!");
          return;
        }
      } catch (err) {
        alert("Gagal mengunggah foto ke Supabase Storage: " + err.message);
        return;
      }
    }

    // LocalStorage Fallback
    compressImage(file, 1200, 800, 0.7, (compressedUrl) => {
      try {
        localStorage.setItem("sj_hero_image", compressedUrl);
        renderHeroPreview();
        showToast("Gambar Hero utama berhasil diperbarui!");
      } catch (err) {
        alert("Penyimpanan tidak cukup untuk gambar ini.");
      }
    });
  };

  inputHeroFile.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleHeroUpload(e.target.files[0]);
    }
  });

  heroDropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    heroDropArea.classList.add("dragover");
  });

  heroDropArea.addEventListener("dragleave", () => {
    heroDropArea.classList.remove("dragover");
  });

  heroDropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    heroDropArea.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleHeroUpload(e.dataTransfer.files[0]);
    }
  });
}

// Reset Hero
const resetHeroBtn = document.getElementById("resetHeroBtn");
if (resetHeroBtn) {
  resetHeroBtn.addEventListener("click", async () => {
    if (confirm("Kembalikan gambar Hero ke pengaturan awal bawaan desa?")) {
      const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
      if (client) {
        await client.from('settings').delete().eq('key', 'sj_hero_image');
        await renderHeroPreview();
        showToast("Gambar Hero dikembalikan ke semula di Supabase.");
        return;
      }

      localStorage.removeItem("sj_hero_image");
      renderHeroPreview();
      showToast("Gambar Hero dikembalikan ke semula.");
    }
  });
}

// Gallery Upload managers
const inputGalleryFile = document.getElementById("inputGalleryFile");
const tempGalleryImg = document.getElementById("tempGalleryImg");
const gallerySelectedPreview = document.getElementById("gallerySelectedPreview");

if (inputGalleryFile) {
  inputGalleryFile.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert("Keamanan File: Hanya format gambar JPG, PNG, atau WEBP yang diperbolehkan!");
        inputGalleryFile.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Keamanan File: Ukuran berkas terlalu besar! Maksimal 5 MB.");
        inputGalleryFile.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        tempGalleryImg.src = event.target.result;
        tempGalleryImg.classList.remove("hidden");
        const placeholder = gallerySelectedPreview.querySelector(".placeholder");
        if (placeholder) placeholder.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });
}

const addGalleryForm = document.getElementById("addGalleryForm");
if (addGalleryForm) {
  addGalleryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titleVal = document.getElementById("inputGalleryTitle").value.trim();
    const file = inputGalleryFile.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert("Keamanan File: Format file tidak didukung!");
      return;
    }

    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;

    if (client) {
      try {
        showToast("Mengunggah foto ke Supabase Cloud...");
        const publicUrl = await uploadToSupabaseStorage(file, "gallery");
        
        if (publicUrl) {
          const { error } = await client.from('gallery').insert([
            { title: escapeHtml(titleVal), src: publicUrl }
          ]);

          if (error) {
            alert("Gagal menambahkan record ke database Supabase: " + error.message);
            return;
          }

          // Reset form controls
          addGalleryForm.reset();
          tempGalleryImg.src = "";
          tempGalleryImg.classList.add("hidden");
          const placeholder = gallerySelectedPreview.querySelector(".placeholder");
          if (placeholder) placeholder.style.display = "flex";

          await renderAdminGallery();
          showToast("Foto berhasil ditambahkan ke Galeri Supabase!");
          return;
        }
      } catch (err) {
        alert("Gagal memproses unggahan foto ke Supabase: " + err.message);
        return;
      }
    }

    // LocalStorage Fallback
    compressImage(file, 800, 600, 0.7, async (compressedUrl) => {
      try {
        let galleryData = [];
        try {
          const raw = localStorage.getItem("sj_gallery");
          galleryData = raw ? JSON.parse(raw) : FALLBACK_GALLERY;
        } catch (err) {
          galleryData = FALLBACK_GALLERY;
        }

        const newPhotoItem = {
          id: Date.now().toString(),
          src: compressedUrl,
          title: escapeHtml(titleVal)
        };

        galleryData.push(newPhotoItem);
        localStorage.setItem("sj_gallery", JSON.stringify(galleryData));

        addGalleryForm.reset();
        tempGalleryImg.src = "";
        tempGalleryImg.classList.add("hidden");
        const placeholder = gallerySelectedPreview.querySelector(".placeholder");
        if (placeholder) placeholder.style.display = "flex";

        await renderAdminGallery();
        showToast("Foto berhasil ditambahkan ke galeri!");
      } catch (err) {
        alert("Gagal menambahkan foto. Kapasitas penyimpanan browser penuh.");
      }
    });
  });
}

// On Startup Load check authentication
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
