/* app.js — feature branch: feat/ui-tabs-maps
   Añade: navegación por pestañas, CRUD de ejemplares en localStorage,
   pesajes por ejemplar con Chart.js, manejo de perfil y mapa (fallback/simulado)

   Nota: Para activar Google Maps o Google Sign-In, crea config.local.js con:
     window.HERPCARE_GOOGLE_CLIENT_ID = "TU_CLIENT_ID";
     window.HERPCARE_GOOGLE_MAPS_API_KEY = "TU_MAPS_KEY";
   y no subas ese archivo al repo. index.html ya intenta leer esas variables.
*/

// ---- Utils & Storage -------------------------------------------------------------------
const STORAGE_KEYS = {
  SPECIMENS: 'herpcare_specimens_v1',
  PROFILE: 'herpcare_profile_v1'
};

const uid = () => Math.random().toString(36).slice(2, 9);

const loadSpecimens = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIMENS) || '[]');
const saveSpecimens = (arr) => localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(arr));

const loadProfile = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}');
const saveProfile = (p) => localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));

// ---- DOM Refs -------------------------------------------------------------------------
const panels = {
  home: document.getElementById('homePanel'),
  ia: document.getElementById('iaPanel'),
  collection: document.getElementById('collectionPanel'),
  weight: document.getElementById('weightPanel'),
  vets: document.getElementById('vetsPanel')
};
const specimenListEl = document.getElementById('specimenList');
const collectionEmptyEl = document.getElementById('collectionEmpty');
const iaEmptyEl = document.getElementById('iaEmptyMessage');
const iaContentEl = document.getElementById('iaContent');
const weightsEmptyEl = document.getElementById('weightsEmpty');
const weightsListEl = document.getElementById('weightsList');
const weightPanelTitle = document.getElementById('weightPanelTitle');
const addWeightButton = document.getElementById('addWeightButton');
const addSpecimenButton = document.getElementById('addSpecimenButton');
const addSpecimenFromHomeButton = document.getElementById('addSpecimenFromHome');
const openCameraFromHomeButton = document.getElementById('openCameraFromHome');
const openGalleryFromHomeButton = document.getElementById('openGalleryFromHome');
const openAddSpecimenFromWeightButton = document.getElementById('openAddSpecimenFromWeight');
const openCameraButtonTop = document.getElementById('openCameraButtonTop');
const openCameraButton = document.getElementById('openCameraButton');
const goToVetsFromHomeButton = document.getElementById('goToVetsFromHome');
const cameraModal = document.getElementById('cameraModal');
const cameraPhoto = document.getElementById('cameraPhoto');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const cameraStatus = document.getElementById('cameraStatus');
const takePhotoButton = document.getElementById('takePhotoButton');
const choosePhotoButton = document.getElementById('choosePhotoButton');
const cameraCaptureInput = document.getElementById('cameraCaptureInput');
const galleryFileInput = document.getElementById('galleryFileInput');
const saveSpecimenButton = document.getElementById('saveSpecimenButton');
const specimenNameInput = document.getElementById('specimenName');
const specimenSpeciesInput = document.getElementById('specimenSpecies');

const profileButton = document.getElementById('profileButton');
const profileModal = document.getElementById('profileModal');
const profilePreview = document.getElementById('profilePreview');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const changePhotoButton = document.getElementById('changePhotoButton');
const profileNameInput = document.getElementById('profileName');
const profileAddressInput = document.getElementById('profileAddress');
const saveProfileButton = document.getElementById('saveProfileButton');
const signInGoogleButton = document.getElementById('signInGoogleButton');

const mapEl = document.getElementById('map');
const mapMessageEl = document.getElementById('mapMessage');
const clinicsListEl = document.getElementById('clinicsList');
const appFeedbackEl = document.getElementById('appFeedback');
const installButton = document.getElementById('installButton');

// Chart state
let currentChart = null;
let currentSpecimenId = null;
let feedbackTimeoutId = null;
let installPromptEvent = null;

// ---- Navigation (tabs) -----------------------------------------------------------------
function showPanel(targetId) {
  const map = {
    homePanel: 'home',
    iaPanel: 'ia',
    collectionPanel: 'collection',
    weightPanel: 'weight',
    vetsPanel: 'vets'
  };
  const normalizedTarget = map[targetId] ? targetId : 'homePanel';
  const key = map[normalizedTarget];
  Object.values(panels).forEach((p) => p && (p.hidden = true));
  panels[key].hidden = false;

  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === normalizedTarget);
  });
}

document.querySelectorAll('[data-target]').forEach((btn) => {
  btn.addEventListener('click', () => showPanel(btn.dataset.target));
});

// Initialize default view
showPanel('homePanel');

// ---- Specimens (CRUD) -----------------------------------------------------------------
function showFeedback(message) {
  if (!appFeedbackEl) return;
  appFeedbackEl.textContent = message;
  appFeedbackEl.hidden = false;
  clearTimeout(feedbackTimeoutId);
  feedbackTimeoutId = setTimeout(() => {
   appFeedbackEl.hidden = true;
  }, 3200);
}

function isAndroid() {
  return /android/i.test(window.navigator.userAgent || '');
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
}

function setInstallButtonLabel(label) {
  if (!installButton) return;
  installButton.innerHTML = `<span class="material-symbols-outlined">install_mobile</span>${label}`;
}

function updateInstallButtonVisibility() {
  if (!installButton) return;

  if (isStandalone()) {
    installButton.hidden = true;
    return;
  }

  if (installPromptEvent) {
    installButton.hidden = false;
    setInstallButtonLabel('Instalar en Android');
    return;
  }

  if (isAndroid()) {
    installButton.hidden = false;
    setInstallButtonLabel('Cómo instalar');
    return;
  }

  installButton.hidden = true;
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPromptEvent = event;
  updateInstallButtonVisibility();
});

installButton?.addEventListener('click', async () => {
  if (installPromptEvent) {
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    installPromptEvent = null;
    updateInstallButtonVisibility();
    return;
  }

  window.alert('En Android, abre el menú de Chrome y pulsa "Instalar aplicación" o "Añadir a pantalla de inicio".');
});

window.addEventListener('appinstalled', () => {
  installPromptEvent = null;
  updateInstallButtonVisibility();
});

function renderIAContent(specimens = loadSpecimens()) {
  if (!iaContentEl) return;

  if (!specimens.length) {
   iaContentEl.hidden = true;
   iaContentEl.innerHTML = '';
   iaEmptyEl.hidden = false;
   return;
  }

  const featuredSpecimen = specimens.find((specimen) => specimen.id === currentSpecimenId) || specimens[specimens.length - 1];
  const totalWeights = (featuredSpecimen.weights || []).length;

  iaEmptyEl.hidden = true;
  iaContentEl.hidden = false;
  iaContentEl.innerHTML = `
   <article class="weight-card">
     <div class="section-head compact">
       <div>
         <div class="eyebrow">Biomódulo activo</div>
         <h2>${escapeHtml(featuredSpecimen.name || 'Ejemplar')}</h2>
       </div>
       <span class="tag tag-secondary">${specimens.length} ejemplar${specimens.length === 1 ? '' : 'es'}</span>
     </div>
     <p>${escapeHtml(featuredSpecimen.species || 'Especie pendiente de completar')}</p>
     <div class="specimen-stats">
       <div><small>Último peso</small><strong>${latestWeight(featuredSpecimen) || 'Sin pesajes'}</strong></div>
       <div><small>Registros</small><strong>${totalWeights}</strong></div>
     </div>
     <div class="specimen-actions">
       <button class="secondary-btn" type="button" data-home-action="collection">Ver colección</button>
       <button class="primary-btn" type="button" data-home-action="weight" data-id="${featuredSpecimen.id}">Abrir peso</button>
     </div>
   </article>
  `;

  iaContentEl.querySelector('[data-home-action="collection"]')?.addEventListener('click', () => showPanel('collectionPanel'));
  iaContentEl.querySelector('[data-home-action="weight"]')?.addEventListener('click', (event) => {
   openSpecimenWeightPanel(event.currentTarget.dataset.id);
  });
}

function renderWeightPanel(specimens = loadSpecimens()) {
  if (!specimens.length) {
   if (currentChart) {
     try { currentChart.destroy(); } catch (error) {}
     currentChart = null;
   }
   currentSpecimenId = null;
   weightPanelTitle.textContent = 'Selecciona un ejemplar';
   weightsListEl.hidden = true;
   weightsListEl.innerHTML = '';
   weightsEmptyEl.hidden = false;
   return;
  }

  const selectedSpecimen = specimens.find((specimen) => specimen.id === currentSpecimenId) || specimens[0];
  currentSpecimenId = selectedSpecimen.id;
  weightPanelTitle.textContent = selectedSpecimen.name || 'Ejemplar';
  renderWeightsFor(selectedSpecimen);
}

function renderSpecimens() {
  const specimens = loadSpecimens();
  renderIAContent(specimens);
  renderWeightPanel(specimens);

  if (!specimens.length) {
   specimenListEl.hidden = true;
   collectionEmptyEl.hidden = false;
   return;
  }
  specimenListEl.hidden = false;
  collectionEmptyEl.hidden = true;
  specimenListEl.innerHTML = '';
  specimens.forEach((s) => {
   const art = document.createElement('article');
   art.className = 'specimen-card';
   art.innerHTML = `
     <div class="specimen-image"><img src="${sanitizeImageSource(s.photo) || placeholderFor(s)}" alt="${s.name || 'Sin nombre'}" /><div class="badge floating">${s.status||'Activo'}</div></div>
      <div class="specimen-body">
        <div class="specimen-top"><h3>${escapeHtml(s.name||'Ejemplar')}</h3><span class="mini-tag safe">${escapeHtml(s.species||'--')}</span></div>
        <p>${escapeHtml(s.species || '')}</p>
        <div class="specimen-stats"><div><small>Registrado</small><strong>${new Date(s.createdAt).toLocaleDateString()}</strong></div><div><small>Peso</small><strong>${(latestWeight(s)??'--')}</strong></div></div>
        <div class="specimen-actions"><button class="secondary-btn view-btn" data-id="${s.id}" type="button">Ver</button><button class="secondary-btn edit-btn" data-id="${s.id}" type="button">Editar</button><button class="secondary-btn del-btn" data-id="${s.id}" type="button">Eliminar</button></div>
      </div>
    `;
    specimenListEl.appendChild(art);
  });

  // attach handlers
  specimenListEl.querySelectorAll('.view-btn').forEach((b) => b.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    openSpecimenWeightPanel(id);
  }));
  specimenListEl.querySelectorAll('.edit-btn').forEach((b) => b.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id; editSpecimen(id);
  }));
  specimenListEl.querySelectorAll('.del-btn').forEach((b) => b.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id; deleteSpecimen(id);
  }));
}

function placeholderFor(s) {
  return 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80';
}

function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>'"]/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }

function sanitizeImageSource(source) {
  if (!source) return '';
  const value = String(source).trim();
  if (/^(javascript|vbscript):/i.test(value)) return '';
  if (/^data:/i.test(value) && !/^data:image\//i.test(value)) return '';
  return value;
}

function safeTextLabel(value, fallback = 'Ejemplar') {
  const normalized = String(value || '')
    .replace(/[<>\u0000-\u001F\u007F]/g, '')
    .trim();
  return normalized || fallback;
}

function latestWeight(specimen){
  try{
    const w = specimen.weights || [];
    if(!w.length) return null;
    const last = w[w.length-1];
    return typeof last.value==='number'? `${last.value} g` : `${last.value}`;
  }catch(e){ return null; }
}

function createSpecimen({name, species, photo}){
  const specimens = loadSpecimens();
  const s = { id: uid(), name, species, photo: sanitizeImageSource(photo), weights: [], createdAt: Date.now(), status: 'Saludable'};
  specimens.push(s);
  currentSpecimenId = s.id;
  saveSpecimens(specimens);
  renderSpecimens();
  return s;
}

function editSpecimen(id){
  const specimens = loadSpecimens();
  const s = specimens.find(x=>x.id===id); if(!s) return alert('Ejemplar no encontrado');
  const newName = prompt('Nombre', s.name) || s.name;
  const newSpecies = prompt('Especie', s.species) || s.species;
  s.name = newName; s.species = newSpecies; saveSpecimens(specimens); renderSpecimens();
}

function deleteSpecimen(id){
  if(!confirm('Eliminar ejemplar? Esto borrará tambien su historial de peso.')) return;
  const specimens = loadSpecimens().filter(x=>x.id!==id);
  if (currentSpecimenId === id) {
    currentSpecimenId = specimens[0]?.id || null;
  }
  saveSpecimens(specimens);
  renderSpecimens();
  showFeedback('Ejemplar eliminado correctamente.');
}

function openSpecimenWeightPanel(id){
  const specimens = loadSpecimens();
  const s = specimens.find(x=>x.id===id); if(!s) return alert('Ejemplar no encontrado');
  currentSpecimenId = id;
  weightPanelTitle.textContent = s.name || 'Ejemplar';
  showPanel('weightPanel');
  renderWeightsFor(s);
}

// ---- Weights & Chart.js ----------------------------------------------------------------
function ensureChartJsLoaded(){
  return new Promise((resolve, reject)=>{
    if(window.Chart) return resolve(window.Chart);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    s.onload = ()=> resolve(window.Chart);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function renderWeightsFor(specimen){
  weightsListEl.hidden = false; weightsEmptyEl.hidden = true;
  weightsListEl.innerHTML = '';
  const labels = (specimen.weights||[]).map(w => new Date(w.date).toLocaleDateString());
  const data = (specimen.weights||[]).map(w => w.value);

  const card = document.createElement('article');
  card.className = 'weight-card';
  card.innerHTML = `
    <div class="specimen-top">
      <h3>${escapeHtml(specimen.name || 'Ejemplar')}</h3>
      <span class="mini-tag safe">${escapeHtml(specimen.species || '--')}</span>
    </div>
    <p>${(specimen.weights || []).length ? 'Historial de evolución de peso del ejemplar.' : 'Aún no hay pesajes. Usa “Añadir” para registrar el primero.'}</p>
    <div class="chart-canvas-wrap"></div>
  `;
  weightsListEl.appendChild(card);

  const chartWrap = card.querySelector('.chart-canvas-wrap');

  if ((specimen.weights || []).length) {
    const canvas = document.createElement('canvas');
    chartWrap.appendChild(canvas);

    ensureChartJsLoaded().then((Chart)=>{
      if(currentChart){ try{ currentChart.destroy(); }catch(e){} }
      currentChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Peso (g)', data, borderColor: '#ffb59c', backgroundColor: 'rgba(255,181,156,0.08)', fill: true, tension: 0.35 }] },
        options: { responsive: true, scales: { y: { beginAtZero: false } } }
      });
    }).catch(()=>{
      const list = document.createElement('div');
      list.innerHTML = (specimen.weights||[]).map(w=>`<div class="history-item"><div class="icon-wrap"><span class="material-symbols-outlined">scale</span></div><div><div class="history-top"><strong>${w.value} g</strong></div><small>${new Date(w.date).toLocaleString()}</small></div></div>`).join('');
      chartWrap.appendChild(list);
    });
  } else {
    if(currentChart){ try{ currentChart.destroy(); }catch(e){} }
    currentChart = null;
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'map-message';
    emptyMessage.textContent = 'Todavía no hay registros de peso para este ejemplar.';
    chartWrap.appendChild(emptyMessage);
  }

  const historyTitle = document.createElement('h4');
  historyTitle.textContent = 'Historial';
  card.appendChild(historyTitle);

  const histDiv = document.createElement('div');
  histDiv.className='history-list';
  (specimen.weights||[]).slice().reverse().forEach(w=>{
    const item = document.createElement('div');
    item.className='history-item';
    item.innerHTML = `<div class="icon-wrap"><span class="material-symbols-outlined">scale</span></div><div><div class="history-top"><strong>${w.value} g</strong></div><small>${new Date(w.date).toLocaleString()}</small></div>`;
    histDiv.appendChild(item);
  });

  if (!histDiv.children.length) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `<div class="icon-wrap"><span class="material-symbols-outlined">info</span></div><div><div class="history-top"><strong>Sin historial</strong></div><small>Añade el primer pesaje desde este panel.</small></div>`;
    histDiv.appendChild(item);
  }

  card.appendChild(histDiv);
}

addWeightButton?.addEventListener('click', async () => {
  if(!currentSpecimenId) return alert('Selecciona un ejemplar primero');
  const valueRaw = prompt('Nuevo peso en gramos (ej. 68.5)');
  if(!valueRaw) return;
  const value = Number(valueRaw.replace(',', '.'));
  if(Number.isNaN(value)) return alert('Valor no numérico');
  const specimens = loadSpecimens();
  const s = specimens.find(x=>x.id===currentSpecimenId); if(!s) return alert('Ejemplar no encontrado');
  s.weights = s.weights || []; s.weights.push({ date: Date.now(), value }); saveSpecimens(specimens);
  renderSpecimens();
  showFeedback(`Peso añadido a ${s.name}: ${value} g.`);
});

// ---- Camera / Photo capture --------------------------------------------------------------
function resetCameraModal({ clearForm = true } = {}) {
  if (cameraCaptureInput) cameraCaptureInput.value = '';
  if (galleryFileInput) galleryFileInput.value = '';
  cameraPhoto.removeAttribute('src');
  cameraPhoto.hidden = true;
  cameraPlaceholder.hidden = false;
  if (clearForm) {
    specimenNameInput.value = '';
    specimenSpeciesInput.value = '';
  }
  cameraStatus.textContent = 'La foto se guardará en este dispositivo.';
}

function showCapturedPhotoPreview(dataUrl) {
  const safeSource = sanitizeImageSource(dataUrl);
  if (!safeSource.startsWith('data:image/')) {
    cameraStatus.textContent = 'No se pudo usar la imagen capturada.';
    return;
  }
  if (cameraModal.hidden) {
    cameraModal.hidden = false;
  }
  cameraPhoto.src = safeSource;
  cameraPhoto.hidden = false;
  cameraPlaceholder.hidden = true;
  cameraStatus.textContent = 'Foto lista. Completa el nombre y la especie para guardar el ejemplar.';
  requestAnimationFrame(() => specimenNameInput?.focus());
}

function showSelectedPhotoPreview(file) {
  if (!file?.type?.startsWith('image/')) {
    cameraStatus.textContent = 'Selecciona un archivo de imagen válido.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    if (!result.startsWith('data:image/')) {
      cameraStatus.textContent = 'No se pudo usar la imagen seleccionada.';
      return;
    }
    showCapturedPhotoPreview(result);
  };
  reader.onerror = () => {
    cameraStatus.textContent = 'No se pudo leer la imagen seleccionada.';
  };
  reader.readAsDataURL(file);
}

function currentCameraPhotoSource() {
  return cameraPhoto.getAttribute('src') || '';
}

function openCameraModal() {
  cameraModal.hidden = false;
  cameraStatus.textContent = currentCameraPhotoSource() ? 'Foto lista. Completa el nombre y la especie para guardar el ejemplar.' : 'Añade nombre/especie o selecciona una imagen para completar el registro.';
  requestAnimationFrame(() => (currentCameraPhotoSource() ? specimenNameInput : takePhotoButton)?.focus());
}

function openGalleryPicker(message = 'Selecciona una imagen desde la galería para continuar.') {
  cameraStatus.textContent = message;
  galleryFileInput?.click();
  window.setTimeout(() => choosePhotoButton?.focus(), 250);
}

function openNativeCameraPicker(message = 'Abriendo la cámara del dispositivo...') {
  cameraStatus.textContent = message;
  cameraCaptureInput?.click();
  window.setTimeout(() => takePhotoButton?.focus(), 250);
}

function startCameraCapture() {
  openNativeCameraPicker();
}

openCameraButtonTop?.addEventListener('click', ()=>{ resetCameraModal(); openCameraModal(); startCameraCapture(); });
openCameraButton?.addEventListener('click', ()=>{ resetCameraModal(); openCameraModal(); startCameraCapture(); });
addSpecimenButton?.addEventListener('click', () => { resetCameraModal(); openCameraModal(); });
addSpecimenFromHomeButton?.addEventListener('click', () => { resetCameraModal(); openCameraModal(); });
openAddSpecimenFromWeightButton?.addEventListener('click', () => { resetCameraModal(); openCameraModal(); });
openCameraFromHomeButton?.addEventListener('click', () => {
  resetCameraModal();
  openCameraModal();
  startCameraCapture();
});
openGalleryFromHomeButton?.addEventListener('click', () => {
  resetCameraModal();
  openCameraModal();
  openGalleryPicker();
});
goToVetsFromHomeButton?.addEventListener('click', () => showPanel('vetsPanel'));

takePhotoButton?.addEventListener('click', startCameraCapture);
choosePhotoButton?.addEventListener('click', ()=> openGalleryPicker());
cameraCaptureInput?.addEventListener('change', ()=>{
  const [file] = cameraCaptureInput.files || [];
  if(!file) return;
  showSelectedPhotoPreview(file);
});
galleryFileInput?.addEventListener('change', ()=>{
  const [file] = galleryFileInput.files || [];
  if(!file) return;
  showSelectedPhotoPreview(file);
});

document.querySelectorAll('[data-close-modal]').forEach((b)=>b.addEventListener('click', ()=>{
  document.getElementById(b.dataset.closeModal).hidden = true;
  if (b.dataset.closeModal === 'cameraModal') {
    resetCameraModal({ clearForm: false });
  }
}));

saveSpecimenButton?.addEventListener('click', ()=>{
  const name = specimenNameInput.value?.trim(); const species = specimenSpeciesInput.value?.trim();
  const photo = currentCameraPhotoSource();
  if(!name) return alert('Añade nombre al ejemplar');
  const wasEmpty = loadSpecimens().length === 0;
  const s = createSpecimen({ name, species, photo });
  cameraModal.hidden = true;
  resetCameraModal();
  const specimenLabel = safeTextLabel(s.name);
  showFeedback(wasEmpty ? `Primer ejemplar registrado: ${specimenLabel}.` : `Ejemplar registrado correctamente: ${specimenLabel}.`);
  showPanel('collectionPanel');
});

// ---- Profile handling ------------------------------------------------------------------
function loadAndRenderProfile(){
  const p = loadProfile();
  if(p.photo) profilePreview.src = p.photo;
  if(p.name) profileNameInput.value = p.name; if(p.address) profileAddressInput.value = p.address;
}
loadAndRenderProfile();

profileButton?.addEventListener('click', ()=>{ profileModal.hidden=false; });
changePhotoButton?.addEventListener('click', ()=> profilePhotoInput.click());
profilePhotoInput?.addEventListener('change', ()=>{
  const [f] = profilePhotoInput.files || [];
  if(!f) return; const url = URL.createObjectURL(f); profilePreview.src = url;
});
saveProfileButton?.addEventListener('click', ()=>{
  const p = { name: profileNameInput.value?.trim(), address: profileAddressInput.value?.trim(), photo: profilePreview.src };
  saveProfile(p); alert('Perfil guardado'); profileModal.hidden = true; loadAndRenderProfile();
});

signInGoogleButton?.addEventListener('click', ()=>{
  const id = window.HERPCARE_GOOGLE_CLIENT_ID; if(!id) return alert('Configura window.HERPCARE_GOOGLE_CLIENT_ID en config.local.js');
  // open login modal flow handled elsewhere via GSI render; here we just open login modal
  document.getElementById('loginModal').hidden = false;
});

// Simple helper to decode GSI JWT and extract profile (CLIENT-SIDE ONLY)
function handleGsiCredential(response){
  try{
    const jwt = response.credential;
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    const profile = { name: payload.name, email: payload.email, photo: payload.picture };
    saveProfile(Object.assign(loadProfile(), profile)); loadAndRenderProfile(); document.getElementById('loginModal').hidden = true; alert('Sesión iniciada como '+profile.name);
  }catch(e){ console.error('GSI decode error', e); }
}

// Initialize GSI if available
function initGsi(){
  const clientId = window.HERPCARE_GOOGLE_CLIENT_ID;
  if(clientId && window.google?.accounts?.id){
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleGsiCredential });
    window.google.accounts.id.renderButton(document.getElementById('googleButton'), { theme:'filled_black', size:'large', shape:'pill', text:'signin_with' });
  }
}
window.initGsi = initGsi; // expose for manual calls
setTimeout(initGsi, 800);

// ---- Map initialization (conditional) --------------------------------------------------
function initMapFallback(){
  // Render simulated pins in the #map element
  mapEl.innerHTML = '';
  mapMessageEl && (mapMessageEl.textContent = 'Mapa simulado (sin API key) — añade tu API key para mapa real');
  const pins = [ {label:'1.8 km', top:'16%', left:'26%'}, {label:'3.4 km', top:'24%', right:'30%'}, {label:'6.2 km', bottom:'15%', right:'12%'} ];
  pins.forEach((p, i)=>{
    const d = document.createElement('div'); d.className = 'map-pin pin-'+(i+1); d.innerHTML = `<span>${p.label}</span>`; d.style.position='absolute';
    if(p.left) d.style.left=p.left; if(p.top) d.style.top=p.top; if(p.right) d.style.right=p.right; if(p.bottom) d.style.bottom=p.bottom;
    mapEl.appendChild(d);
  });
}

function initMapIfAvailable(){
  const key = window.HERPCARE_GOOGLE_MAPS_API_KEY;
  if(!key){ initMapFallback(); return; }
  // inject script with callback initMap
  if(window.google && window.google.maps){ window.initMap(); return; }
  const src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initMap`;
  const s = document.createElement('script'); s.src = src; s.async = true; s.defer = true; document.head.appendChild(s);
}

// global callback expected by Maps script
window.initMap = function(){
  // try to get user location
  const defaultPos = { lat:40.4168, lng:-3.7038 };
  const onPos = (pos)=>{
    const latlng = pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : defaultPos;
    const map = new google.maps.Map(mapEl, { center: latlng, zoom: 13 });
    const userMarker = new google.maps.Marker({ position: latlng, map, title: 'Tu ubicación' });

    // Places nearby search for veterinarians
    const service = new google.maps.places.PlacesService(map);
    const req = { location: latlng, radius: 8000, keyword: 'veterinarian' };
    service.nearbySearch(req, (results, status) => {
      clinicsListEl.innerHTML = '';
      if(status !== google.maps.places.PlacesServiceStatus.OK || !results) return initMapFallback();
      results.slice(0,8).forEach((place)=>{
        const m = new google.maps.Marker({ position: place.geometry.location, map, title: place.name });
        const card = document.createElement('article'); card.className='clinic-card'; card.innerHTML = `<div class="clinic-head"><img src="${place.photos?.[0]?.getUrl({maxWidth:120})||'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'}" alt="${escapeHtml(place.name)}" /><div><h3>${escapeHtml(place.name)}</h3><div class="review-line"><span class="material-symbols-outlined">star</span><strong>${place.rating||'--'}</strong> <small>• ${place.vicinity||''}</small></div></div></div>`;
        clinicsListEl.appendChild(card);
        card.addEventListener('click', ()=>{ window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name+' '+place.vicinity||'')}`,'_blank'); });
      });
    });
  };
  if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(onPos, ()=>onPos(null), { timeout:7000 }); } else onPos(null);
};

// initialize map on load
initMapIfAvailable();

// ---- Boot -----------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    } catch (error) {
      console.error('No se pudo registrar el service worker:', error);
    }
  });
}

renderSpecimens();
updateInstallButtonVisibility();

// If there are specimens, auto-open collection
if(loadSpecimens().length) document.querySelector('[data-target="collectionPanel"]')?.classList.remove('');

// Expose some helpers for debugging
window.HerpCare = { loadSpecimens, saveSpecimens, createSpecimen, renderSpecimens, initMapIfAvailable };
