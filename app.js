const API_BASE = "https://api.myquran.com/v3";

const quranForm = document.getElementById("quranForm");
const quranResult = document.getElementById("quranResult");
const quranBatch = document.getElementById("quranBatch");
const hadisForm = document.getElementById("hadisForm");
const hadisResult = document.getElementById("hadisResult");
const hadisDetail = document.getElementById("hadisDetail");
const themeToggle = document.getElementById("themeToggle");
const surahSelectEl = document.getElementById("surahSelect");
const ayahStartEl = document.getElementById("ayahStart");
const ayahEndEl = document.getElementById("ayahEnd");
const hadisPrev = document.getElementById("hadisPrev");
const hadisNext = document.getElementById("hadisNext");
const hadisPageInfo = document.getElementById("hadisPageInfo");
const gregorianDateEl = document.getElementById("gregorianDate");
const hijriDateEl = document.getElementById("hijriDate");
const readAllBtn = document.getElementById("readAllBtn");

const state = {
  theme: localStorage.getItem("theme") || "light",
  hadisQuery: "",
  hadisPage: 1,
  hadisLimit: 10,
  hadisTotalPages: 1,
  batchPlaying: false,
  batchQueue: [],
  batchIndex: 0,
  batchSurah: null,
  autoAdvanceActive: false,
};

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  const label = document.getElementById("themeLabel");
  const icon = document.getElementById("themeIcon");

  if (label) label.textContent = isDark ? "Mode Terang" : "Mode Gelap";
  if (icon) icon.textContent = isDark ? "☀️" : "🌙";

  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("theme", theme);
  state.theme = theme;
}

setTheme(state.theme);

themeToggle.addEventListener("click", () => {
  setTheme(state.theme === "dark" ? "light" : "dark");
});

function renderTodayDates() {
  const now = new Date();
  const gregorian = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  const hijri = new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  if (gregorianDateEl) gregorianDateEl.textContent = gregorian;
  if (hijriDateEl) hijriDateEl.textContent = hijri;
}

renderTodayDates();

function renderLoading(target, text = "Memuat data...") {
  target.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-line large"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  `;
}

function renderError(target, message) {
  target.innerHTML = `
    <div class="empty" style="border-style: solid; border-color: rgba(239, 68, 68, 0.2); color: #ef4444; background: rgba(239, 68, 68, 0.05);">
        ${message}
    </div>
  `;
}

function createAyatCard(data) {
  const audio = data.audio_url
    ? `<audio class="audio" controls src="${data.audio_url}"></audio>`
    : `<div class="empty">Audio tidak tersedia.</div>`;

  return `
    <div class="ayah">
      <div class="arabic">${data.arab}</div>
      <div class="translation">${data.translation}</div>
      ${audio}
      <div class="meta">
        <span>Surah ${data.surah_number}</span>
        <span>Ayat ${data.ayah_number}</span>
      </div>
    </div>
  `;
}

const surahOptions = [
  { num: 1, name: "Al-Fatihah" },
  { num: 2, name: "Al-Baqarah" },
  { num: 3, name: "Ali 'Imran" },
  { num: 4, name: "An-Nisa" },
  { num: 5, name: "Al-Ma'idah" },
  { num: 6, name: "Al-An'am" },
  { num: 7, name: "Al-A'raf" },
  { num: 8, name: "Al-Anfal" },
  { num: 9, name: "At-Taubah" },
  { num: 10, name: "Yunus" },
  { num: 11, name: "Hud" },
  { num: 12, name: "Yusuf" },
  { num: 13, name: "Ar-Ra'd" },
  { num: 14, name: "Ibrahim" },
  { num: 15, name: "Al-Hijr" },
  { num: 16, name: "An-Nahl" },
  { num: 17, name: "Al-Isra" },
  { num: 18, name: "Al-Kahf" },
  { num: 19, name: "Maryam" },
  { num: 20, name: "Taha" },
  { num: 21, name: "Al-Anbiya" },
  { num: 22, name: "Al-Hajj" },
  { num: 23, name: "Al-Mu'minun" },
  { num: 24, name: "An-Nur" },
  { num: 25, name: "Al-Furqan" },
  { num: 26, name: "Ash-Shu'ara" },
  { num: 27, name: "An-Naml" },
  { num: 28, name: "Al-Qasas" },
  { num: 29, name: "Al-'Ankabut" },
  { num: 30, name: "Ar-Rum" },
  { num: 31, name: "Luqman" },
  { num: 32, name: "As-Sajdah" },
  { num: 33, name: "Al-Ahzab" },
  { num: 34, name: "Saba" },
  { num: 35, name: "Fatir" },
  { num: 36, name: "Ya-Sin" },
  { num: 37, name: "As-Saffat" },
  { num: 38, name: "Sad" },
  { num: 39, name: "Az-Zumar" },
  { num: 40, name: "Ghafir" },
  { num: 41, name: "Fussilat" },
  { num: 42, name: "Ash-Shura" },
  { num: 43, name: "Az-Zukhruf" },
  { num: 44, name: "Ad-Dukhan" },
  { num: 45, name: "Al-Jathiyah" },
  { num: 46, name: "Al-Ahqaf" },
  { num: 47, name: "Muhammad" },
  { num: 48, name: "Al-Fath" },
  { num: 49, name: "Al-Hujurat" },
  { num: 50, name: "Qaf" },
  { num: 51, name: "Adh-Dhariyat" },
  { num: 52, name: "At-Tur" },
  { num: 53, name: "An-Najm" },
  { num: 54, name: "Al-Qamar" },
  { num: 55, name: "Ar-Rahman" },
  { num: 56, name: "Al-Waqi'ah" },
  { num: 57, name: "Al-Hadid" },
  { num: 58, name: "Al-Mujadilah" },
  { num: 59, name: "Al-Hashr" },
  { num: 60, name: "Al-Mumtahanah" },
  { num: 61, name: "As-Saff" },
  { num: 62, name: "Al-Jumu'ah" },
  { num: 63, name: "Al-Munafiqun" },
  { num: 64, name: "At-Taghabun" },
  { num: 65, name: "At-Talaq" },
  { num: 66, name: "At-Tahrim" },
  { num: 67, name: "Al-Mulk" },
  { num: 68, name: "Al-Qalam" },
  { num: 69, name: "Al-Haqqah" },
  { num: 70, name: "Al-Ma'arij" },
  { num: 71, name: "Nuh" },
  { num: 72, name: "Al-Jinn" },
  { num: 73, name: "Al-Muzzammil" },
  { num: 74, name: "Al-Muddaththir" },
  { num: 75, name: "Al-Qiyamah" },
  { num: 76, name: "Al-Insan" },
  { num: 77, name: "Al-Mursalat" },
  { num: 78, name: "An-Naba" },
  { num: 79, name: "An-Nazi'at" },
  { num: 80, name: "Abasa" },
  { num: 81, name: "At-Takwir" },
  { num: 82, name: "Al-Infitar" },
  { num: 83, name: "Al-Mutaffifin" },
  { num: 84, name: "Al-Inshiqaq" },
  { num: 85, name: "Al-Buruj" },
  { num: 86, name: "At-Tariq" },
  { num: 87, name: "Al-A'la" },
  { num: 88, name: "Al-Ghashiyah" },
  { num: 89, name: "Al-Fajr" },
  { num: 90, name: "Al-Balad" },
  { num: 91, name: "Ash-Shams" },
  { num: 92, name: "Al-Lail" },
  { num: 93, name: "Ad-Duha" },
  { num: 94, name: "Ash-Sharh" },
  { num: 95, name: "At-Tin" },
  { num: 96, name: "Al-'Alaq" },
  { num: 97, name: "Al-Qadr" },
  { num: 98, name: "Al-Bayyinah" },
  { num: 99, name: "Az-Zalzalah" },
  { num: 100, name: "Al-'Adiyat" },
  { num: 101, name: "Al-Qari'ah" },
  { num: 102, name: "At-Takathur" },
  { num: 103, name: "Al-'Asr" },
  { num: 104, name: "Al-Humazah" },
  { num: 105, name: "Al-Fil" },
  { num: 106, name: "Quraysh" },
  { num: 107, name: "Al-Ma'un" },
  { num: 108, name: "Al-Kawthar" },
  { num: 109, name: "Al-Kafirun" },
  { num: 110, name: "An-Nasr" },
  { num: 111, name: "Al-Masad" },
  { num: 112, name: "Al-Ikhlas" },
  { num: 113, name: "Al-Falaq" },
  { num: 114, name: "An-Nas" },
];

surahSelectEl.innerHTML = surahOptions
  .map(
    (surah) =>
      `<option value="${surah.num}">${surah.num}. ${surah.name}</option>`,
  )
  .join("");

const ayahCounts = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

function populateAyahSelects(count) {
  const makeOptions = (label) =>
    [
      `<option value="" disabled selected>${label}</option>`,
      ...Array.from(
        { length: count },
        (_, i) => `<option value="${i + 1}">${i + 1}</option>`,
      ),
    ].join("");

  ayahStartEl.innerHTML = makeOptions("Mulai");
  ayahEndEl.innerHTML = makeOptions("Sampai");
}

function updateAyahSelects() {
  const surahNum = Number(surahSelectEl.value);
  const count = ayahCounts[surahNum - 1] || 1;
  populateAyahSelects(count);
}

updateAyahSelects();
surahSelectEl.addEventListener("change", () => {
  updateAyahSelects();
});

quranForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  stopAllAyahAudio();
  const formData = new FormData(quranForm);
  const surah = formData.get("surah");
  const ayahStart = Number(formData.get("ayahStart"));
  const ayahEnd = Number(formData.get("ayahEnd"));

  if (!surah || !ayahStart || !ayahEnd) {
    renderError(quranResult, "Surat dan rentang ayat wajib diisi.");
    return;
  }

  renderLoading(quranResult);

  try {
    const start = Math.min(ayahStart, ayahEnd);
    const end = Math.max(ayahStart, ayahEnd);

    if (start === end) {
      const response = await fetch(`${API_BASE}/quran/${surah}/${start}`);
      const json = await response.json();

      if (!response.ok || !json.status) {
        throw new Error(json.message || "Ayat tidak ditemukan.");
      }

      quranResult.innerHTML = createAyatCard(json.data);
      quranBatch.innerHTML = "";
      bindAutoAdvance();
      return;
    }

    const ayahs = await fetchSurahAyahs(surah, 100);
    const range = ayahs.filter(
      (item) => item.ayah_number >= start && item.ayah_number <= end,
    );

    if (!range.length) {
      throw new Error("Ayat tidak ditemukan.");
    }

    quranResult.innerHTML = range
      .map(
        (item) => `
        <div class="ayah">
          <div class="arabic">${item.arab}</div>
          <div class="translation">${item.translation}</div>
          ${item.audio_url
            ? `<audio class="audio" controls src="${item.audio_url}"></audio>`
            : `<div class="empty">Audio tidak tersedia.</div>`
          }
          <div class="meta">
            <span>Surah ${item.surah_number}</span>
            <span>Ayat ${item.ayah_number}</span>
          </div>
        </div>
      `,
      )
      .join("");

    const playable = range.filter((item) => item.audio_url);
    quranBatch.innerHTML = "";
    bindAutoAdvance();
  } catch (error) {
    renderError(quranResult, error.message || "Terjadi kesalahan.");
  }
});

async function fetchSurahAyahs(surah, limit = 100) {
  const allAyahs = [];
  let page = 1;
  let total = 0;

  while (true) {
    const url = new URL(`${API_BASE}/quran/${surah}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    const response = await fetch(url.toString());
    const json = await response.json();

    if (!response.ok || !json.status) {
      throw new Error(json.message || "Surah tidak ditemukan.");
    }

    const ayahs = json.data?.ayahs || [];
    allAyahs.push(...ayahs);

    total = json.pagination?.total || ayahs.length;
    if (allAyahs.length >= total || ayahs.length === 0) {
      break;
    }

    page += 1;
  }

  return allAyahs;
}

function renderBatchPlayer() {
  if (!state.batchQueue.length) {
    quranBatch.innerHTML = `<div class="empty">Tidak ada audio untuk diputar.</div>`;
    return;
  }

  const current = state.batchQueue[state.batchIndex];
  quranBatch.innerHTML = `
    <div class="batch-player">
      <div class="arabic">${current.arab}</div>
      <div class="translation">${current.translation}</div>
      <div class="batch-progress">
        Surat ${state.batchSurah} • Ayat ${current.ayah_number} • ${state.batchIndex + 1} / ${state.batchQueue.length}
      </div>
      <audio id="batchAudio" class="audio" controls src="${current.audio_url || ""}"></audio>
      <div class="batch-controls">
        <button class="btn primary" id="batchPlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            Play
        </button>
        <button class="btn ghost" id="batchPause">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
            Pause
        </button>
        <button class="btn ghost" id="batchStop">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
            Stop
        </button>
      </div>
    </div>
  `;

  const audioEl = document.getElementById("batchAudio");
  const playBtn = document.getElementById("batchPlay");
  const pauseBtn = document.getElementById("batchPause");
  const stopBtn = document.getElementById("batchStop");

  playBtn.addEventListener("click", () => audioEl.play());
  pauseBtn.addEventListener("click", () => audioEl.pause());
  stopBtn.addEventListener("click", () => {
    audioEl.pause();
    audioEl.currentTime = 0;
  });

  audioEl.addEventListener("ended", () => {
    if (state.batchIndex < state.batchQueue.length - 1) {
      state.batchIndex += 1;
      renderBatchPlayer();
      const nextAudio = document.getElementById("batchAudio");
      nextAudio.play();
    }
  });
}

function stopAllAyahAudio() {
  const audios = quranResult.querySelectorAll("audio");
  audios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  state.autoAdvanceActive = false;
}

function bindAutoAdvance() {
  const audios = Array.from(quranResult.querySelectorAll("audio"));
  if (!audios.length) return;

  const playNext = (startIndex) => {
    for (let i = startIndex; i < audios.length; i += 1) {
      const next = audios[i];
      if (next && next.src) {
        next
          .play()
          .then(() => {
            state.autoAdvanceActive = true;
          })
          .catch(() => {
            state.autoAdvanceActive = false;
          });
        return;
      }
    }
  };

  audios.forEach((audio, index) => {
    audio.addEventListener("play", () => {
      state.autoAdvanceActive = true;
      audio.dataset.autoIndex = String(index);
    });

    audio.addEventListener("pause", () => {
      if (!audio.ended) {
        state.autoAdvanceActive = false;
      }
    });

    audio.addEventListener("ended", () => {
      if (!state.autoAdvanceActive) return;
      playNext(index + 1);
    });
  });
}

quranResult.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-play-all]");
  if (!button) return;

  const surah = button.dataset.playAll;
  quranBatch.innerHTML = "";
  renderLoading(quranBatch, "Memuat audio surat...");

  try {
    const ayahs = await fetchSurahAyahs(surah, 100);
    const playable = ayahs.filter((ayah) => ayah.audio_url);
    if (!playable.length) {
      renderError(quranBatch, "Audio tidak tersedia untuk surat ini.");
      return;
    }

    state.batchQueue = playable;
    state.batchIndex = 0;
    state.batchSurah = surah;
    renderBatchPlayer();
  } catch (error) {
    renderError(quranBatch, error.message || "Terjadi kesalahan.");
  }
});

function createHadisList(items) {
  if (!items || items.length === 0) {
    return `<div class="empty">Tidak ada hasil ditemukan.</div>`;
  }

  const list = items
    .map(
      (item) => `
      <div class="hadis-item">
        <strong>ID Hadis #${item.id}</strong>
        <p>${item.text || "Tidak ada ringkasan."}</p>
        <button class="btn ghost" data-id="${item.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
            Lihat Detail
        </button>
      </div>
    `,
    )
    .join("");

  return `<div class="hadis-list">${list}</div>`;
}

async function loadHadisDetail(id) {
  if (!id) return;
  renderLoading(hadisDetail, "Memuat detail hadis...");

  try {
    const response = await fetch(`${API_BASE}/hadis/enc/show/${id}`);
    const json = await response.json();

    if (!response.ok || !json.status) {
      throw new Error(json.message || "Detail hadis tidak ditemukan.");
    }

    const data = json.data;
    hadisDetail.innerHTML = `
      <div class="ayah">
        <div class="arabic">${data.text.ar}</div>
        <div class="translation">${data.text.id}</div>
        <div class="meta">
          <span>ID ${data.id}</span>
          <span>${data.grade || "Tanpa grade"}</span>
        </div>
      </div>
    `;
  } catch (error) {
    renderError(hadisDetail, error.message || "Terjadi kesalahan.");
  }
}

function updateHadisPagination() {
  hadisPageInfo.textContent = `Halaman ${state.hadisPage}${state.hadisTotalPages ? ` / ${state.hadisTotalPages}` : ""}`;
  hadisPrev.disabled = state.hadisPage <= 1;
  hadisNext.disabled = state.hadisTotalPages
    ? state.hadisPage >= state.hadisTotalPages
    : false;
}

async function fetchHadisPage(page = 1) {
  if (!state.hadisQuery) return;
  state.hadisPage = page;
  updateHadisPagination();
  renderLoading(hadisResult);

  try {
    const url = new URL(
      `${API_BASE}/hadis/enc/cari/${encodeURIComponent(state.hadisQuery)}`,
    );
    url.searchParams.set("limit", String(state.hadisLimit));
    url.searchParams.set("page", String(state.hadisPage));
    const response = await fetch(url.toString());
    const json = await response.json();

    if (!response.ok || !json.status) {
      throw new Error(json.message || "Hadis tidak ditemukan.");
    }

    const items = json.data.hadis || json.data;
    hadisResult.innerHTML = createHadisList(items);
    const paging = json.data.paging || json.data?.paging;
    if (paging && paging.total_pages) {
      state.hadisTotalPages = paging.total_pages;
    } else {
      state.hadisTotalPages =
        Array.isArray(items) && items.length === state.hadisLimit
          ? state.hadisPage + 1
          : state.hadisPage;
    }
    updateHadisPagination();

    const first = (items || [])[0];
    if (first && first.id) {
      loadHadisDetail(first.id);
    }
  } catch (error) {
    renderError(hadisResult, error.message || "Terjadi kesalahan.");
  }
}

hadisForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(hadisForm);
  const keyword = formData.get("keyword").trim();
  const limit = formData.get("limit") || 10;

  if (keyword.length < 3) {
    renderError(hadisResult, "Kata kunci minimal 3 karakter.");
    return;
  }

  state.hadisQuery = keyword;
  state.hadisLimit = Number(limit);
  state.hadisPage = 1;
  state.hadisTotalPages = 1;
  updateHadisPagination();
  fetchHadisPage(1);
});

hadisResult.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  loadHadisDetail(button.dataset.id);
});

hadisPrev.addEventListener("click", () => {
  if (state.hadisPage > 1) {
    fetchHadisPage(state.hadisPage - 1);
  }
});

hadisNext.addEventListener("click", () => {
  fetchHadisPage(state.hadisPage + 1);
});

updateHadisPagination();

readAllBtn.addEventListener("click", () => {
  const surahNum = Number(surahSelectEl.value);
  const count = ayahCounts[surahNum - 1] || 1;

  ayahStartEl.value = "1";
  ayahEndEl.value = String(count);

  quranForm.dispatchEvent(new Event("submit"));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}
