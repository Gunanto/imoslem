const BASE_URL = "https://api.myquran.com/v3";
const CACHE_PREFIX = "sm-cache:v2:";
const DEFAULT_CACHE_SECONDS = 300;

const el = (id) => document.getElementById(id);
const setOutput = (id, data) => {
  const node = el(id);
  node.classList.remove("loading");
  node.textContent = data;
};

const setLoading = (id) => {
  const node = el(id);
  node.classList.add("loading");
  node.textContent = "Memuat...";
};

const setList = (id, html) => {
  const node = el(id);
  node.classList.remove("loading");
  node.innerHTML = html;
};

const setHtml = (id, html) => {
  const node = el(id);
  node.classList.remove("loading");
  node.innerHTML = html;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderKeyValue = (pairs) =>
  `<div class="kv">${pairs
    .map(
      ([label, value]) =>
        `<div class="label">${escapeHtml(label)}</div><div>${escapeHtml(value)}</div>`,
    )
    .join("")}</div>`;

const renderJadwal = (jadwalObj) => {
  const entries = Object.values(jadwalObj || {});
  if (!entries.length) return "<div>Jadwal tidak tersedia.</div>";
  return entries
    .map((item) => {
      return `<div class="card" style="margin-top:10px">
        <div class="title">${escapeHtml(item.tanggal || "")}</div>
        ${renderKeyValue([
          ["Imsak", item.imsak],
          ["Subuh", item.subuh],
          ["Terbit", item.terbit],
          ["Dhuha", item.dhuha],
          ["Dzuhur", item.dzuhur],
          ["Ashar", item.ashar],
          ["Maghrib", item.maghrib],
          ["Isya", item.isya],
        ])}
      </div>`;
    })
    .join("");
};

const pickText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim() !== "") ||
  "";

const pickValue = (...values) =>
  values.find(
    (value) => value !== undefined && value !== null && value !== "",
  ) ?? "";

const unwrapData = (payload) => {
  let current = payload;
  for (let i = 0; i < 4; i += 1) {
    if (current && typeof current === "object" && "data" in current) {
      current = current.data;
      continue;
    }
    break;
  }
  return current ?? payload;
};

const normalizeAyahData = (raw) => {
  const data = unwrapData(raw) || {};
  const ayah =
    data.ayah ||
    data.ayat ||
    (Array.isArray(data.ayahs) ? data.ayahs[0] : null) ||
    (Array.isArray(data.ayats) ? data.ayats[0] : null) ||
    data;

  return {
    surah_number: pickValue(
      ayah.surah_number,
      ayah.surah?.number,
      data.surah_number,
      data.surah?.number,
    ),
    ayah_number: pickValue(
      ayah.ayah_number,
      ayah.number,
      ayah.no,
      data.ayah_number,
    ),
    arab: pickText(
      ayah.arab,
      ayah.arabic,
      ayah.text?.ar,
      ayah.text_ar,
      data.arab,
      data.text?.ar,
    ),
    translation: pickText(
      ayah.translation,
      ayah.text?.id,
      ayah.terjemah,
      ayah.id,
      data.translation,
      data.text?.id,
    ),
    meta: ayah.meta || data.meta || {},
  };
};

const renderQuranAyah = (data) => {
  if (!data) return "Data tidak tersedia.";
  const ayah = normalizeAyahData(data);
  const arab = ayah.arab || "-";
  const translation = ayah.translation || "-";
  return `
    <div class="title">QS ${escapeHtml(ayah.surah_number)}:${escapeHtml(
      ayah.ayah_number,
    )}</div>
    <div class="arab">${escapeHtml(arab)}</div>
    <div class="translation">${escapeHtml(translation)}</div>
    <div class="meta">
      <span class="pill-inline">Juz: ${escapeHtml(ayah.meta?.juz ?? "-")}</span>
      <span class="pill-inline">Page: ${escapeHtml(ayah.meta?.page ?? "-")}</span>
      <span class="pill-inline">Ruku: ${escapeHtml(ayah.meta?.ruku ?? "-")}</span>
    </div>
  `;
};

const renderAyahList = (items) => {
  if (!items || !items.length) return "Data tidak tersedia.";
  return `
    <div class="ayah-list">
      ${items
        .map((item, index) => {
          const ayah = normalizeAyahData(item);
          const arab = ayah.arab || "-";
          const translation = ayah.translation || "-";
          return `
            <div class="ayah-item" data-index="${index}">
              <div class="ayah-header">
                <span>QS ${escapeHtml(ayah.surah_number)}:${escapeHtml(
                  ayah.ayah_number,
                )}</span>
                <div class="ayah-actions">
                  <button class="ayah-play" data-action="play" data-index="${index}">
                    Putar
                  </button>
                </div>
              </div>
              <div class="arab">${escapeHtml(arab)}</div>
              <div class="translation">${escapeHtml(translation)}</div>
              <div class="meta">
                <span class="pill-inline">Juz: ${escapeHtml(
                  ayah.meta?.juz ?? "-",
                )}</span>
                <span class="pill-inline">Page: ${escapeHtml(
                  ayah.meta?.page ?? "-",
                )}</span>
                <span class="pill-inline">Ruku: ${escapeHtml(
                  ayah.meta?.ruku ?? "-",
                )}</span>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const renderHadisDetail = (data) => {
  if (!data) return "Data tidak tersedia.";
  return `
    <div class="title">Hadis #${escapeHtml(data.id)}</div>
    <div class="arab">${escapeHtml(data.text?.ar || "")}</div>
    <div class="translation">${escapeHtml(data.text?.id || "")}</div>
    <div class="meta">
      <span class="pill-inline">Grade: ${escapeHtml(data.grade ?? "-")}</span>
      <span class="pill-inline">Takhrij: ${escapeHtml(data.takhrij ?? "-")}</span>
    </div>
  `;
};

const getAudioUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const hit = value.find((item) => typeof item === "string");
    return hit || "";
  }
  if (typeof value === "object") {
    const values = Object.values(value);
    for (const item of values) {
      if (typeof item === "string") return item;
      if (Array.isArray(item)) {
        const hit = item.find((v) => typeof v === "string");
        if (hit) return hit;
      }
    }
  }
  return "";
};

const applyAudio = (audioValue) => {
  const audioEl = el("quran-audio");
  const audioUrl = getAudioUrl(audioValue);
  if (audioUrl) {
    audioEl.src = audioUrl;
    audioEl.style.display = "block";
  } else {
    audioEl.removeAttribute("src");
    audioEl.style.display = "none";
  }
};

const setActiveAyah = (index) => {
  const container = el("quran-range-output");
  if (!container) return;
  container.querySelectorAll(".ayah-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.index === String(index));
  });
};

const playAyahIndex = (index, auto = true) => {
  const item = state.quranRange[index];
  if (!item) return;
  const audioUrl = getAudioUrl(item.audio_url || item.audio);
  const ayah = normalizeAyahData(item);
  state.quranIndex = index;
  state.quranAuto = auto;
  if (ayah.surah_number) el("quran-surah").value = ayah.surah_number;
  if (ayah.ayah_number) el("quran-ayah").value = ayah.ayah_number;
  applyAudio(audioUrl);
  setActiveAyah(index);
  if (audioUrl) {
    el("quran-audio")
      .play()
      .catch(() => {});
  }
};

const getCache = (key, ttlSeconds) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > ttlSeconds * 1000) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

const setCache = (key, data) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    // ignore storage errors
  }
};

const fetchJson = async (path, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const cacheSeconds = options.cacheSeconds ?? DEFAULT_CACHE_SECONDS;
  const cacheKey = `${method}:${path}`;

  if (method === "GET" && cacheSeconds > 0) {
    const cached = getCache(cacheKey, cacheSeconds);
    if (cached) return cached;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const data = await res.json();
  if (method === "GET" && cacheSeconds > 0) {
    setCache(cacheKey, data);
  }
  return data;
};

const state = {
  sholatLocations: [],
  quranRange: [],
  quranIndex: -1,
  quranAuto: false,
};

// Mode baca toggles
el("quran-read-mode").addEventListener("click", () => {
  el("quran-ayah-output").classList.toggle("reading-mode");
  el("quran-range-output").classList.toggle("reading-mode");
});

const quranAudio = el("quran-audio");
quranAudio.addEventListener("ended", () => {
  if (!state.quranAuto) return;
  playAyahIndex(state.quranIndex + 1, true);
});

quranAudio.addEventListener("pause", () => {
  if (!quranAudio.ended) state.quranAuto = false;
});

el("hadis-read-mode").addEventListener("click", () => {
  el("hadis-output").classList.toggle("reading-mode");
});

// Night reading mode toggle (global)
const nightToggle = el("night-reading-toggle");
const NIGHT_KEY = "sm-night-reading";
const applyNight = (enabled) => {
  document.body.classList.toggle("night-reading", enabled);
  nightToggle.textContent = enabled ? "Day Mode" : "Night Reading";
};

const savedNight = localStorage.getItem(NIGHT_KEY) === "1";
applyNight(savedNight);

nightToggle.addEventListener("click", () => {
  const next = !document.body.classList.contains("night-reading");
  applyNight(next);
  localStorage.setItem(NIGHT_KEY, next ? "1" : "0");
});

// Sholat
el("sholat-search").addEventListener("click", async () => {
  const keyword = el("sholat-keyword").value.trim();
  if (!keyword) return;
  setLoading("sholat-results");
  try {
    const data = await fetchJson(
      `/sholat/kabkota/cari/${encodeURIComponent(keyword)}`,
    );
    state.sholatLocations = data.data || [];
    if (!state.sholatLocations.length) {
      setOutput("sholat-results", "Tidak ada hasil.");
      return;
    }
    const list = state.sholatLocations
      .map(
        (loc) =>
          `<div class="list-item"><span>${loc.lokasi}</span><button data-id="${loc.id}">Pilih</button></div>`,
      )
      .join("");
    setList("sholat-results", list);
    el("sholat-results")
      .querySelectorAll("button[data-id]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          el("sholat-results").dataset.selectedId = btn.dataset.id;
          el("sholat-results").dataset.selectedName =
            btn.parentElement.querySelector("span").textContent;
        });
      });
  } catch (err) {
    setOutput("sholat-results", `Error: ${err.message}`);
  }
});

el("sholat-load").addEventListener("click", async () => {
  const period = el("sholat-period").value;
  const id = el("sholat-results").dataset.selectedId;
  const name = el("sholat-results").dataset.selectedName || "";
  if (!id) {
    setOutput("sholat-output", "Pilih lokasi dulu.");
    return;
  }
  setLoading("sholat-output");
  try {
    const path =
      period === "today"
        ? `/sholat/jadwal/${id}/today`
        : `/sholat/jadwal/${id}/${period}`;
    const data = await fetchJson(path);
    const header = `<div class="title">${escapeHtml(name)}</div>`;
    const jadwal = data.data?.jadwal || data.data?.data?.jadwal || data.jadwal;
    const body = renderJadwal(jadwal);
    setHtml("sholat-output", `${header}${body}`);
  } catch (err) {
    setOutput("sholat-output", `Error: ${err.message}`);
  }
});

// Kalender
el("cal-today").addEventListener("click", async () => {
  setLoading("cal-today-output");
  try {
    const data = await fetchJson("/cal/today", { cacheSeconds: 600 });
    const d = data.data || data;
    const html = `
      <div class="title">${escapeHtml(d.hijr?.today || "")}</div>
      <div class="meta">${escapeHtml(d.ce?.today || "")}</div>
      ${renderKeyValue([
        ["Metode", d.method],
        ["Adjustment", d.adjustment],
      ])}
    `;
    setHtml("cal-today-output", html);
  } catch (err) {
    setOutput("cal-today-output", `Error: ${err.message}`);
  }
});

el("cal-ce").addEventListener("click", async () => {
  const date = el("cal-ce-date").value.trim();
  if (!date) return;
  setLoading("cal-ce-output");
  try {
    const data = await fetchJson(`/cal/ce/${encodeURIComponent(date)}`);
    const d = data.data || data;
    const html = `
      <div class="title">${escapeHtml(d.ce?.today || "")}</div>
      <div class="meta">${escapeHtml(d.hijr?.today || "")}</div>
      ${renderKeyValue([
        ["Metode", d.method],
        ["Adjustment", d.adjustment],
      ])}
    `;
    setHtml("cal-ce-output", html);
  } catch (err) {
    setOutput("cal-ce-output", `Error: ${err.message}`);
  }
});

el("cal-hijr").addEventListener("click", async () => {
  const date = el("cal-hijr-date").value.trim();
  if (!date) return;
  setLoading("cal-hijr-output");
  try {
    const data = await fetchJson(`/cal/hijr/${encodeURIComponent(date)}`);
    const d = data.data || data;
    const html = `
      <div class="title">${escapeHtml(d.hijr?.today || "")}</div>
      <div class="meta">${escapeHtml(d.ce?.today || "")}</div>
      ${renderKeyValue([
        ["Metode", d.method],
        ["Adjustment", d.adjustment],
      ])}
    `;
    setHtml("cal-hijr-output", html);
  } catch (err) {
    setOutput("cal-hijr-output", `Error: ${err.message}`);
  }
});

// Quran
el("quran-load").addEventListener("click", async () => {
  setLoading("quran-list");
  try {
    const data = await fetchJson("/quran", { cacheSeconds: 3600 });
    const list = (data.data || [])
      .map(
        (s) =>
          `<div class="list-item"><span>${s.number}. ${s.name_latin}</span><button data-surah="${s.number}">Buka</button></div>`,
      )
      .join("");
    setList("quran-list", list || "Data kosong.");
    el("quran-list")
      .querySelectorAll("button[data-surah]")
      .forEach((btn) => {
        btn.addEventListener("click", async () => {
          const surah = btn.dataset.surah;
          el("quran-surah").value = surah;
          setOutput("quran-ayah-output", "Memuat detail surah...");
          const detail = await fetchJson(`/quran/${surah}`, {
            cacheSeconds: 0,
          });
          const d = unwrapData(detail);
          const html = `
            <div class="title">${escapeHtml(d.name_latin || "")}</div>
            <div class="meta">${escapeHtml(d.translation || "")} • ${escapeHtml(
              d.revelation || "",
            )}</div>
            ${renderKeyValue([
              ["Jumlah Ayat", d.number_of_ayahs],
              [
                "Audio Surah",
                getAudioUrl(d.audio_url || d.audio) ? "Tersedia" : "Tidak",
              ],
            ])}
          `;
          setHtml("quran-ayah-output", html);
          applyAudio(d.audio_url || d.audio);
          if (d.number_of_ayahs) {
            el("quran-ayah-from").value = "1";
            el("quran-ayah-to").value = String(d.number_of_ayahs);
          }
        });
      });
  } catch (err) {
    setOutput("quran-list", `Error: ${err.message}`);
  }
});

el("quran-search").addEventListener("input", () => {
  const query = el("quran-search").value.toLowerCase();
  const items = el("quran-list").querySelectorAll(".list-item");
  if (!items) return;
  items.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? "flex" : "none";
  });
});

el("quran-ayah-load").addEventListener("click", async () => {
  const surah = el("quran-surah").value.trim();
  const ayah = el("quran-ayah").value.trim();
  if (!surah || !ayah) return;
  state.quranAuto = false;
  setLoading("quran-ayah-output");
  try {
    const data = await fetchJson(`/quran/${surah}/${ayah}`, {
      cacheSeconds: 0,
    });
    const ayahData = unwrapData(data);
    setHtml("quran-ayah-output", renderQuranAyah(ayahData));
    applyAudio(ayahData?.audio_url || ayahData?.audio);
  } catch (err) {
    setOutput("quran-ayah-output", `Error: ${err.message}`);
  }
});

el("quran-ayah-range").addEventListener("click", async () => {
  const surah = el("quran-surah").value.trim();
  const fromRaw = el("quran-ayah-from").value.trim();
  const toRaw = el("quran-ayah-to").value.trim();
  if (!surah || !fromRaw || !toRaw) {
    setOutput("quran-range-output", "Lengkapi surah dan range ayat.");
    return;
  }
  let from = Number.parseInt(fromRaw, 10);
  let to = Number.parseInt(toRaw, 10);
  if (Number.isNaN(from) || Number.isNaN(to)) {
    setOutput("quran-range-output", "Range ayat harus berupa angka.");
    return;
  }
  if (from > to) [from, to] = [to, from];
  setLoading("quran-range-output");
  state.quranRange = [];
  state.quranIndex = -1;
  state.quranAuto = false;
  try {
    const requests = [];
    for (let i = from; i <= to; i += 1) {
      requests.push(
        fetchJson(`/quran/${surah}/${i}`, {
          cacheSeconds: 0,
        }),
      );
    }
    const results = await Promise.all(requests);
    const items = results.map((res) => unwrapData(res));
    state.quranRange = items;
    setHtml("quran-range-output", renderAyahList(items));
    el("quran-range-output")
      .querySelectorAll(".ayah-play")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const index = Number(btn.dataset.index || "0");
          playAyahIndex(index, true);
        });
      });
  } catch (err) {
    setOutput("quran-range-output", `Error: ${err.message}`);
  }
});

// Hadis
const renderHadisList = (items) => {
  if (!items || !items.length) {
    setOutput("hadis-list", "Tidak ada hasil.");
    return;
  }
  setList(
    "hadis-list",
    items
      .map(
        (h) =>
          `<div class="list-item"><span>${h.id} - ${h.text?.id || h.text}</span><button data-id="${h.id}">Detail</button></div>`,
      )
      .join(""),
  );
  el("hadis-list")
    .querySelectorAll("button[data-id]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        el("hadis-id").value = btn.dataset.id;
        el("hadis-detail").click();
      });
    });
};

el("hadis-random").addEventListener("click", async () => {
  setLoading("hadis-output");
  try {
    const data = await fetchJson("/hadis/enc/random");
    setHtml("hadis-output", renderHadisDetail(data.data || data));
  } catch (err) {
    setOutput("hadis-output", `Error: ${err.message}`);
  }
});

el("hadis-search").addEventListener("click", async () => {
  const keyword = el("hadis-keyword").value.trim();
  if (!keyword) return;
  setLoading("hadis-list");
  try {
    const data = await fetchJson(
      `/hadis/enc/cari/${encodeURIComponent(keyword)}`,
    );
    renderHadisList(data.data?.hadis || data.data || []);
  } catch (err) {
    setOutput("hadis-list", `Error: ${err.message}`);
  }
});

el("hadis-explore").addEventListener("click", async () => {
  const page = el("hadis-page").value.trim() || "1";
  const limit = el("hadis-limit").value.trim() || "10";
  setLoading("hadis-list");
  try {
    const data = await fetchJson(
      `/hadis/enc/explore?page=${page}&limit=${limit}`,
    );
    renderHadisList(data.data?.hadis || []);
  } catch (err) {
    setOutput("hadis-list", `Error: ${err.message}`);
  }
});

el("hadis-detail").addEventListener("click", async () => {
  const id = el("hadis-id").value.trim();
  if (!id) return;
  setLoading("hadis-output");
  try {
    const data = await fetchJson(`/hadis/enc/show/${id}`);
    setHtml("hadis-output", renderHadisDetail(data.data || data));
  } catch (err) {
    setOutput("hadis-output", `Error: ${err.message}`);
  }
});

el("hadis-prev").addEventListener("click", async () => {
  const id = el("hadis-id").value.trim();
  if (!id) return;
  try {
    const data = await fetchJson(`/hadis/enc/prev/${id}`);
    el("hadis-id").value = data.data?.id || "";
    setHtml("hadis-output", renderHadisDetail(data.data || data));
  } catch (err) {
    setOutput("hadis-output", `Error: ${err.message}`);
  }
});

el("hadis-next").addEventListener("click", async () => {
  const id = el("hadis-id").value.trim();
  if (!id) return;
  try {
    const data = await fetchJson(`/hadis/enc/next/${id}`);
    el("hadis-id").value = data.data?.id || "";
    setHtml("hadis-output", renderHadisDetail(data.data || data));
  } catch (err) {
    setOutput("hadis-output", `Error: ${err.message}`);
  }
});

// Perawi
el("perawi-browse").addEventListener("click", async () => {
  const page = el("perawi-page").value.trim() || "1";
  const limit = el("perawi-limit").value.trim() || "10";
  setLoading("perawi-list");
  try {
    const data = await fetchJson(
      `/hadist/perawi/browse?page=${page}&limit=${limit}`,
    );
    const items = data.data?.rawi || [];
    setList(
      "perawi-list",
      items
        .map(
          (p) =>
            `<div class="list-item"><span>${p.id} - ${p.name || "Tanpa nama"}</span><button data-id="${p.id}">Detail</button></div>`,
        )
        .join(""),
    );
    el("perawi-list")
      .querySelectorAll("button[data-id]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          el("perawi-id").value = btn.dataset.id;
          el("perawi-detail").click();
        });
      });
  } catch (err) {
    setOutput("perawi-list", `Error: ${err.message}`);
  }
});

el("perawi-detail").addEventListener("click", async () => {
  const id = el("perawi-id").value.trim();
  if (!id) return;
  setLoading("perawi-output");
  try {
    const data = await fetchJson(`/hadist/perawi/id/${id}`);
    const d = data.data || data;
    const html = `
      <div class="title">${escapeHtml(d.name || "Perawi")}</div>
      ${renderKeyValue([
        ["ID", d.id],
        ["Grade", d.grade || "-"],
        ["Birth", d.birth_date_place || d.birth_date || "-"],
        ["Death", d.death_date_place || d.death_date || "-"],
        ["Teachers", d.teachers || "-"],
        ["Students", d.students || "-"],
      ])}
    `;
    setHtml("perawi-output", html);
  } catch (err) {
    setOutput("perawi-output", `Error: ${err.message}`);
  }
});
