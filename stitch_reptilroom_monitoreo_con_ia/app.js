const chips = document.querySelectorAll('.chip');
const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');
const locationModal = document.getElementById('locationModal');
const locationButton = document.getElementById('locationButton');
const allowLocationButton = document.getElementById('allowLocationButton');
const locationMessage = document.getElementById('locationMessage');
const vetSearchInput = document.getElementById('vetSearchInput');
const vetSearchButton = document.getElementById('vetSearchButton');
const vetMapEl = document.getElementById('vetMap');
const vetResults = document.getElementById('vetResults');
const installButton = document.getElementById('installButton');
const cameraModal = document.getElementById('cameraModal');
const openCameraButton = document.getElementById('openCameraButton');
const startCameraButton = document.getElementById('startCameraButton');
const capturePhotoButton = document.getElementById('capturePhotoButton');
const choosePhotoButton = document.getElementById('choosePhotoButton');
const cameraFileInput = document.getElementById('cameraFileInput');
const galleryFileInput = document.getElementById('galleryFileInput');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraPhoto = document.getElementById('cameraPhoto');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const cameraStatus = document.getElementById('cameraStatus');
let cameraStream;
let installPromptEvent;

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
  });
});

const navItems = document.querySelectorAll('.nav-item');
const bottomItems = document.querySelectorAll('.bottom-item');
const viewPanels = document.querySelectorAll('.panel[data-view]');

function switchView(viewName) {
  viewPanels.forEach(p => p.classList.toggle('active-view', p.dataset.view === viewName));
  bottomItems.forEach(b => b.classList.toggle('active', b.dataset.view === viewName));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.view === viewName));
}

document.querySelectorAll('[data-view]').forEach(btn => {
  if (btn.classList.contains('bottom-item') || btn.classList.contains('nav-item')) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
});

// Quick-action buttons on Home panel
document.querySelectorAll('[data-navigate]').forEach(el => {
  el.addEventListener('click', () => {
    const target = el.dataset.navigate;
    if (target === 'profile') {
      openModal(loginModal);
    } else {
      switchView(target);
    }
  });
});

switchView('home');

// ── HOME RENDERING ──────────────────────────────────────────────────────

function renderHome() {
  const container = document.getElementById('homeRecentAnimals');
  if (!container) return;
  const animals = getAnimals();
  container.innerHTML = animals.slice(0, 4).map(a => {
    const s = getAnimalSummary(a.id);
    const weightText = s.weight ? s.weight.value + 'g' : '—';
    const weightLogs = getAnimalLogs(a.id, 'weight_logs');
    const feedLogs = getAnimalLogs(a.id, 'feeding_logs');
    const totalRecords = weightLogs.length + feedLogs.length + getAnimalLogs(a.id, 'shedding_logs').length + getAnimalLogs(a.id, 'climate_logs').length;
    return '<div class="home-animal-card" data-animal-id="' + a.id + '">'
      + '<img src="' + (a.avatar_url || '') + '" alt="' + a.name + '" />'
      + '<div class="home-animal-info">'
      + '<strong>' + a.name + '</strong>'
      + '<small>' + a.species + '</small>'
      + '</div>'
      + '<div class="home-animal-meta">'
      + '<span class="home-animal-weight">' + weightText + '</span>'
      + '<span class="home-animal-records">' + totalRecords + ' registro' + (totalRecords !== 1 ? 's' : '') + '</span>'
      + '</div>'
      + '</div>';
  }).join('');

  container.querySelectorAll('.home-animal-card').forEach(card => {
    card.addEventListener('click', () => openFicha(card.dataset.animalId));
  });

  // Update greeting avatar to match auth state
  const homeAvatarImg = document.getElementById('homeAvatarImg');
  const homeAvatarText = document.getElementById('homeAvatarText');
  if (window.AuthService?.isAuthenticated()) {
    const user = window.AuthService.getUser?.();
    if (user && homeAvatarText) {
      homeAvatarImg.hidden = true;
      homeAvatarText.hidden = false;
      homeAvatarText.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
    }
  }
}

// ── DEMO DATA ──────────────────────────────────────────────────────────────

const DEMO_ANIMALS = [
  { id: 'demo-ziggy', name: 'Ziggy', species: 'Eublepharis macularius', morph: 'Bell Albino', sex: 'male', avatar_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80', enclosure: 'Terrario A-1' },
  { id: 'demo-kaa', name: 'Kaa', species: 'Python regius', morph: 'Pastel', sex: 'female', avatar_url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=900&q=80', enclosure: 'Terrario B-3' },
  { id: 'demo-goliath', name: 'Goliath', species: 'Ceratophrys cranwelli', morph: '', sex: 'unknown', avatar_url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80', enclosure: 'Terrario T-2' },
];

const DEMO_LOGS = {
  'demo-ziggy': {
    weight_logs: [
      { id: 'dw1', value: 68.5, weight_date: '2024-05-12', created_at: '2024-05-12', notes: 'Post-muda normal' },
      { id: 'dw2', value: 67.0, weight_date: '2024-04-28', created_at: '2024-04-28', notes: 'Calcio D3 enriquecido' },
      { id: 'dw3', value: 64.5, weight_date: '2024-03-30', created_at: '2024-03-30', notes: '' },
      { id: 'dw4', value: 63.0, weight_date: '2024-02-12', created_at: '2024-02-12', notes: '' },
      { id: 'dw5', value: 61.0, weight_date: '2024-01-15', created_at: '2024-01-15', notes: 'Inicio año' },
    ],
    feeding_logs: [{ id: 'df1', prey_type: 'Grillo', prey_size: 'Medium', accepted: true, created_at: '2024-05-11', notes: '' }],
    shedding_logs: [{ id: 'ds1', complete: true, created_at: '2024-05-10', notes: 'Muda completa' }],
    climate_logs: [{ id: 'dc1', temp_hot: 31.4, temp_cool: 26.0, humidity: 45, created_at: '2024-05-12', notes: '' }],
    length_logs: [],
  },
  'demo-kaa': {
    weight_logs: [{ id: 'kw1', value: 1420, weight_date: '2024-05-10', created_at: '2024-05-10', notes: '' }],
    feeding_logs: [],
    shedding_logs: [{ id: 'ks1', complete: false, created_at: '2024-05-08', notes: 'Muda en progreso' }],
    climate_logs: [{ id: 'kc1', temp_hot: 27.0, temp_cool: 24.0, humidity: 65, created_at: '2024-05-10', notes: '' }],
    length_logs: [],
  },
  'demo-goliath': {
    weight_logs: [{ id: 'gw1', value: 145, weight_date: '2024-05-09', created_at: '2024-05-09', notes: '' }],
    feeding_logs: [{ id: 'gf1', prey_type: 'Ratón', prey_size: 'Small', accepted: true, created_at: '2024-05-09', notes: '' }],
    shedding_logs: [],
    climate_logs: [{ id: 'gc1', temp_hot: 24.0, temp_cool: 22.0, humidity: 80, created_at: '2024-05-09', notes: '' }],
    length_logs: [],
  },
};

// ── HELPERS ────────────────────────────────────────────────────────────────

function getAnimals() {
  if (window.AuthService?.isAuthenticated()) return window.DataService.list('reptiles');
  return DEMO_ANIMALS;
}

function getAnimalLogs(reptileId, collection) {
  if (window.AuthService?.isAuthenticated()) return window.DataService.list(collection).filter(r => r.reptile_id === reptileId);
  return (DEMO_LOGS[reptileId]?.[collection] || []);
}

function sortByDate(arr, dateField = 'created_at') {
  return [...arr].sort((a, b) => {
    const da = new Date(a[dateField] || a.weight_date || a.created_at);
    const db = new Date(b[dateField] || b.weight_date || b.created_at);
    return db - da;
  });
}

function getWeightDate(log) {
  return log.weight_date || log.created_at;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getAnimalStatus(animal, summary) {
  if (summary.shed && !summary.shed.complete) return { label: 'Muda activa', alert: true, safe: false };
  if (summary.feeding) {
    const daysSince = (Date.now() - new Date(summary.feeding.created_at).getTime()) / 86400000;
    if (daysSince > 7) return { label: 'Alimentar', alert: true, safe: false };
  }
  if (summary.weight) return { label: 'Saludable', alert: false, safe: true };
  return { label: 'Sin datos', alert: false, safe: true };
}

function getAnimalSummary(reptileId) {
  const weights = sortByDate(getAnimalLogs(reptileId, 'weight_logs'));
  const feedings = sortByDate(getAnimalLogs(reptileId, 'feeding_logs'));
  const sheds = sortByDate(getAnimalLogs(reptileId, 'shedding_logs'));
  const climates = sortByDate(getAnimalLogs(reptileId, 'climate_logs'));
  const lengths = sortByDate(getAnimalLogs(reptileId, 'length_logs'));
  return {
    weight: weights[0], prevWeight: weights[1],
    feeding: feedings[0], shed: sheds[0],
    climate: climates[0], length: lengths[0],
  };
}

// ── COLLECTION RENDERING ───────────────────────────────────────────────────

function renderCollection(filter = '') {
  const container = document.getElementById('specimenListContainer');
  if (!container) return;
  const animals = getAnimals().filter(a =>
    !filter || a.name.toLowerCase().includes(filter) || a.species.toLowerCase().includes(filter)
  );
  container.innerHTML = animals.map(a => {
    const s = getAnimalSummary(a.id);
    const weightText = s.weight ? s.weight.value + 'g' : '—';
    const delta = s.weight && s.prevWeight ? (s.weight.value - s.prevWeight.value) : null;
    const deltaText = delta !== null ? (delta > 0 ? '+' : '') + delta + 'g' : '';
    const status = getAnimalStatus(a, s);
    return '<article class="specimen-card' + (status.alert ? ' alert-specimen' : '') + '" data-animal-id="' + a.id + '">'
      + '<div class="specimen-image">'
      + '<img src="' + (a.avatar_url || '') + '" alt="' + a.name + '" />'
      + '<div class="badge floating' + (status.alert ? ' warning' : '') + '">' + status.label + '</div>'
      + '</div>'
      + '<div class="specimen-body">'
      + '<div class="specimen-top"><h3>' + a.name + '</h3><span class="mini-tag ' + (status.safe ? 'safe' : 'warning') + '">' + status.label + '</span></div>'
      + '<p>' + a.species + (a.morph ? ' · ' + a.morph : '') + '</p>'
      + '<div class="specimen-stats">'
      + '<div><small>' + (a.enclosure || '') + '</small><strong>' + (s.climate ? s.climate.temp_hot + '°C' : '—') + '</strong></div>'
      + '<div class="specimen-weight-link" data-animal-id="' + a.id + '"><small>Peso</small><strong>' + weightText + ' ' + deltaText + '</strong></div>'
      + '</div>'
      + '</div>'
      + '</article>';
  }).join('');

  container.querySelectorAll('.specimen-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.specimen-weight-link')) {
        openFicha(card.dataset.animalId, 'peso');
      } else {
        openFicha(card.dataset.animalId);
      }
    });
  });
}

// Render home after data is defined
renderHome();

// ── FICHA ──────────────────────────────────────────────────────────────────

let currentAnimalId = null;

function openFicha(animalId, initialTab = 'general') {
  currentAnimalId = animalId;
  renderFicha(animalId, initialTab);
  switchView('ficha');
  document.querySelectorAll('.ficha-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === initialTab));
}

function renderFicha(animalId, initialTab = 'general') {
  const animal = getAnimals().find(a => a.id === animalId);
  if (!animal) return;
  document.getElementById('fichaName').textContent = animal.name;
  document.getElementById('fichaSpecies').textContent = animal.species + (animal.morph ? ' · ' + animal.morph : '');

  // Hero image
  const heroImg = document.getElementById('fichaHeroImg');
  if (heroImg) {
    heroImg.src = animal.avatar_url || '';
    heroImg.alt = animal.name;
  }

  // Status badge
  const badge = document.getElementById('fichaStatusBadge');
  if (badge) {
    const s = getAnimalSummary(animalId);
    badge.textContent = s.weight ? 'Activo' : 'Sin datos';
    badge.className = 'ficha-status-badge' + (s.weight ? ' active' : ' inactive');
  }

  renderFichaSummary(animalId);
  renderFichaTab(initialTab, animalId);
  renderFichaEnvironment(animalId);
}

function renderFichaSummary(animalId) {
  const s = getAnimalSummary(animalId);

  // Legacy summary (if old element still present)
  const el = document.getElementById('fichaSummary');
  if (el) {
    const items = [];
    if (s.weight) items.push({ icon: 'scale', label: 'Peso', value: s.weight.value + 'g' });
    if (s.length) items.push({ icon: 'straighten', label: 'Longitud', value: s.length.value + 'cm' });
    if (s.feeding) items.push({ icon: 'restaurant', label: 'Última comida', value: formatDate(s.feeding.created_at) });
    if (s.shed) items.push({ icon: 'water_drop', label: 'Última muda', value: formatDate(s.shed.created_at) });
    if (s.climate) items.push({ icon: 'thermostat', label: 'Clima', value: s.climate.temp_hot + '°C · ' + s.climate.humidity + '%' });
    el.innerHTML = items.map(i =>
      '<div class="ficha-stat"><span class="material-symbols-outlined">' + i.icon + '</span><div><small>' + i.label + '</small><strong>' + i.value + '</strong></div></div>'
    ).join('');
  }

  // Hero stats row (3-column: Peso, Longitud, En colección)
  const statsRow = document.getElementById('fichaStatsRow');
  if (statsRow) {
    const weight = s.weight ? s.weight.value + 'g' : '—';
    const length = s.length ? s.length.value + 'cm' : '—';
    const animal = getAnimals().find(x => x.id === animalId);
    const days = animal && animal.created_at ? Math.floor((Date.now() - new Date(animal.created_at).getTime()) / 86400000) + ' días' : '—';
    statsRow.innerHTML = '<div class="ficha-stat-item"><small>Peso actual</small><strong>' + weight + '</strong></div>'
      + '<div class="ficha-stat-item"><small>Longitud</small><strong>' + length + '</strong></div>'
      + '<div class="ficha-stat-item"><small>En colección</small><strong>' + days + '</strong></div>';
  }
}

function renderFichaEnvironment(animalId) {
  const el = document.getElementById('fichaEnvironment');
  if (!el) return;
  const s = getAnimalSummary(animalId);
  const temp = s.climate ? s.climate.temp_hot + '°C' : '—';
  const humidity = s.climate ? s.climate.humidity + '%' : '—';
  const lastFeed = s.feeding ? formatDate(s.feeding.created_at) : '—';
  const lastShed = s.shed ? formatDate(s.shed.created_at) : '—';

  // Temperature indicator - clickable
  el.innerHTML = '<div class="ficha-env-item ficha-env-clickable" id="tempIndicator" data-animal-id="' + animalId + '">' +
    '<small>🌡 Temperatura</small><strong>' + temp + '</strong></div>'
    + '<div class="ficha-env-item ficha-env-clickable" id="humidityIndicator" data-animal-id="' + animalId + '">' +
    '<small>💧 Humedad</small><strong>' + humidity + '</strong></div>'
    + '<div class="ficha-env-item"><small>🍽 Última alimentación</small><strong>' + lastFeed + '</strong></div>'
    + '<div class="ficha-env-item ficha-env-clickable" id="sheddingIndicator" data-animal-id="' + animalId + '">' +
    '<small>🐍 Última muda</small><strong>' + lastShed + '</strong></div>';

  // Add temperature panel below
  renderTemperaturePanel(el, animalId);
  // Add humidity panel below
  renderHumidityPanel(el, animalId);
  // Add shedding panel below
  renderSheddingPanel(el, animalId);

  // Wire click on temperature indicator
  document.getElementById('tempIndicator')?.addEventListener('click', () => toggleTemperaturePanel(animalId));
  // Wire click on humidity indicator
  document.getElementById('humidityIndicator')?.addEventListener('click', () => toggleHumidityPanel(animalId));
  // Wire click on shedding indicator
  document.getElementById('sheddingIndicator')?.addEventListener('click', () => toggleSheddingPanel(animalId));
}

let temperaturePanelExpanded = {};

function toggleTemperaturePanel(animalId) {
  const panel = document.getElementById('temperaturePanel-' + animalId);
  if (!panel) return;
  temperaturePanelExpanded[animalId] = !temperaturePanelExpanded[animalId];
  panel.hidden = !temperaturePanelExpanded[animalId];
  panel.classList.toggle('expanded', temperaturePanelExpanded[animalId]);
}

function renderTemperaturePanel(container, animalId) {
  const s = getAnimalSummary(animalId);
  const tempLogs = sortByDate(getAnimalLogs(animalId, 'climate_logs'));
  const currentTemp = s.climate ? s.climate.temp_hot + '°C' : '—';

  // Temperature panel
  const panel = document.createElement('div');
  panel.id = 'temperaturePanel-' + animalId;
  panel.className = 'temperature-panel';
  panel.hidden = true;

  // Chart section
  const chartHtml = renderTemperatureChart(tempLogs);

  panel.innerHTML = '<div class="temp-panel-header">' +
    '<h4>Historial de Temperatura</h4>' +
    '<button class="secondary-btn full-width" id="addTempBtn-' + animalId + '" data-animal="' + animalId + '">' +
    '<span class="material-symbols-outlined">add</span> Registrar temperatura</button></div>' +
    '<div class="temp-chart-section">' + chartHtml + '</div>';

  // History list
  if (tempLogs.length > 0) {
    panel.innerHTML += '<div class="temp-history"><small>' + tempLogs.length + ' registros</small>' +
      '<div class="history-list">' + tempLogs.map(log =>
        '<div class="history-item"><div class="icon-wrap"><span class="material-symbols-outlined">thermostat</span></div>' +
        '<div><div class="history-top"><strong>' + log.temp_hot + '°C</strong></div>' +
        '<small>' + formatDate(log.created_at) + (log.notes ? ' • ' + log.notes : '') + '</small></div></div>'
      ).join('') + '</div></div>';
  } else {
    panel.innerHTML += '<div class="empty-state"><span class="material-symbols-outlined">show_chart</span>' +
      '<p>Sin registros. Registra tu primera medición.</p></div>';
  }

  container.appendChild(panel);

  // Wire add temperature button
  document.getElementById('addTempBtn-' + animalId)?.addEventListener('click', () => {
    showRecordModal('climate_logs', animalId);
  });
}

function renderTemperatureChart(logs) {
  // Filter logs with temp_hot data
  const tempLogs = logs.filter(l => l.temp_hot != null);
  if (tempLogs.length < 2) {
    return '<div class="chart-single-point"><span class="material-symbols-outlined">show_chart</span>' +
      '<small>' + (tempLogs.length === 0 ? 'Sin datos suficientes para mostrar gráfica.' :
        'Solo hay ' + tempLogs.length + ' registro. Necesitas al menos 2.') + '</small></div>';
  }

  // Sort by date ascending for chart
  const sorted = [...tempLogs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const W = 340, H = 120, PAD_L = 40, PAD_R = 12, PAD_T = 16, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = sorted.map(l => l.temp_hot);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padRange = range * 0.1;
  const yMin = Math.max(0, minV - padRange);
  const yMax = maxV + padRange;

  const dates = sorted.map(l => new Date(l.created_at).getTime());
  const tMin = dates[0];
  const tMax = dates[dates.length - 1];
  const tRange = tMax - tMin || 1;

  function x(i) { return PAD_L + ((dates[i] - tMin) / tRange) * chartW; }
  function y(v) { return PAD_T + chartH - ((v - yMin) / (yMax - yMin)) * chartH; }

  // Grid lines + Y labels
  const gridSteps = 4;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  for (let i = 0; i <= gridSteps; i++) {
    const val = yMin + (i / gridSteps) * (yMax - yMin);
    const yPos = y(val);
    svg += '<line x1="' + PAD_L + '" y1="' + yPos + '" x2="' + (W - PAD_R) + '" y2="' + yPos + '" stroke="rgba(255,255,255,0.06)" />';
    svg += '<text x="' + (PAD_L - 6) + '" y="' + (yPos + 3) + '" text-anchor="end" fill="rgba(255,255,255,0.35)" font-size="9">' + Math.round(val) + '°C</text>';
  }

  // X axis labels
  const xLabels = sorted.length <= 6 ? sorted : sorted.filter((_, i) => i % Math.ceil(sorted.length / 5) === 0 || i === sorted.length - 1);
  xLabels.forEach((log, _, arr) => {
    const idx = sorted.indexOf(log);
    const d = new Date(log.created_at);
    const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    svg += '<text x="' + x(idx) + '" y="' + (H - 4) + '" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="8">' + label + '</text>';
  });

  // Area fill
  const areaPoints = sorted.map((_, i) => x(i) + ',' + y(sorted[i].temp_hot)).join(' ');
  svg += '<polygon points="' + x(0) + ',' + (PAD_T + chartH) + ' ' + areaPoints + ' ' + x(sorted.length - 1) + ',' + (PAD_T + chartH)
    + '" fill="url(#tempGrad)" opacity="0.3" />';

  // Line
  const linePoints = sorted.map((_, i) => x(i) + ',' + y(sorted[i].temp_hot)).join(' ');
  svg += '<polyline points="' + linePoints + '" fill="none" stroke="var(--secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />';

  // Gradient
  svg = '<defs><linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="var(--secondary)" stop-opacity="0.4" />' +
    '<stop offset="100%" stop-color="var(--secondary)" stop-opacity="0" />' +
    '</linearGradient></defs>' + svg;

  // Data points
  sorted.forEach((log, i) => {
    svg += '<g class="point" data-idx="' + i + '">' +
      '<circle cx="' + x(i) + '" cy="' + y(log.temp_hot) + '" r="12" fill="transparent" />' +
      '<circle cx="' + x(i) + '" cy="' + y(log.temp_hot) + '" r="3.5" fill="var(--bg)" stroke="var(--secondary)" stroke-width="2" />' +
      '</g>';
  });

  svg += '</svg>';
  return '<div class="temp-chart-wrap">' + svg + '</div>';
}

// ============ HUMEDAD ============

let humidityPanelExpanded = {};

function toggleHumidityPanel(animalId) {
  const panel = document.getElementById('humidityPanel-' + animalId);
  if (!panel) return;
  humidityPanelExpanded[animalId] = !humidityPanelExpanded[animalId];
  panel.hidden = !humidityPanelExpanded[animalId];
  panel.classList.toggle('expanded', humidityPanelExpanded[animalId]);
}

function renderHumidityPanel(container, animalId) {
  const s = getAnimalSummary(animalId);
  const climateLogs = sortByDate(getAnimalLogs(animalId, 'climate_logs'));
  const humidityLogs = climateLogs.filter(l => l.humidity != null);
  const currentHumidity = s.climate ? s.climate.humidity + '%' : '—';

  // Humidity panel
  const panel = document.createElement('div');
  panel.id = 'humidityPanel-' + animalId;
  panel.className = 'temperature-panel humidity-panel'; // Reuse temp styles
  panel.hidden = true;

  // Chart section
  const chartHtml = renderHumidityChart(humidityLogs);

  panel.innerHTML = '<div class="temp-panel-header">' +
    '<h4>Historial de Humedad</h4>' +
    '<button class="secondary-btn full-width" id="addHumidityBtn-' + animalId + '" data-animal="' + animalId + '">' +
    '<span class="material-symbols-outlined">add</span> Registrar humedad</button></div>' +
    '<div class="temp-chart-section">' + chartHtml + '</div>';

  // History list
  if (humidityLogs.length > 0) {
    panel.innerHTML += '<div class="temp-history"><small>' + humidityLogs.length + ' registros</small>' +
      '<div class="history-list">' + humidityLogs.map(log =>
        '<div class="history-item"><div class="icon-wrap"><span class="material-symbols-outlined">water_drop</span></div>' +
        '<div><div class="history-top"><strong>' + log.humidity + '%</strong></div>' +
        '<small>' + formatDate(log.created_at) + (log.notes ? ' • ' + log.notes : '') + '</small></div></div>'
      ).join('') + '</div></div>';
  } else {
    panel.innerHTML += '<div class="empty-state"><span class="material-symbols-outlined">water_drop</span>' +
      '<p>Sin registros. Registra tu primera medición.</p></div>';
  }

  container.appendChild(panel);

  // Wire add humidity button
  document.getElementById('addHumidityBtn-' + animalId)?.addEventListener('click', () => {
    showRecordModal('climate_logs', animalId);
  });
}

// ============ MUDA ============

let sheddingPanelExpanded = {};

function toggleSheddingPanel(animalId) {
  const panel = document.getElementById('sheddingPanel-' + animalId);
  if (!panel) return;
  sheddingPanelExpanded[animalId] = !sheddingPanelExpanded[animalId];
  panel.hidden = !sheddingPanelExpanded[animalId];
  panel.classList.toggle('expanded', sheddingPanelExpanded[animalId]);
}

function renderSheddingPanel(container, animalId) {
  const s = getAnimalSummary(animalId);
  const shedLogs = sortByDate(getAnimalLogs(animalId, 'shedding_logs'));
  const currentShed = s.shed ? formatDate(s.shed.created_at) : '—';

  const panel = document.createElement('div');
  panel.id = 'sheddingPanel-' + animalId;
  panel.className = 'temperature-panel shedding-panel';
  panel.hidden = true;

  panel.innerHTML = '<div class="temp-panel-header">' +
    '<h4>Historial de Mudas</h4>' +
    '<button class="secondary-btn full-width" id="addSheddingBtn-' + animalId + '" data-animal="' + animalId + '">' +
    '<span class="material-symbols-outlined">add</span> Registrar muda</button></div>';

  if (shedLogs.length > 0) {
    panel.innerHTML += '<div class="temp-history"><small>' + shedLogs.length + ' registros</small>' +
      '<div class="history-list">' + shedLogs.map(log =>
        '<div class="history-item"><div class="icon-wrap"><span class="material-symbols-outlined">water_drop</span></div>' +
        '<div><div class="history-top"><strong>' + formatDate(log.created_at) + '</strong> ' +
        (log.complete ? '✅ Completa' : '⚠️ Incompleta') + '</div>' +
        '<small>' + (log.notes || '') + '</small></div></div>'
      ).join('') + '</div></div>';
  } else {
    panel.innerHTML += '<div class="empty-state"><span class="material-symbols-outlined">water_drop</span>' +
      '<p>Sin registros. Registra tu primera muda.</p></div>';
  }

  container.appendChild(panel);

  document.getElementById('addSheddingBtn-' + animalId)?.addEventListener('click', () => {
    showRecordModal('shedding_logs', animalId);
  });
}

function renderHumidityChart(logs) {
  // Filter logs with humidity data
  const humidityLogs = logs.filter(l => l.humidity != null);
  if (humidityLogs.length < 2) {
    return '<div class="chart-single-point"><span class="material-symbols-outlined">water_drop</span>' +
      '<small>' + (humidityLogs.length === 0 ? 'Sin datos suficientes para mostrar gráfica.' :
        'Solo hay ' + humidityLogs.length + ' registro. Necesitas al menos 2.') + '</small></div>';
  }

  // Sort by date ascending for chart
  const sorted = [...humidityLogs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const W = 340, H = 120, PAD_L = 40, PAD_R = 12, PAD_T = 16, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = sorted.map(l => l.humidity);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padRange = range * 0.1;
  const yMin = Math.max(0, minV - padRange);
  const yMax = Math.min(100, maxV + padRange); // Humidity max is 100%

  const dates = sorted.map(l => new Date(l.created_at).getTime());
  const tMin = dates[0];
  const tMax = dates[dates.length - 1];
  const tRange = tMax - tMin || 1;

  function x(i) { return PAD_L + ((dates[i] - tMin) / tRange) * chartW; }
  function y(v) { return PAD_T + chartH - ((v - yMin) / (yMax - yMin)) * chartH; }

  // Grid lines + Y labels
  const gridSteps = 4;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  for (let i = 0; i <= gridSteps; i++) {
    const val = yMin + (i / gridSteps) * (yMax - yMin);
    const yPos = y(val);
    svg += '<line x1="' + PAD_L + '" y1="' + yPos + '" x2="' + (W - PAD_R) + '" y2="' + yPos + '" stroke="rgba(255,255,255,0.06)" />';
    svg += '<text x="' + (PAD_L - 6) + '" y="' + (yPos + 3) + '" text-anchor="end" fill="rgba(255,255,255,0.35)" font-size="9">' + Math.round(val) + '%</text>';
  }

  // X axis labels
  const xLabels = sorted.length <= 6 ? sorted : sorted.filter((_, i) => i % Math.ceil(sorted.length / 5) === 0 || i === sorted.length - 1);
  xLabels.forEach((log, _, arr) => {
    const idx = sorted.indexOf(log);
    const xPos = x(idx);
    svg += '<text x="' + xPos + '" y="' + (H - 6) + '" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="9">' + formatDateShort(log.created_at) + '</text>';
  });

  // Line path
  let pathD = 'M ' + x(0) + ' ' + y(sorted[0].humidity);
  for (let i = 1; i < sorted.length; i++) {
    pathD += ' L ' + x(i) + ' ' + y(sorted[i].humidity);
  }
  svg += '<path d="' + pathD + '" fill="none" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />';

  // Points
  sorted.forEach((log, i) => {
    svg += '<circle cx="' + x(i) + '" cy="' + y(log.humidity) + '" r="4" fill="#60A5FA" stroke="var(--bg, #06100d)" stroke-width="1.5" />';
  });

  svg += '</svg>';
  return '<div class="temp-chart-wrap">' + svg + '</div>';
}

function renderFichaTab(tabName, animalId) {
  const container = document.getElementById('fichaContent');
  document.querySelectorAll('.ficha-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  switch (tabName) {
    case 'general': renderGeneralTab(container, animalId); break;
    case 'peso': renderWeightTab(container, animalId); break;
    case 'temperatura': renderTempTab(container, animalId); break;
    case 'humedad': renderHumTab(container, animalId); break;
    case 'alimentacion': renderFeedingTab(container, animalId); break;
    case 'muda': renderMudaTab(container, animalId); break;
    case 'clima': renderLogTab(container, animalId, 'climate_logs', { display: 'climate', icon: 'thermostat', addLabel: 'Registrar clima' }); break;
    case 'mudas': renderLogTab(container, animalId, 'shedding_logs', { display: 'shedding', icon: 'water_drop', addLabel: 'Registrar muda' }); break;
    case 'observaciones': renderGeneralTab(container, animalId, true); break;
    case 'fotos': container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">photo_library</span><p>Fotos próximamente</p></div>'; break;
    case 'timeline': renderTimeline(container, animalId); break;
  }
}

document.getElementById('fichaTabs')?.addEventListener('click', (e) => {
  const tab = e.target.closest('.ficha-tab');
  if (tab && currentAnimalId) renderFichaTab(tab.dataset.tab, currentAnimalId);
});

document.getElementById('fichaBackBtn')?.addEventListener('click', () => {
  currentAnimalId = null;
  switchView('reptiles');
});

// ── TAB RENDERS ────────────────────────────────────────────────────────────

function renderGeneralTab(container, animalId, notesOnly) {
  const animal = getAnimals().find(a => a.id === animalId);
  if (!animal) return;
  if (notesOnly) {
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">note</span><p>Sin observaciones registradas</p></div>';
    return;
  }
  const s = getAnimalSummary(animalId);
  const lengthValue = s.length ? s.length.value : null;
  const lengthDisplay = lengthValue ? lengthValue + ' cm' : '—';

  // Build editable rows
  let html = '<div class="info-rows">';

  // Especie (not editable - derived from animal data)
  html += '<div class="info-row"><span class="muted">Especie</span><strong>' + animal.species + '</strong></div>';

  // Morf editable
  const morphValue = animal.morph || '';
  const morphDisplay = morphValue || '—';
  html += '<div class="info-row info-row-editable" id="morphRow" data-animal-id="' + animalId + '" data-field="morph">' +
    '<span class="muted">Morf</span>' +
    '<div class="info-value-editable">' +
    '<strong id="morphDisplay">' + morphDisplay + '</strong>' +
    '<button class="info-edit-btn" id="editMorphBtn" type="button" aria-label="Editar morf">' +
    '<span class="material-symbols-outlined">edit</span></button></div></div>';

  // Sexo editable
  const sexValue = animal.sex || '';
  const sexDisplay = sexLabel(sexValue) || '—';
  html += '<div class="info-row info-row-editable" id="sexRow" data-animal-id="' + animalId + '" data-field="sex">' +
    '<span class="muted">Sexo</span>' +
    '<div class="info-value-editable">' +
    '<strong id="sexDisplay">' + sexDisplay + '</strong>' +
    '<button class="info-edit-btn" id="editSexBtn" type="button" aria-label="Editar sexo">' +
    '<span class="material-symbols-outlined">edit</span></button></div></div>';

  // Terrario editable
  const terrarioValue = animal.enclosure || '';
  const terrarioDisplay = terrarioValue || '—';
  html += '<div class="info-row info-row-editable" id="terrarioRow" data-animal-id="' + animalId + '" data-field="enclosure">' +
    '<span class="muted">Terrario</span>' +
    '<div class="info-value-editable">' +
    '<strong id="terrarioDisplay">' + terrarioDisplay + '</strong>' +
    '<button class="info-edit-btn" id="editTerrarioBtn" type="button" aria-label="Editar terrario">' +
    '<span class="material-symbols-outlined">edit</span></button></div></div>';

  html += '</div>';

  // Longitud editable
  html += '<div class="info-row info-row-editable" id="lengthRow" data-animal-id="' + animalId + '">' +
    '<span class="muted">Longitud</span>' +
    '<div class="info-value-editable">' +
    '<strong id="lengthDisplay">' + lengthDisplay + '</strong>' +
    '<button class="info-edit-btn" id="editLengthBtn" type="button" aria-label="Editar longitud">' +
    '<span class="material-symbols-outlined">edit</span></button></div></div>';

  html += '</div>';

  // Inline edit forms (hidden by default)
  html += '<div class="length-edit-form" id="lengthEditForm" hidden>' +
    '<div class="form-group">' +
    '<label for="lengthInput">Longitud (cm)</label>' +
    '<input type="number" id="lengthInput" step="0.1" min="0" max="500" placeholder="Ej. 25.5" />' +
    '</div>' +
    '<div class="form-actions">' +
    '<button class="secondary-btn" id="cancelLengthBtn" type="button">Cancelar</button>' +
    '<button class="primary-btn" id="saveLengthBtn" type="button">Guardar</button>' +
    '</div></div>';

  html += '<div class="morph-edit-form" id="morphEditForm" hidden>' +
    '<div class="form-group">' +
    '<label for="morphInput">Morf</label>' +
    '<input type="text" id="morphInput" placeholder="Ej. Bell Albino" />' +
    '</div>' +
    '<div class="form-actions">' +
    '<button class="secondary-btn" id="cancelMorphBtn" type="button">Cancelar</button>' +
    '<button class="primary-btn" id="saveMorphBtn" type="button">Guardar</button>' +
    '</div></div>';

  html += '<div class="sex-edit-form" id="sexEditForm" hidden>' +
    '<div class="form-group">' +
    '<label for="sexSelect">Sexo</label>' +
    '<select id="sexSelect">' +
    '<option value="male">Macho</option>' +
    '<option value="female">Hembra</option>' +
    '<option value="">Desconocido</option>' +
    '</select>' +
    '</div>' +
    '<div class="form-actions">' +
    '<button class="secondary-btn" id="cancelSexBtn" type="button">Cancelar</button>' +
    '<button class="primary-btn" id="saveSexBtn" type="button">Guardar</button>' +
    '</div></div>';

  html += '<div class="terrario-edit-form" id="terrarioEditForm" hidden>' +
    '<div class="form-group">' +
    '<label for="terrarioInput">Terrario</label>' +
    '<input type="text" id="terrarioInput" placeholder="Ej. Terrario A-1" />' +
    '</div>' +
    '<div class="form-actions">' +
    '<button class="secondary-btn" id="cancelTerrarioBtn" type="button">Cancelar</button>' +
    '<button class="primary-btn" id="saveTerrarioBtn" type="button">Guardar</button>' +
    '</div></div>';

  container.innerHTML = html;

  // Wire edit button
  const editBtn = document.getElementById('editLengthBtn');
  const editForm = document.getElementById('lengthEditForm');
  const lengthInput = document.getElementById('lengthInput');
  const saveBtn = document.getElementById('saveLengthBtn');
  const cancelBtn = document.getElementById('cancelLengthBtn');
  const lengthDisplayEl = document.getElementById('lengthDisplay');

  editBtn?.addEventListener('click', () => {
    lengthInput.value = lengthValue || '';
    editForm.hidden = false;
    lengthInput.focus();
  });

  cancelBtn?.addEventListener('click', () => {
    editForm.hidden = true;
  });

  saveBtn?.addEventListener('click', () => {
    const val = parseFloat(lengthInput.value);
    if (isNaN(val) || val < 0) {
      alert('Introduce un valor válido (número positivo)');
      return;
    }
    saveLength(animalId, val);
    editForm.hidden = true;
    lengthDisplayEl.textContent = val + ' cm';
    renderFichaSummary(animalId);
  });
}

// ============ MORF EDITABLE ============
const morphEditBtn = document.getElementById('editMorphBtn');
const morphForm = document.getElementById('morphEditForm');
const morphInput = document.getElementById('morphInput');
const morphSaveBtn = document.getElementById('saveMorphBtn');
const morphCancelBtn = document.getElementById('cancelMorphBtn');
const morphDisplayEl = document.getElementById('morphDisplay');

morphEditBtn?.addEventListener('click', () => {
  morphInput.value = morphValue;
  morphForm.hidden = false;
  morphInput.focus();
});

morphCancelBtn?.addEventListener('click', () => {
  morphForm.hidden = true;
});

morphSaveBtn?.addEventListener('click', () => {
  const val = morphInput.value.trim();
  updateAnimalField(animalId, 'morph', val);
  morphForm.hidden = true;
  morphDisplayEl.textContent = val || '—';
  renderFichaSummary(animalId);
});

// ============ SEXO EDITABLE ============
const sexEditBtn = document.getElementById('editSexBtn');
const sexForm = document.getElementById('sexEditForm');
const sexSelect = document.getElementById('sexSelect');
const sexSaveBtn = document.getElementById('saveSexBtn');
const sexCancelBtn = document.getElementById('cancelSexBtn');
const sexDisplayEl = document.getElementById('sexDisplay');

sexEditBtn?.addEventListener('click', () => {
  sexSelect.value = sexValue;
  sexForm.hidden = false;
  sexSelect.focus();
});

sexCancelBtn?.addEventListener('click', () => {
  sexForm.hidden = true;
});

sexSaveBtn?.addEventListener('click', () => {
  const val = sexSelect.value;
  updateAnimalField(animalId, 'sex', val);
  sexForm.hidden = true;
  sexDisplayEl.textContent = sexLabel(val);
  renderFichaSummary(animalId);
});

// ============ TERRARIO EDITABLE ============
const terrarioEditBtn = document.getElementById('editTerrarioBtn');
const terrarioForm = document.getElementById('terrarioEditForm');
const terrarioInput = document.getElementById('terrarioInput');
const terrarioSaveBtn = document.getElementById('saveTerrarioBtn');
const terrarioCancelBtn = document.getElementById('cancelTerrarioBtn');
const terrarioDisplayEl = document.getElementById('terrarioDisplay');

terrarioEditBtn?.addEventListener('click', () => {
  terrarioInput.value = terrarioValue;
  terrarioForm.hidden = false;
  terrarioInput.focus();
});

terrarioCancelBtn?.addEventListener('click', () => {
  terrarioForm.hidden = true;
});

terrarioSaveBtn?.addEventListener('click', () => {
  const val = terrarioInput.value.trim();
  updateAnimalField(animalId, 'enclosure', val);
  terrarioForm.hidden = true;
  terrarioDisplayEl.textContent = val || '—';
  renderFichaSummary(animalId);
});

function saveLength(animalId, valueCm) {
  const today = new Date().toISOString().slice(0, 10);
  const record = {
    reptile_id: animalId,
    value: valueCm,
    created_at: today,
    notes: ''
  };

  if (window.AuthService?.isAuthenticated()) {
    window.DataService.create('length_logs', record);
  } else {
    // Demo mode: update DEMO_LOGS
    if (!DEMO_LOGS[animalId]) DEMO_LOGS[animalId] = {};
    if (!DEMO_LOGS[animalId].length_logs) DEMO_LOGS[animalId].length_logs = [];
    record.id = 'len-' + Date.now();
    DEMO_LOGS[animalId].length_logs.unshift(record);
  }
}

// Update a single field on the animal record (morph, sex, enclosure).
// Demo mode mutates the in-memory DEMO_ANIMALS object directly;
// authenticated mode persists through DataService.update().
function updateAnimalField(animalId, field, value) {
  if (window.AuthService?.isAuthenticated()) {
    const data = {};
    data[field] = value;
    window.DataService.update('reptiles', animalId, data);
  } else {
    const animal = DEMO_ANIMALS.find(a => a.id === animalId);
    if (animal) animal[field] = value;
  }
}

function sexLabel(sex) {
  return sex === 'male' ? 'Macho' : sex === 'female' ? 'Hembra' : 'Desconocido';
}

function renderLogTab(container, animalId, collection, opts) {
  const logs = sortByDate(getAnimalLogs(animalId, collection));
  let html = '<button class="secondary-btn full-width" data-action="add-log" data-collection="' + collection + '" data-animal="' + animalId + '"><span class="material-symbols-outlined">add</span> ' + opts.addLabel + '</button>';

  if (logs.length === 0) {
    html += '<div class="empty-state"><span class="material-symbols-outlined">' + opts.icon + '</span><p>Sin registros</p></div>';
    container.innerHTML = html;
    // Wire button (empty state path)
    container.querySelectorAll('[data-action="add-log"]').forEach(btn => {
      btn.addEventListener('click', () => showRecordModal(btn.dataset.collection, btn.dataset.animal));
    });
    return;
  }

  html += '<div class="history-list">' + logs.map(log => {
    let value = '';
    let note = log.notes || '';
    if (opts.field) {
      value = log[opts.field] + ' ' + opts.unit;
    } else if (opts.display === 'feeding') {
      value = log.prey_type + (log.prey_size ? ' (' + log.prey_size + ')' : '') + (log.accepted ? ' ✓' : ' ✗');
    } else if (opts.display === 'climate') {
      value = log.temp_hot + '°C / ' + log.temp_cool + '°C · ' + log.humidity + '%';
    } else if (opts.display === 'shedding') {
      value = log.complete ? 'Muda completa' : 'Muda incompleta';
    }
    return '<div class="history-item">'
      + '<div class="icon-wrap"><span class="material-symbols-outlined">' + opts.icon + '</span></div>'
      + '<div><div class="history-top"><strong>' + value + '</strong></div>'
      + '<small>' + formatDate(log.created_at) + (note ? ' • ' + note : '') + '</small></div></div>';
  }).join('') + '</div>';

  container.innerHTML = html;
  // Wire add button
  container.querySelectorAll('[data-action="add-log"]').forEach(btn => {
    btn.addEventListener('click', () => showRecordModal(btn.dataset.collection, btn.dataset.animal));
  });
}

// ── WEIGHT TAB + CHART ──────────────────────────────────────────────────────

let weightChartWindow = 'all'; // '7D','30D','3M','6M','1A'
const WEIGHT_WINDOWS = { '7D': 7, '30D': 30, '3M': 90, '6M': 180, '1A': 365 };

function renderWeightTab(container, animalId) {
  const allLogs = getAnimalLogs(animalId, 'weight_logs');
  // Fase 4.4.2.B: descartar registros con valor o fecha no válidos antes de ordenar
  const invalidCount = allLogs.filter(l =>
    !l || isNaN(parseFloat(l.value)) || parseFloat(l.value) <= 0 || isNaN(new Date(getWeightDate(l)).getTime())).length;
  const logs = sortByDate([...allLogs], 'weight_date').filter(l =>
    l && !isNaN(parseFloat(l.value)) && parseFloat(l.value) > 0 && !isNaN(new Date(getWeightDate(l)).getTime()));

  // Current weight + delta
  const current = logs[0];
  const prev = logs[1];
  const currentText = current ? current.value + 'g' : '—';
  const delta = current && prev ? current.value - prev.value : null;
  const deltaText = delta !== null ? (delta > 0 ? '+' : '') + delta.toFixed(1) + 'g' : '';
  // Fase 4.4.2.B: diferencia porcentual entre último y penúltimo registro
  const deltaPct = current && prev && prev.value ? (delta / prev.value) * 100 : null;
  const deltaPctText = deltaPct !== null ? ' (' + (deltaPct > 0 ? '+' : '') + deltaPct.toFixed(1) + '%)' : '';

  // Filter by time window
  const cutoff = WEIGHT_WINDOWS[weightChartWindow];
  const now = Date.now();
  const filtered = cutoff
    ? logs.filter(l => (now - new Date(getWeightDate(l)).getTime()) / 86400000 <= cutoff)
    : logs;

  let html = '';

  // Telemetry header
  html += '<div class="weight-telemetry">'
    + '<div class="weight-telemetry-main"><span class="material-symbols-outlined">scale</span>'
    + '<div><small>Peso actual</small><strong>' + currentText + '</strong></div>'
    + (deltaText ? '<span class="weight-delta ' + (delta > 0 ? 'up' : 'down') + '">' + deltaText + deltaPctText + '</span>' : '')
    + '</div>'
    + '<div class="weight-telemetry-meta"><small>' + (current ? formatDate(getWeightDate(current)) : 'Sin datos') + '</small></div>'
    + '</div>';

  // Chart
  html += '<div class="weight-chart-section">';
  html += '<div class="weight-window-selector">';
  ['all', '7D', '30D', '3M', '6M', '1A'].forEach(w => {
    html += '<button class="weight-window-pill' + (weightChartWindow === w ? ' active' : '') + '" data-window="' + w + '">'
      + (w === 'all' ? 'Todo' : w) + '</button>';
  });
  html += '</div>';

  if (filtered.length >= 2) {
    html += '<div class="chart-wrap" id="weightChart">' + renderWeightChart(filtered) + '</div>';
  } else if (filtered.length === 1) {
    html += '<div class="chart-single-point"><span class="material-symbols-outlined">info</span><small>Solo hay 1 registro en esta ventana. Necesitas al menos 2 para ver la gráfica.</small></div>';
  } else {
    html += '<div class="chart-single-point"><span class="material-symbols-outlined">show_chart</span><small>Sin datos en esta ventana temporal.</small></div>';
  }
  html += '</div>';

  // Insight
  if (logs.length >= 2) {
    const avg = logs.reduce((s, l) => s + l.value, 0) / logs.length;
    const trend = logs[0].value > logs[logs.length - 1].value ? 'creciente' : logs[0].value < logs[logs.length - 1].value ? 'decreciente' : 'estable';
    html += '<div class="insight-box"><span class="material-symbols-outlined">insights</span>'
      + '<div><strong>Tendencia</strong><p>Peso ' + trend + ' · Media: ' + avg.toFixed(1) + 'g · ' + logs.length + ' registros</p></div></div>';
  }

  // Add button
  html += '<button class="secondary-btn full-width" data-action="add-weight" data-animal="' + animalId + '">'
    + '<span class="material-symbols-outlined">add</span> Registrar peso</button>';

  // Records list
  if (logs.length > 0) {
    html += '<div class="weight-records-header"><small>' + logs.length + ' registros</small></div>';
    html += '<div class="history-list">' + logs.map(log => {
      const logDelta = logs.indexOf(log) < logs.length - 1 ? log.value - logs[logs.indexOf(log) + 1].value : null;
      const logDeltaText = logDelta !== null ? (logDelta > 0 ? '+' : '') + logDelta.toFixed(1) + 'g' : '';
      return '<div class="history-item">'
        + '<div class="icon-wrap"><span class="material-symbols-outlined">scale</span></div>'
        + '<div><div class="history-top"><strong>' + log.value + 'g</strong>'
        + (logDeltaText ? '<span class="weight-delta-inline ' + (logDelta > 0 ? 'up' : 'down') + '">' + logDeltaText + '</span>' : '')
        + '</div>'
        + '<small>' + formatDate(getWeightDate(log)) + (log.notes ? ' • ' + log.notes : '') + '</small></div></div>';
    }).join('') + '</div>';
  }

  container.innerHTML = html;

  // Wire time window pills
  container.querySelectorAll('.weight-window-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      weightChartWindow = btn.dataset.window;
      renderWeightTab(container, animalId);
    });
  });

  // Wire add weight button
  container.querySelectorAll('[data-action="add-weight"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showRecordModal('weight_logs', btn.dataset.animal);
    });
  });
}

function renderFeedingTab(container, animalId) {
  const allLogs = getAnimalLogs(animalId, 'feeding_logs');
  const logs = sortByDate([...allLogs], 'created_at');
  const current = logs[0];
  const prev = logs[1];

  let freqText = '—';
  if (logs.length >= 2) {
    let totalDays = 0;
    for (let i = 0; i < logs.length - 1; i++) {
      const d1 = new Date(logs[i].created_at).getTime();
      const d2 = new Date(logs[i+1].created_at).getTime();
      totalDays += Math.abs(d1 - d2) / 86400000;
    }
    const avgDays = totalDays / (logs.length - 1);
    freqText = `Cada ~${Math.round(avgDays)} días`;
  }

  let html = '';
  html += '<div class="weight-telemetry">'
    + '<div class="weight-telemetry-main"><span class="material-symbols-outlined">restaurant</span>'
    + '<div><small>Última alimentación</small><strong>' + (current ? current.prey_type + (current.prey_size ? ' (' + current.prey_size + ')' : '') : 'Sin registros') + '</strong></div>'
    + (current ? '<span class="weight-delta ' + (current.accepted ? 'up' : 'down') + '">' + (current.accepted ? 'Aceptado ✓' : 'Rechazado ✗') + '</span>' : '')
    + '</div>'
    + '<div class="weight-telemetry-meta"><small>' + (current ? formatDate(current.created_at) : '—') + ' • Frecuencia: ' + freqText + '</small></div>'
    + '</div>';

  html += '<button class="secondary-btn full-width" data-action="add-log" data-collection="feeding_logs" data-animal="' + animalId + '">'
    + '<span class="material-symbols-outlined">add</span> Registrar alimentación</button>';

  if (logs.length === 0) {
    html += '<div class="empty-state"><span class="material-symbols-outlined">restaurant</span><p>Sin registros de alimentación</p></div>';
    container.innerHTML = html;
    container.querySelectorAll('[data-action="add-log"]').forEach(btn => {
      btn.addEventListener('click', () => showRecordModal(btn.dataset.collection, btn.dataset.animal));
    });
    return;
  }

  html += '<div class="weight-records-header"><small>' + logs.length + ' registros</small></div>';
  html += '<div class="history-list">' + logs.map(log => {
    const title = log.prey_type + (log.prey_size ? ' (' + log.prey_size + ')' : '');
    const status = log.accepted ? '<span style="color:var(--success)">Aceptado ✓</span>' : '<span style="color:var(--danger)">Rechazado ✗</span>';
    return '<div class="history-item">'
      + '<div class="icon-wrap"><span class="material-symbols-outlined">restaurant</span></div>'
      + '<div><div class="history-top"><strong>' + title + '</strong> ' + status + '</div>'
      + '<small>' + formatDate(log.created_at) + (log.notes ? ' • ' + log.notes : '') + '</small></div></div>';
  }).join('') + '</div>';

  container.innerHTML = html;
  container.querySelectorAll('[data-action="add-log"]').forEach(btn => {
    btn.addEventListener('click', () => showRecordModal(btn.dataset.collection, btn.dataset.animal));
  });
}

function renderMudaTab(container, animalId) {
  const allLogs = getAnimalLogs(animalId, 'shedding_logs');
  const logs = sortByDate([...allLogs], 'created_at');
  const current = logs[0];

  let intervalText = '—';
  if (logs.length >= 2) {
    let totalDays = 0;
    for (let i = 0; i < logs.length - 1; i++) {
      const d1 = new Date(logs[i].created_at).getTime();
      const d2 = new Date(logs[i+1].created_at).getTime();
      totalDays += Math.abs(d1 - d2) / 86400000;
    }
    const avgDays = totalDays / (logs.length - 1);
    intervalText = `Cada ~${Math.round(avgDays)} días`;
  }

  let html = '';
  html += '<div class="weight-telemetry">'
    + '<div class="weight-telemetry-main"><span class="material-symbols-outlined">water_drop</span>'
    + '<div><small>Última muda</small><strong>' + (current ? (current.complete ? 'Muda completa' : 'Muda incompleta') : 'Sin registros') + '</strong></div>'
    + (current ? '<span class="weight-delta ' + (current.complete ? 'up' : 'down') + '">' + (current.complete ? 'Completa ✓' : 'Incompleta ⚠') + '</span>' : '')
    + '</div>'
    + '<div class="weight-telemetry-meta"><small>' + (current ? formatDate(current.created_at) : '—') + ' • Intervalo medio: ' + intervalText + '</small></div>'
    + '</div>';

  html += '<button class="secondary-btn full-width" data-action="add-log" data-collection="shedding_logs" data-animal="' + animalId + '">'
    + '<span class="material-symbols-outlined">add</span> Registrar muda</button>';

  if (logs.length === 0) {
    html += '<div class="empty-state"><span class="material-symbols-outlined">water_drop</span><p>Sin registros de mudas</p></div>';
    container.innerHTML = html;
    container.querySelectorAll('[data-action="add-log"]').forEach(btn => {
      btn.addEventListener('click', () => showRecordModal(btn.dataset.collection, btn.dataset.animal));
    });
    return;
  }

  html += '<div class="weight-records-header"><small>' + logs.length + ' registros</small></div>';
  html += '<div class="history-list">' + logs.map(log => {
    const status = log.complete ? '<span style="color:var(--success)">Completa ✓</span>' : '<span style="color:var(--danger)">Incompleta ⚠</span>';
    return '<div class="history-item">'
      + '<div class="icon-wrap"><span class="material-symbols-outlined">water_drop</span></div>'
      + '<div><div class="history-top"><strong>' + (log.complete ? 'Muda completa' : 'Muda incompleta') + '</strong> ' + status + '</div>'
      + '<small>' + formatDate(log.created_at) + (log.notes ? ' • ' + log.notes : '') + '</small></div></div>';
  }).join('') + '</div>';

  container.innerHTML = html;
  container.querySelectorAll('[data-action="add-log"]').forEach(btn => {
    btn.addEventListener('click', () => showRecordModal(btn.dataset.collection, btn.dataset.animal));
  });
}

function renderWeightChart(logs) {
  // logs sorted by date ascending for chart
  const sorted = [...logs].sort((a, b) => new Date(getWeightDate(a)) - new Date(getWeightDate(b)));
  if (sorted.length < 2) return '';

  const W = 340, H = 160, PAD_L = 36, PAD_R = 12, PAD_T = 16, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = sorted.map(l => l.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padRange = range * 0.1;
  const yMin = minV - padRange;
  const yMax = maxV + padRange;

  const dates = sorted.map(l => new Date(getWeightDate(l)).getTime());
  const tMin = dates[0];
  const tMax = dates[dates.length - 1];
  const tRange = tMax - tMin || 1;

  function x(i) { return PAD_L + ((dates[i] - tMin) / tRange) * chartW; }
  function y(v) { return PAD_T + chartH - ((v - yMin) / (yMax - yMin)) * chartH; }

  // Grid lines + Y labels
  const gridSteps = 4;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  for (let i = 0; i <= gridSteps; i++) {
    const val = yMin + (i / gridSteps) * (yMax - yMin);
    const yPos = y(val);
    svg += '<line x1="' + PAD_L + '" y1="' + yPos + '" x2="' + (W - PAD_R) + '" y2="' + yPos + '" stroke="rgba(255,255,255,0.06)" />';
    svg += '<text x="' + (PAD_L - 6) + '" y="' + (yPos + 3) + '" text-anchor="end" fill="rgba(255,255,255,0.35)" font-size="9">' + Math.round(val) + 'g</text>';
  }

  // X axis labels
  const xLabels = sorted.length <= 6 ? sorted : sorted.filter((_, i) => i % Math.ceil(sorted.length / 5) === 0 || i === sorted.length - 1);
  xLabels.forEach((log, _, arr) => {
    const idx = sorted.indexOf(log);
    const d = new Date(getWeightDate(log));
    const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    svg += '<text x="' + x(idx) + '" y="' + (H - 4) + '" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="8">' + label + '</text>';
  });

  // Area fill
  const areaPoints = sorted.map((_, i) => x(i) + ',' + y(sorted[i].value)).join(' ');
  svg += '<polygon points="' + x(0) + ',' + (PAD_T + chartH) + ' ' + areaPoints + ' ' + x(sorted.length - 1) + ',' + (PAD_T + chartH)
    + '" fill="url(#weightGrad)" opacity="0.3" />';

  // Line
  const linePoints = sorted.map((_, i) => x(i) + ',' + y(sorted[i].value)).join(' ');
  svg += '<polyline points="' + linePoints + '" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />';

  // Gradient def
  svg = '<defs><linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.4" />'
    + '<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />'
    + '</linearGradient></defs>' + svg;

  // Data points
  sorted.forEach((log, i) => {
    svg += '<g class="point" data-idx="' + i + '">'
      + '<circle cx="' + x(i) + '" cy="' + y(log.value) + '" r="12" fill="transparent" />'
      + '<circle cx="' + x(i) + '" cy="' + y(log.value) + '" r="3.5" fill="var(--bg)" stroke="var(--primary)" stroke-width="2" />'
      + '</g>';
  });

  svg += '</svg>';
  return svg;
}

function renderTimeline(container, animalId, activeCat = 'all', activeDate = 'all') {
  const collections = [
    { key: 'weight_logs', icon: 'scale', label: 'Peso' },
    { key: 'length_logs', icon: 'straighten', label: 'Longitud' },
    { key: 'feeding_logs', icon: 'restaurant', label: 'Alimentación' },
    { key: 'shedding_logs', icon: 'water_drop', label: 'Muda' },
    { key: 'climate_logs', icon: 'thermostat', label: 'Clima' },
  ];

  let allItems = [];
  collections.forEach(col => {
    getAnimalLogs(animalId, col.key).forEach(log => {
      allItems.push({ ...log, _type: col.key, _icon: col.icon, _label: col.label });
    });
  });

  allItems.sort((a, b) => new Date(b._type === 'weight_logs' ? (b.weight_date || b.created_at) : b.created_at) - new Date(a._type === 'weight_logs' ? (a.weight_date || a.created_at) : a.created_at));

  // Filter by category
  let filtered = allItems;
  if (activeCat !== 'all') {
    filtered = filtered.filter(item => item._type === activeCat);
  }

  // Filter by date range
  if (activeDate !== 'all') {
    const now = new Date();
    const daysLimit = parseInt(activeDate, 10);
    filtered = filtered.filter(item => {
      const itemDate = new Date(item._type === 'weight_logs' ? (item.weight_date || item.created_at) : item.created_at);
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
      return diffDays <= daysLimit;
    });
  }

  let html = '<div class="timeline-filters mb-3 flex flex-wrap gap-2 items-center justify-between bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">'
    + '<div class="flex flex-wrap gap-1.5 items-center">'
    + '<span class="text-xs font-bold text-muted mr-1">Filtrar:</span>'
    + '<button class="filter-chip ' + (activeCat === 'all' ? 'active' : '') + '" data-cat="all">Todos</button>'
    + '<button class="filter-chip ' + (activeCat === 'weight_logs' ? 'active' : '') + '" data-cat="weight_logs">Peso</button>'
    + '<button class="filter-chip ' + (activeCat === 'feeding_logs' ? 'active' : '') + '" data-cat="feeding_logs">Alimentación</button>'
    + '<button class="filter-chip ' + (activeCat === 'shedding_logs' ? 'active' : '') + '" data-cat="shedding_logs">Mudas</button>'
    + '<button class="filter-chip ' + (activeCat === 'climate_logs' ? 'active' : '') + '" data-cat="climate_logs">Clima</button>'
    + '</div>'
    + '<div class="flex items-center gap-1.5">'
    + '<select id="timelineDateFilter" class="bg-surface-container-high text-xs text-text px-2 py-1.5 rounded-lg border border-outline-variant">'
    + '<option value="all" ' + (activeDate === 'all' ? 'selected' : '') + '>Todo el historial</option>'
    + '<option value="30" ' + (activeDate === '30' ? 'selected' : '') + '>Últimos 30 días</option>'
    + '<option value="90" ' + (activeDate === '90' ? 'selected' : '') + '>Últimos 90 días</option>'
    + '<option value="365" ' + (activeDate === '365' ? 'selected' : '') + '>Último año</option>'
    + '</select>'
    + '</div>'
    + '</div>';

  if (filtered.length === 0) {
    html += '<div class="empty-state py-8 text-center"><span class="material-symbols-outlined text-3xl text-muted mb-1">timeline</span><p class="text-sm text-muted">No hay eventos para los filtros seleccionados</p></div>';
  } else {
    html += '<div class="timeline-list space-y-2.5">' + filtered.map(item => {
      let value = '';
      let badgeClass = 'bg-primary/15 text-primary';
      if (item._type === 'weight_logs') {
        value = '<b>' + item.value + 'g</b>';
        badgeClass = 'bg-primary/20 text-primary';
      } else if (item._type === 'length_logs') {
        value = '<b>' + item.value + 'cm</b>';
      } else if (item._type === 'feeding_logs') {
        value = item.prey_type + ' (' + item.prey_size + ') — ' + (item.accepted ? '<span class="text-success font-semibold">Aceptado</span>' : '<span class="text-danger font-semibold">Rechazado</span>');
        badgeClass = item.accepted ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger';
      } else if (item._type === 'shedding_logs') {
        value = item.complete ? '<span class="text-success font-semibold">Muda Completa</span>' : '<span class="text-warning font-semibold">Muda Incompleta</span>';
        badgeClass = item.complete ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning';
      } else if (item._type === 'climate_logs') {
        value = 'Zona Caliente: <b>' + item.temp_hot + '°C</b> | Zona Fría: <b>' + item.temp_cool + '°C</b> | Humedad: <b>' + item.humidity + '%</b>';
        badgeClass = 'bg-tertiary/20 text-tertiary';
      }
      const itemDate = formatDate(item._type === 'weight_logs' ? getWeightDate(item) : item.created_at);
      return '<div class="timeline-item flex items-start gap-3 p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 shadow-sm transition-all hover:border-outline-variant/60">'
        + '<div class="timeline-dot w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + badgeClass + '"><span class="material-symbols-outlined text-[18px]">' + item._icon + '</span></div>'
        + '<div class="timeline-body flex-1 min-w-0">'
        + '<div class="timeline-top flex items-center justify-between mb-1"><span class="font-bold text-sm text-text">' + item._label + '</span><span class="text-xs text-muted">' + itemDate + '</span></div>'
        + '<div class="text-xs text-on-surface-variant">' + value + (item.notes ? ' <span class="text-muted italic">• ' + item.notes + '</span>' : '') + '</div>'
        + '</div></div>';
    }).join('') + '</div>';
  }

  container.innerHTML = html;

  // Wire filter event listeners
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      renderTimeline(container, animalId, btn.dataset.cat, activeDate);
    });
  });

  container.querySelector('#timelineDateFilter')?.addEventListener('change', (e) => {
    renderTimeline(container, animalId, activeCat, e.target.value);
  });
}

// ── RECORD MODAL ───────────────────────────────────────────────────────────

function showRecordModal(collection, reptileId) {
  const modal = document.getElementById('recordModal');
  const fields = document.getElementById('recordFormFields');
  const title = document.getElementById('recordModalTitle');
  const eyebrow = document.getElementById('recordModalEyebrow');

  const labels = { weight_logs: 'Peso', length_logs: 'Longitud', feeding_logs: 'Alimentación', shedding_logs: 'Muda', climate_logs: 'Clima' };
  title.textContent = 'Registrar ' + (labels[collection] || 'registro');
  eyebrow.textContent = 'Nuevo registro';

  let html = '';
  const today = new Date().toISOString().slice(0, 10);

  if (collection === 'weight_logs') {
    html = '<div class="form-group"><label for="recValue">Peso (g)</label><input type="number" id="recValue" step="0.1" min="0.1" max="50000" required placeholder="Ej. 45.5" /></div>'
      + '<div class="form-group"><label for="recDate">Fecha del pesaje</label><input type="date" id="recDate" value="' + today + '" max="' + today + '" required /><small class="field-hint">Puedes introducir fechas históricas</small></div>'
      + '<div class="form-group"><label for="recNotes">Notas</label><input type="text" id="recNotes" placeholder="Opcional (ej. Post-muda)" /></div>'
      + '<div class="form-error" id="recError" hidden></div>';
  } else if (collection === 'length_logs') {
    html = '<div class="form-group"><label for="recValue">Longitud (cm)</label><input type="number" id="recValue" step="0.1" min="0" required /></div>'
      + '<div class="form-group"><label for="recDate">Fecha</label><input type="date" id="recDate" value="' + today + '" required /></div>'
      + '<div class="form-group"><label for="recNotes">Notas</label><input type="text" id="recNotes" placeholder="Opcional" /></div>';
  } else if (collection === 'feeding_logs') {
    html = '<div class="form-group"><label for="recPrey">Presa</label><input type="text" id="recPrey" placeholder="Ej. Grillo, Ratón" required /></div>'
      + '<div class="form-group"><label for="recSize">Tamaño</label><input type="text" id="recSize" placeholder="Ej. Small, Medium" /></div>'
      + '<div class="form-group"><label><input type="checkbox" id="recAccepted" checked /> Aceptada</label></div>'
      + '<div class="form-group"><label for="recDate">Fecha</label><input type="date" id="recDate" value="' + today + '" required /></div>'
      + '<div class="form-group"><label for="recNotes">Notas</label><input type="text" id="recNotes" placeholder="Opcional" /></div>';
  } else if (collection === 'shedding_logs') {
    html = '<div class="form-group"><label><input type="checkbox" id="recComplete" checked /> Muda completa</label></div>'
      + '<div class="form-group"><label for="recDate">Fecha</label><input type="date" id="recDate" value="' + today + '" required /></div>'
      + '<div class="form-group"><label for="recNotes">Notas</label><input type="text" id="recNotes" placeholder="Opcional" /></div>';
  } else if (collection === 'climate_logs') {
    html = '<div class="form-group"><label for="recTempHot">Temp caliente (°C)</label><input type="number" id="recTempHot" step="0.1" required /></div>'
      + '<div class="form-group"><label for="recTempCool">Temp fría (°C)</label><input type="number" id="recTempCool" step="0.1" required /></div>'
      + '<div class="form-group"><label for="recHumidity">Humedad (%)</label><input type="number" id="recHumidity" min="0" max="100" required /></div>'
      + '<div class="form-group"><label for="recDate">Fecha</label><input type="date" id="recDate" value="' + today + '" required /></div>'
      + '<div class="form-group"><label for="recNotes">Notas</label><input type="text" id="recNotes" placeholder="Opcional" /></div>';
  }

  fields.innerHTML = html;
  openModal(modal);

  // Handle submit
  const form = document.getElementById('recordForm');
  if (!form) { console.error('[HerpCare] recordForm not found'); return; }
  // Remove any stale previous handler
  if (form._recordHandler) form.removeEventListener('submit', form._recordHandler);
  const handler = (e) => {
    e.preventDefault();
    console.log('[HerpCare] submit', collection, reptileId);
    const recNotesEl = document.getElementById('recNotes');
    const recDateEl = document.getElementById('recDate');
    const recValueEl = document.getElementById('recValue');
    console.log('[HerpCare] fields:', { recNotes: !!recNotesEl, recDate: !!recDateEl, recValue: !!recValueEl });
    const data = { reptile_id: reptileId, notes: recNotesEl?.value || '' };
    const dateVal = recDateEl?.value || '';
    data.created_at = dateVal;

    if (collection === 'weight_logs') {
      const val = parseFloat(recValueEl?.value);
      const errEl = document.getElementById('recError');
      if (isNaN(val) || val <= 0) { console.warn('[HerpCare] validation: bad value', val); if (errEl) { errEl.textContent = 'El peso debe ser un número positivo'; errEl.hidden = false; } return; }
      if (val > 50000) { if (errEl) { errEl.textContent = 'El peso no puede superar 50.000g'; errEl.hidden = false; } return; }
      const _d = new Date(); const todayStr = _d.getFullYear() + '-' + String(_d.getMonth()+1).padStart(2,'0') + '-' + String(_d.getDate()).padStart(2,'0');
      if (!dateVal || dateVal > todayStr) { if (errEl) { errEl.textContent = 'La fecha no puede ser futura'; errEl.hidden = false; } return; }
      if (errEl) errEl.hidden = true;
      data.value = val;
      data.weight_date = dateVal;
    }
    else if (collection === 'length_logs') data.value = parseFloat(recValueEl?.value);
    else if (collection === 'feeding_logs') {
      data.prey_type = document.getElementById('recPrey').value;
      data.prey_size = document.getElementById('recSize')?.value || '';
      data.accepted = document.getElementById('recAccepted').checked;
    } else if (collection === 'shedding_logs') {
      data.complete = document.getElementById('recComplete').checked;
    } else if (collection === 'climate_logs') {
      data.temp_hot = parseFloat(document.getElementById('recTempHot').value);
      data.temp_cool = parseFloat(document.getElementById('recTempCool').value);
      data.humidity = parseFloat(document.getElementById('recHumidity').value);
    }

    // Save to demo or DataService
    if (window.AuthService?.isAuthenticated()) {
      window.DataService.create(collection, data);
    } else {
      // Write to in-memory demo logs
      const id = 'r' + Date.now();
      data.id = id;
      if (!DEMO_LOGS[reptileId]) DEMO_LOGS[reptileId] = {};
      if (!DEMO_LOGS[reptileId][collection]) DEMO_LOGS[reptileId][collection] = [];
      DEMO_LOGS[reptileId][collection].push(data);
    }

    closeModal(modal);
    form.removeEventListener('submit', handler);
    form._recordHandler = null;
    // Re-render current tab
    if (currentAnimalId) {
      const activeTab = document.querySelector('.ficha-tab.active');
      renderFichaTab(activeTab?.dataset.tab || 'general', currentAnimalId);
      renderFichaSummary(currentAnimalId);
    }
  };
  form.addEventListener('submit', handler);
  form._recordHandler = handler;
}

// ── AÑADIR REPTIL ──────────────────────────────────────────────────────────

const showAddReptileModal = () => {
  const fields = document.getElementById('addReptileFields');
  const title = document.getElementById('addReptileTitle');
  const eyebrow = document.getElementById('addReptileEyebrow');
  const errEl = document.getElementById('addReptileError');
  if (errEl) errEl.hidden = true;

  const today = new Date().toISOString().slice(0, 10);
  title.textContent = 'Añadir reptil';
  eyebrow.textContent = 'Nueva ficha';

  const html = `
    <div class="form-group"><label for="arName">Nombre</label><input type="text" id="arName" placeholder="Ej. Ziggy" required /></div>
    <div class="form-group"><label for="arSpecies">Especie</label><input type="text" id="arSpecies" placeholder="Ej. Eublepharis macularius" required /></div>
    <div class="form-group"><label for="arMorph">Morfología</label><input type="text" id="arMorph" placeholder="Ej. Bell Albino" /></div>
    <div class="form-group"><label for="arSex">Sexo</label>
      <select id="arSex"><option value="">—</option><option>macho</option><option>hembra</option><option>indeterminado</option></select>
    </div>
    <div class="form-group"><label for="arBirth">Fecha de nacimiento</label><input type="date" id="arBirth" value="${today}" max="${today}" /></div>
    <div class="form-group"><label for="arAcq">Fecha de adquisición</label><input type="date" id="arAcq" value="${today}" max="${today}" required /></div>
    <div class="form-group"><label for="arAvatar">URL de foto</label><input type="url" id="arAvatar" placeholder="https://…" /></div>
    <div class="form-group"><label for="arEnclosure">Terrario</label><input type="text" id="arEnclosure" placeholder="Ej. Terrario A-1" /></div>
    <div class="form-group"><label for="arChip">Microchip ID</label><input type="text" id="arChip" placeholder="Ej. 98511234567890" /></div>
    <div class="form-group"><label for="arStatus">Estado</label>
      <select id="arStatus"><option value="Activo">Activo</option><option value="En brumación">En brumación</option><option value="En cuarentena">En cuarentena</option><option value="En tratamiento">En tratamiento</option><option value="Fallecido">Fallecido</option></select>
    </div>
    <div class="form-group"><label for="arNotes">Notas</label><input type="text" id="arNotes" placeholder="Opcional" /></div>`;
  fields.innerHTML = html;
  openModal(document.getElementById('addReptileModal'));

  const form = document.getElementById('addReptileForm');
  if (form._addReptileHandler) form.removeEventListener('submit', form._addReptileHandler);
  const handler = (e) => {
    e.preventDefault();
    const name = document.getElementById('arName').value.trim();
    const species = document.getElementById('arSpecies').value.trim();
    if (!name || !species) {
      if (errEl) { errEl.textContent = 'Nombre y especie son obligatorios.'; errEl.hidden = false; }
      return;
    }
    const data = {
      name,
      species,
      morph: document.getElementById('arMorph').value.trim(),
      sex: document.getElementById('arSex').value,
      birth_date: document.getElementById('arBirth').value || null,
      acquisition_date: document.getElementById('arAcq').value || today,
      avatar_url: document.getElementById('arAvatar').value.trim(),
      enclosure: document.getElementById('arEnclosure').value.trim(),
      microchip_id: document.getElementById('arChip').value.trim(),
      status: document.getElementById('arStatus').value,
      notes: document.getElementById('arNotes').value.trim(),
    };

    let created;
    if (window.AuthService?.isAuthenticated()) {
      try {
        created = window.DataService.create('reptiles', data);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || 'Error al guardar.'; errEl.hidden = false; }
        return;
      }
    } else {
      created = { id: 'demo-' + Date.now(), ...data };
      DEMO_ANIMALS.push(created);
    }

    closeModal(document.getElementById('addReptileModal'));
    form.removeEventListener('submit', handler);
    form._addReptileHandler = null;
    renderCollection();
    renderHome();
  };
  form.addEventListener('submit', handler);
  form._addReptileHandler = handler;
};

document.getElementById('addReptileButton')?.addEventListener('click', showAddReptileModal);

// ── SEARCH + FILTER ────────────────────────────────────────────────────────

document.querySelector('.search-row input')?.addEventListener('input', (e) => {
  renderCollection(e.target.value.toLowerCase());
});

document.querySelectorAll('.chip-row .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip-row .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderCollection();
  });
});

// ── INITIAL RENDER ─────────────────────────────────────────────────────────
renderCollection();

const openModal = (modal) => {
  if (modal) modal.hidden = false;
};

const closeModal = (modal) => {
  if (modal) modal.hidden = true;
};

const stopCamera = () => {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = undefined;
  cameraVideo.srcObject = null;
  capturePhotoButton.disabled = true;
};

const showPhotoPreview = (source) => {
  cameraPhoto.src = source;
  cameraPhoto.hidden = false;
  cameraVideo.hidden = true;
  cameraPlaceholder.hidden = true;

  // Validate dimensions after image loads
  cameraPhoto.onload = () => {
    const maxW = window.SecurityConfig?.payloads?.maxImageWidth || 4096;
    const maxH = window.SecurityConfig?.payloads?.maxImageHeight || 4096;
    if (cameraPhoto.naturalWidth > maxW || cameraPhoto.naturalHeight > maxH) {
      cameraStatus.textContent = 'La imagen excede ' + maxW + 'x' + maxH + 'px. Usa una imagen más pequeña.';
      cameraPhoto.hidden = true;
      cameraPlaceholder.hidden = false;
    } else {
      cameraStatus.textContent = 'Vista previa lista. La imagen permanece en este dispositivo.';
    }
  };
};

openCameraButton?.addEventListener('click', () => {
  openModal(cameraModal);
  cameraStatus.textContent = 'Activa la cámara o elige una foto de la galería.';
});

// ── HERPSCAN BUTTONS ─────────────────────────────────────────────────────
document.getElementById('herpscanCameraBtn')?.addEventListener('click', () => {
  openModal(cameraModal);
});
document.getElementById('herpscanGalleryBtn')?.addEventListener('click', () => {
  galleryFileInput.click();
});

startCameraButton?.addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    // Fallback: open system camera via file input with capture attr
    cameraStatus.textContent = 'Cámara directa no disponible. Abriendo cámara del sistema…';
    cameraFileInput.click();
    return;
  }
  try {
    stopCamera();
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    cameraVideo.srcObject = cameraStream;
    cameraVideo.hidden = false;
    cameraPhoto.hidden = true;
    cameraPlaceholder.hidden = true;
    capturePhotoButton.disabled = false;
    cameraStatus.textContent = 'Cámara activa. Encuadra el animal y pulsa Capturar.';
  } catch (error) {
    console.error('No se pudo acceder a la cámara:', error);
    cameraStatus.textContent = 'Permiso de cámara denegado. Usa Galería para elegir una foto.';
  }
});

capturePhotoButton?.addEventListener('click', () => {
  if (!cameraVideo.videoWidth) return;
  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0);
  showPhotoPreview(cameraCanvas.toDataURL('image/jpeg', 0.9));
  stopCamera();
});

choosePhotoButton?.addEventListener('click', () => galleryFileInput.click());

// Shared file validation for both camera fallback and gallery inputs
const validateAndPreviewImage = (file) => {
  const allowed = window.SecurityConfig?.payloads?.allowedImageTypes || ['image/jpeg', 'image/webp', 'image/png'];
  if (!allowed.includes(file.type)) {
    cameraStatus.textContent = 'Tipo de imagen no permitido. Usa: ' + allowed.map(t => t.split('/')[1]).join(', ');
    return;
  }
  const maxSize = window.SecurityConfig?.payloads?.maxImageSizeBytes || 5 * 1024 * 1024;
  if (file.size > maxSize) {
    cameraStatus.textContent = 'La imagen supera ' + (maxSize / 1024 / 1024).toFixed(0) + 'MB. Usa una imagen más pequeña.';
    return;
  }
  showPhotoPreview(URL.createObjectURL(file));
};

galleryFileInput?.addEventListener('change', () => {
  const [file] = galleryFileInput.files;
  if (file) validateAndPreviewImage(file);
  galleryFileInput.value = '';
});

// cameraFileInput stays with capture="environment" for getUserMedia fallback only
cameraFileInput?.addEventListener('change', () => {
  const [file] = cameraFileInput.files;
  if (file) validateAndPreviewImage(file);
  cameraFileInput.value = '';
});

const resetCameraModal = () => {
  stopCamera();
  cameraPhoto.hidden = true;
  cameraPhoto.src = '';
  cameraPlaceholder.hidden = false;
  cameraStatus.textContent = 'La foto se guardará en este dispositivo.';
};

cameraModal?.addEventListener('click', (event) => {
  if (event.target === cameraModal) {
    resetCameraModal();
    closeModal(cameraModal);
  }
});

document.querySelector('[data-close-modal="cameraModal"]')?.addEventListener('click', () => {
  resetCameraModal();
  closeModal(cameraModal);
});

// --- CONTROLADOR DE AUTENTICACIÓN HERPCARE ---
const AuthUI = {
  views: {
    login: document.getElementById('authViewLogin'),
    register: document.getElementById('authViewRegister'),
    verify: document.getElementById('authViewVerify'),
    forgot: document.getElementById('authViewForgot'),
    reset: document.getElementById('authViewResetPassword'),
    profile: document.getElementById('authViewProfile')
  },
  alertEl: document.getElementById('authAlert'),
  emailToast: document.getElementById('authEmailToast'),
  toastSubject: document.getElementById('toastSubject'),
  toastBody: document.getElementById('toastBody'),
  toastCode: document.getElementById('toastCode'),
  userAvatarImg: document.getElementById('userAvatarImg'),
  userAvatarText: document.getElementById('userAvatarText'),

  currentPendingEmail: '',

  init() {
    this.bindEvents();
    this.observeAuthState();
  },

  showAlert(message, type = 'error') {
    if (!this.alertEl) return;
    this.alertEl.textContent = message;
    this.alertEl.className = `auth-alert ${type}`;
    this.alertEl.hidden = false;
  },

  clearAlert() {
    if (!this.alertEl) return;
    this.alertEl.hidden = true;
    this.alertEl.textContent = '';
    this.alertEl.className = 'auth-alert';
  },

  switchView(viewName) {
    this.clearAlert();
    Object.keys(this.views).forEach((name) => {
      const el = this.views[name];
      if (el) el.hidden = name !== viewName;
    });
  },

  showEmailToast(subject, body, code) {
    if (!this.emailToast) return;
    this.toastSubject.textContent = subject;
    this.toastBody.textContent = body;
    this.toastCode.textContent = code;
    this.emailToast.hidden = false;
  },

  bindEvents() {
    // Alternar visibilidad de contraseñas
    document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = isPassword ? 'visibility_off' : 'visibility';
      });
    });

    // Validación de reglas de contraseña en vivo (Registro)
    const regPasswordInput = document.getElementById('regPassword');
    regPasswordInput?.addEventListener('input', () => {
      const val = regPasswordInput.value;
      const rules = {
        len: val.length >= 8,
        upper: /[A-Z]/.test(val),
        lower: /[a-z]/.test(val),
        num: /[0-9]/.test(val)
      };
      document.querySelectorAll('#passwordRules .rule').forEach((el) => {
        const ruleKey = el.dataset.rule;
        if (rules[ruleKey]) {
          el.classList.add('valid');
        } else {
          el.classList.remove('valid');
        }
      });
    });

    // Navegación entre vistas
    document.getElementById('toRegisterBtn')?.addEventListener('click', () => this.switchView('register'));
    document.getElementById('toLoginFromRegBtn')?.addEventListener('click', () => this.switchView('login'));
    document.getElementById('toForgotBtn')?.addEventListener('click', () => this.switchView('forgot'));
    document.getElementById('toLoginFromForgotBtn')?.addEventListener('click', () => this.switchView('login'));
    document.getElementById('toLoginFromVerifyBtn')?.addEventListener('click', () => this.switchView('login'));
    document.getElementById('toLoginFromResetBtn')?.addEventListener('click', () => this.switchView('login'));

    // Cerrar toast
    document.getElementById('closeToastBtn')?.addEventListener('click', () => {
      if (this.emailToast) this.emailToast.hidden = true;
    });

    // Escuchar eventos simulados de email (PWA / Web estática)
    window.addEventListener('herpcare:email_sent', (e) => {
      const { type, email, code } = e.detail || {};
      let title = 'Notificación de seguridad';
      let desc = `Código para ${email}:`;
      if (type === 'verification' || type === 'verification_resend') {
        title = 'Código de verificación';
        desc = `Código enviado a ${email}:`;
      } else if (type === 'password_reset') {
        title = 'Recuperación de contraseña';
        desc = `Código de restablecimiento para ${email}:`;
      }
      this.showEmailToast(title, desc, code);
    });

    // SUBMIT: Login
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAlert();
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;

      const submitBtn = document.getElementById('loginSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await window.AuthService.signIn(email, password);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
          closeModal(loginModal);
          this.switchView('profile');
        } else {
          if (res.requiresVerification) {
            this.currentPendingEmail = res.email || email;
            const targetEl = document.getElementById('verifyTargetEmail');
            if (targetEl) targetEl.textContent = this.currentPendingEmail;
            this.switchView('verify');
            this.showAlert(res.message, 'info');
          } else {
            this.showAlert(res.message, 'error');
          }
        }
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        this.showAlert('Error al procesar el inicio de sesión.', 'error');
      }
    });

    // SUBMIT: Registro
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAlert();
      const name = document.getElementById('regName')?.value;
      const email = document.getElementById('regEmail')?.value;
      const password = document.getElementById('regPassword')?.value;
      const confirm = document.getElementById('regPasswordConfirm')?.value;

      if (password !== confirm) {
        this.showAlert('Las contraseñas no coinciden.', 'error');
        return;
      }

      const submitBtn = document.getElementById('registerSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await window.AuthService.signUp(email, password, name);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
          this.currentPendingEmail = res.email || email;
          const targetEl = document.getElementById('verifyTargetEmail');
          if (targetEl) targetEl.textContent = this.currentPendingEmail;
          this.switchView('verify');
          this.showAlert(res.message, 'success');
        } else {
          this.showAlert(res.message, 'error');
        }
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        this.showAlert('Error al registrar usuario.', 'error');
      }
    });

    // SUBMIT: Verificación OTP
    document.getElementById('verifyForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAlert();
      const code = document.getElementById('verifyCode')?.value;
      const email = this.currentPendingEmail || document.getElementById('loginEmail')?.value;

      const submitBtn = document.getElementById('verifySubmitBtn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await window.AuthService.verifyEmail(email, code);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
          closeModal(loginModal);
          this.switchView('profile');
        } else {
          this.showAlert(res.message, 'error');
        }
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        this.showAlert('Error al verificar el código.', 'error');
      }
    });

    // Reenviar código de verificación
    document.getElementById('resendCodeBtn')?.addEventListener('click', async () => {
      const email = this.currentPendingEmail || document.getElementById('loginEmail')?.value;
      if (!email) {
        this.showAlert('Introduce tu correo primero.', 'error');
        return;
      }
      const res = await window.AuthService.resendVerificationCode(email);
      this.showAlert(res.message, res.success ? 'success' : 'error');
    });

    // SUBMIT: Solicitar recuperación de contraseña
    document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAlert();
      const email = document.getElementById('forgotEmail')?.value;

      const submitBtn = document.getElementById('forgotSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await window.AuthService.requestPasswordReset(email);
        if (submitBtn) submitBtn.disabled = false;

        this.currentPendingEmail = email;
        const targetEmailInput = document.getElementById('resetTargetEmail');
        if (targetEmailInput) targetEmailInput.value = email;

        this.switchView('reset');
        this.showAlert(res.message, 'info');
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        this.showAlert('Error al solicitar recuperación.', 'error');
      }
    });

    // SUBMIT: Confirmar restablecimiento de contraseña
    document.getElementById('resetPasswordForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAlert();
      const email = document.getElementById('resetTargetEmail')?.value || this.currentPendingEmail;
      const code = document.getElementById('resetCode')?.value;
      const newPass = document.getElementById('resetNewPassword')?.value;
      const newPassConfirm = document.getElementById('resetNewPasswordConfirm')?.value;

      if (newPass !== newPassConfirm) {
        this.showAlert('Las contraseñas no coinciden.', 'error');
        return;
      }

      const submitBtn = document.getElementById('resetPasswordSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await window.AuthService.confirmPasswordReset(email, code, newPass);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
          this.switchView('login');
          this.showAlert(res.message, 'success');
        } else {
          this.showAlert(res.message, 'error');
        }
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        this.showAlert('Error al restablecer la contraseña.', 'error');
      }
    });

    // SUBMIT: Cambiar contraseña (Perfil)
    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAlert();
      const current = document.getElementById('currentPasswordInput')?.value;
      const next = document.getElementById('newPasswordInput')?.value;

      const submitBtn = document.getElementById('changePasswordSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await window.AuthService.changePassword(current, next);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
          this.showAlert(res.message, 'success');
          document.getElementById('changePasswordForm')?.reset();
        } else {
          this.showAlert(res.message, 'error');
        }
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        this.showAlert('Error al cambiar la contraseña.', 'error');
      }
    });

    // LOGOUT
    document.getElementById('logoutButton')?.addEventListener('click', () => {
      window.AuthService.signOut();
      closeModal(loginModal);
      this.switchView('login');
    });

    // Abrir modal desde el botón de perfil del topbar
    loginButton?.addEventListener('click', () => {
      openModal(loginModal);
      if (window.AuthService.isAuthenticated()) {
        this.switchView('profile');
      } else {
        this.switchView('login');
      }
    });
  },

  observeAuthState() {
    window.AuthService.onAuthStateChange((user) => {
      if (user) {
        // Usuario logueado
        if (this.userAvatarImg) this.userAvatarImg.hidden = true;
        if (this.userAvatarText) {
          this.userAvatarText.hidden = false;
          this.userAvatarText.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
        }
        if (loginButton) {
          loginButton.setAttribute('aria-label', `Perfil de ${user.name || user.email}`);
        }

        const profileName = document.getElementById('profileNameDisplay');
        const profileEmail = document.getElementById('profileEmailDisplay');
        const profileAvatarLarge = document.getElementById('profileAvatarLarge');

        if (profileName) profileName.textContent = user.name || user.email.split('@')[0];
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileAvatarLarge) {
          profileAvatarLarge.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
        }
      } else {
        // Invitado / Desconectado
        if (this.userAvatarImg) this.userAvatarImg.hidden = false;
        if (this.userAvatarText) this.userAvatarText.hidden = true;
        if (loginButton) {
          loginButton.setAttribute('aria-label', 'Iniciar sesión');
        }
      }
    });
  }
};

// Inicializar AuthUI al cargar
AuthUI.init();

// ── AUTH TAB SWITCHING ───────────────────────────────────────────────────
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.authTab;
    const loginView = document.getElementById('authViewLogin');
    const registerView = document.getElementById('authViewRegister');
    if (target === 'login') {
      loginView.hidden = false;
      registerView.hidden = true;
    } else if (target === 'register') {
      loginView.hidden = true;
      registerView.hidden = false;
    }
    // Update active state on all tabs with same data-auth-tab
    document.querySelectorAll('.auth-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.authTab === target);
    });
  });
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', () => closeModal(document.getElementById(button.dataset.closeModal)));
});

// ── VET SEARCH ──────────────────────────────────────────────────────────────
let vetMap = null;
let vetMarkers = [];
let userLatLng = null;
let currentRadius = 10;

const initVetMap = (lat, lon) => {
  if (vetMap) { vetMap.setView([lat, lon], 13); return; }
  if (!window.L || !vetMapEl) return;
  // ponytail: marker icon path hardcoded for local leaflet bundle
  L.Icon.Default.imagePath = '';
  const icon = L.divIcon({
    className: 'vet-marker-user',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  vetMap = L.map(vetMapEl, { zoomControl: false }).setView([lat, lon], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(vetMap);
  L.control.zoom({ position: 'bottomright' }).addTo(vetMap);
  L.marker([lat, lon], { icon }).addTo(vetMap);
};

const clearMarkers = () => {
  vetMarkers.forEach((m) => vetMap?.removeLayer(m));
  vetMarkers = [];
};

const renderMapMarkers = (clinics) => {
  if (!vetMap) return;
  clearMarkers();
  clinics.forEach((c) => {
    const marker = L.marker([c.lat, c.lon])
      .bindPopup(`<strong>${c.name}</strong><br>${c.distance != null ? c.distance.toFixed(1) + ' km' : ''}`)
      .addTo(vetMap);
    vetMarkers.push(marker);
  });
  if (clinics.length) {
    const group = L.featureGroup(vetMarkers);
    vetMap.fitBounds(group.getBounds().pad(0.15));
  }
};

const renderVetResults = (clinics) => {
  if (!clinics.length) {
    vetResults.innerHTML = `
      <div class="vet-empty">
        <span class="material-symbols-outlined">search_off</span>
        <p>No se encontraron veterinarios en ${currentRadius} km.</p>
        <button class="secondary-btn" id="vetExpandSearch" type="button">Ampliar a ${currentRadius >= 50 ? '100' : currentRadius * 2} km</button>
      </div>`;
    document.getElementById('vetExpandSearch')?.addEventListener('click', expandSearch);
    return;
  }

  vetResults.innerHTML = clinics.map((c) => {
    const spec = c.specialization;
    const specClass = spec.level === 'confirmed' ? 'tag-green' : spec.level === 'possible' ? 'tag-yellow' : 'tag-muted';
    const dist = c.distance != null ? `${c.distance.toFixed(1)} km` : '';
    const phoneBtn = c.phone
      ? `<button class="secondary-btn vet-phone" data-phone="${c.phone}" type="button"><span class="material-symbols-outlined">call</span></button>`
      : '';
    const dirBtn = `<button class="secondary-btn directions-button" data-lat="${c.lat}" data-lon="${c.lon}" data-name="${c.name.replace(/"/g, '&quot;')}" type="button">Cómo llegar</button>`;
    return `
      <article class="clinic-card">
        <div class="clinic-head">
          <div class="clinic-avatar"><span class="material-symbols-outlined">local_hospital</span></div>
          <div>
            <h3>${c.name}</h3>
            <div class="review-line">
              <span class="tag ${specClass}">${spec.label}</span>
              ${dist ? `<span class="muted">• ${dist}</span>` : ''}
            </div>
          </div>
        </div>
        ${c.address ? `<div class="clinic-detail"><span class="material-symbols-outlined">location_on</span> ${c.address}</div>` : ''}
        ${c.openingHours ? `<div class="clinic-detail"><span class="material-symbols-outlined">schedule</span> ${c.openingHours}</div>` : ''}
        <div class="cta-row">
          ${phoneBtn}
          ${dirBtn}
        </div>
      </article>`;
  }).join('');

  // Wire directions buttons
  vetResults.querySelectorAll('.directions-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dest = `${btn.dataset.lat},${btn.dataset.lon}`;
      const origin = userLatLng ? `${userLatLng.lat},${userLatLng.lon}` : '';
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
      window.open(url, '_blank', 'noopener');
    });
  });

  // Wire phone buttons
  vetResults.querySelectorAll('.vet-phone').forEach((btn) => {
    btn.addEventListener('click', () => window.open(`tel:${btn.dataset.phone}`, '_self'));
  });
};

const searchVetsNearby = async (lat, lon, radiusKm) => {
  vetResults.innerHTML = `<div class="vet-empty"><span class="material-symbols-outlined">hourglass_empty</span><p>Buscando veterinarios en ${radiusKm} km…</p></div>`;
  initVetMap(lat, lon);
  try {
    const clinics = await VetSearchService.searchByLocation(lat, lon, radiusKm);
    currentRadius = radiusKm;
    renderVetResults(clinics);
    renderMapMarkers(clinics);
    locationMessage.textContent = `Mostrando ${clinics.length} clínica(s) en ${radiusKm} km.`;
  } catch (err) {
    console.error('Vet search error:', err);
    vetResults.innerHTML = `<div class="vet-empty"><span class="material-symbols-outlined">error</span><p>No se pudo buscar. Revisa tu conexión e inténtalo de nuevo.</p></div>`;
  }
};

const expandSearch = () => {
  if (!userLatLng) return;
  const next = currentRadius >= 50 ? 100 : currentRadius * 2;
  searchVetsNearby(userLatLng.lat, userLatLng.lon, next);
};

const requestLocation = () => {
  if (!navigator.geolocation) {
    locationMessage.textContent = 'Este navegador no permite obtener la ubicación.';
    return;
  }
  locationMessage.textContent = 'Solicitando permiso de ubicación…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude, longitude } = coords;
      userLatLng = { lat: latitude, lon: longitude };
      localStorage.setItem('herpcare_location', JSON.stringify(userLatLng));
      locationMessage.textContent = `Ubicación activa (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
      closeModal(locationModal);
      searchVetsNearby(latitude, longitude, 10);
    },
    () => {
      locationMessage.textContent = 'No se pudo obtener la ubicación. Usa la búsqueda por ciudad.';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
};

locationButton?.addEventListener('click', () => openModal(locationModal));
allowLocationButton?.addEventListener('click', requestLocation);

// Vet search by text
const runVetQuery = async () => {
  const q = vetSearchInput?.value.trim();
  if (!q) return;
  vetResults.innerHTML = `<div class="vet-empty"><span class="material-symbols-outlined">hourglass_empty</span><p>Buscando "${q}"…</p></div>`;
  try {
    const { clinics, center } = await VetSearchService.searchByQuery(q);
    if (center) {
      userLatLng = center;
      initVetMap(center.lat, center.lon);
    }
    currentRadius = 20;
    renderVetResults(clinics);
    if (center) renderMapMarkers(clinics);
    locationMessage.textContent = clinics.length
      ? `${clinics.length} clínica(s) cerca de "${q}".`
      : `No se encontraron veterinarios cerca de "${q}".`;
  } catch (err) {
    console.error('Vet query error:', err);
    vetResults.innerHTML = `<div class="vet-empty"><span class="material-symbols-outlined">error</span><p>No se pudo buscar "${q}". Verifica el nombre e inténtalo de nuevo.</p></div>`;
  }
};

vetSearchButton?.addEventListener('click', runVetQuery);
vetSearchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') runVetQuery(); });

// Init: restore saved location or prompt
const savedLoc = localStorage.getItem('herpcare_location');
if (savedLoc) {
  try {
    userLatLng = JSON.parse(savedLoc);
    locationMessage.textContent = 'Ubicación guardada. Pulsa "Usar mi ubicación" para buscar.';
  } catch { /* ignore */ }
} else {
  window.setTimeout(() => openModal(locationModal), 700);
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPromptEvent = event;
  installButton.hidden = false;
});

installButton?.addEventListener('click', async () => {
  if (!installPromptEvent) {
    locationMessage.textContent = 'En Android, abre el menú del navegador y pulsa “Instalar aplicación”.';
    return;
  }
  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = null;
  installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installButton.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('No se pudo registrar el modo offline de HerpCare:', error);
    });
  });
}
