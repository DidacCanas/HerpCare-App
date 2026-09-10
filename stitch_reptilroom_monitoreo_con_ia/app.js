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
  ia: document.getElementById('iaPanel'),
  collection: document.getElementById('collectionPanel'),
  weight: document.getElementById('weightPanel'),
  vets: document.getElementById('vetsPanel')
};
const specimenListEl = document.getElementById('specimenList');
const collectionEmptyEl = document.getElementById('collectionEmpty');
const iaEmptyEl = document.getElementById('iaEmptyMessage');
const weightsEmptyEl = document.getElementById('weightsEmpty');
const weightsListEl = document.getElementById('weightsList');
const weightPanelTitle = document.getElementById('weightPanelTitle');
const addWeightButton = document.getElementById('addWeightButton');
const openCameraButtonTop = document.getElementById('openCameraButtonTop');
const openCameraButton = document.getElementById('openCameraButton');
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraPhoto = document.getElementById('cameraPhoto');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const startCameraButton = document.getElementById('startCameraButton');
const capturePhotoButton = document.getElementById('capturePhotoButton');
const choosePhotoButton = document.getElementById('choosePhotoButton');
const cameraFileInput = document.getElementById('cameraFileInput');
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

// Chart state
let currentChart = null;
let currentSpecimenId = null;

// Camera state
let cameraStream;

// ---- Navigation (tabs) -----------------------------------------------------------------
function showPanel(targetId) {
  // map data-target values to panels
  const map = {
    iaPanel: 'ia',
    collectionPanel: 'collection',
    weightPanel: 'weight',
    vetsPanel: 'vets',
    home: 'ia'
  };
  const key = map[targetId] || map['iaPanel'];
  Object.values(panels).forEach((p) => p && (p.hidden = true));
  panels[key].hidden = false;

  // update active classes on nav / bottom
  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === targetId || (targetId === 'home' && btn.dataset.target === 'iaPanel'));
  });
}

document.querySelectorAll('[data-target]').forEach((btn) => {
  btn.addEventListener('click', () => showPanel(btn.dataset.target));
});

// Initialize default view
showPanel('iaPanel');

// ---- Specimens (CRUD) -----------------------------------------------------------------
function renderSpecimens() {
  const specimens = loadSpecimens();
  if (!specimens.length) {
    specimenListEl.hidden = true;
    collectionEmptyEl.hidden = false;
    iaEmptyEl.hidden = false;
    return;
  }
  specimenListEl.hidden = false;
  collectionEmptyEl.hidden = true;
  iaEmptyEl.hidden = true;
  specimenListEl.innerHTML = '';
  specimens.forEach((s) => {
    const art = document.createElement('article');
    art.className = 'specimen-card';
    art.innerHTML = `
      <div class="specimen-image"><img src="${s.photo || placeholderFor(s)}" alt="${s.name || 'Sin nombre'}" /><div class="badge floating">${s.status||'Activo'}</div></div>
      <div class="specimen-body">
        <div class="specimen-top"><h3>${escapeHtml(s.name||'Ejemplar')}</h3><span class="mini-tag safe">${escapeHtml(s.species||'--')}</span></div>
        <p>${escapeHtml(s.species || '')}</p>
        <div class="specimen-stats"><div><small>Registrado</small><strong>${new Date(s.createdAt).toLocaleDateString()}</strong></div><div><small>Peso</small><strong>${(latestWeight(s)??'--')}</strong></div></div>
        <div style="display:flex;gap:8px;margin-top:10px;"><button class="secondary-btn view-btn" data-id="${s.id}">Ver</button><button class="secondary-btn edit-btn" data-id="${s.id}">Editar</button><button class="secondary-btn del-btn" data-id="${s.id}">Eliminar</button></div>
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
  const s = { id: uid(), name, species, photo, weights: [], createdAt: Date.now(), status: 'Saludable'};
  specimens.push(s); saveSpecimens(specimens); renderSpecimens(); return s;
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
  const specimens = loadSpecimens().filter(x=>x.id!==id); saveSpecimens(specimens); renderSpecimens();
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

  const canvas = document.createElement('canvas');
  weightsListEl.appendChild(canvas);

  ensureChartJsLoaded().then((Chart)=>{
    if(currentChart){ try{ currentChart.destroy(); }catch(e){} }
    currentChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Peso (g)', data, borderColor: '#ffb59c', backgroundColor: 'rgba(255,181,156,0.08)', fill: true, tension: 0.35 }] },
      options: { responsive: true, scales: { y: { beginAtZero: false } } }
    });
  }).catch(()=>{
    // fallback: simple SVG polyline or list
    const list = document.createElement('div');
    list.innerHTML = (specimen.weights||[]).map(w=>`<div class="history-item"><div class="icon-wrap"><span class="material-symbols-outlined">scale</span></div><div><div class="history-top"><strong>${w.value} g</strong></div><small>${new Date(w.date).toLocaleString()}</small></div></div>`).join('');
    weightsListEl.appendChild(list);
  });

  // History list
  const historyTitle = document.createElement('h4'); historyTitle.textContent = 'Historial'; weightsListEl.appendChild(historyTitle);
  const histDiv = document.createElement('div'); histDiv.className='history-list';
  (specimen.weights||[]).slice().reverse().forEach(w=>{
    const item = document.createElement('div'); item.className='history-item'; item.innerHTML = `<div class="icon-wrap"><span class="material-symbols-outlined">scale</span></div><div><div class="history-top"><strong>${w.value} g</strong></div><small>${new Date(w.date).toLocaleString()}</small></div>`; histDiv.appendChild(item);
  });
  weightsListEl.appendChild(histDiv);
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
  renderWeightsFor(s);
  renderSpecimens();
});

// ---- Camera / Photo capture (re-using and extending existing logic) --------------------
const stopCamera = () => { try{ cameraStream?.getTracks().forEach(t=>t.stop()); }catch(e){} cameraStream=undefined; cameraVideo.srcObject = null; capturePhotoButton.disabled = true; };

const showPhotoPreview = (source) => { cameraPhoto.src = source; cameraPhoto.hidden = false; cameraVideo.hidden = true; cameraPlaceholder.hidden = true; };

openCameraButtonTop?.addEventListener('click', ()=>{ cameraModal.hidden = false; });
openCameraButton?.addEventListener('click', ()=>{ cameraModal.hidden = false; });

startCameraButton?.addEventListener('click', async ()=>{
  if (!navigator.mediaDevices?.getUserMedia) { cameraStatus?.textContent = 'No hay cámara disponible'; cameraFileInput.click(); return; }
  try{
    stopCamera();
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    cameraVideo.srcObject = cameraStream; cameraVideo.hidden = false; cameraPhoto.hidden = true; cameraPlaceholder.hidden = true; capturePhotoButton.disabled = false;
  }catch(err){ console.error(err); alert('No se pudo acceder a la cámara'); }
});

capturePhotoButton?.addEventListener('click', () => {
  if (!cameraVideo.videoWidth) return;
  cameraCanvas.width = cameraVideo.videoWidth; cameraCanvas.height = cameraVideo.videoHeight;
  cameraCanvas.getContext('2d').drawImage(cameraVideo,0,0);
  showPhotoPreview(cameraCanvas.toDataURL('image/jpeg', 0.9)); stopCamera();
});

choosePhotoButton?.addEventListener('click', ()=> cameraFileInput.click());
cameraFileInput?.addEventListener('change', ()=>{
  const [file] = cameraFileInput.files || [];
  if(!file) return; showPhotoPreview(URL.createObjectURL(file));
});

document.querySelectorAll('[data-close-modal]').forEach((b)=>b.addEventListener('click', ()=>{
  document.getElementById(b.dataset.closeModal).hidden = true; stopCamera();
}));

saveSpecimenButton?.addEventListener('click', ()=>{
  const name = specimenNameInput.value?.trim(); const species = specimenSpeciesInput.value?.trim();
  const photo = cameraPhoto.src || '';
  if(!name) return alert('Añade nombre al ejemplar');
  const s = createSpecimen({ name, species, photo });
  // reset camera modal
  specimenNameInput.value=''; specimenSpeciesInput.value=''; cameraPhoto.src=''; cameraPhoto.hidden=true; cameraPlaceholder.hidden=false; cameraModal.hidden=true; renderSpecimens();
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
renderSpecimens();

// If there are specimens, auto-open collection
if(loadSpecimens().length) document.querySelector('[data-target="collectionPanel"]')?.classList.remove('');

// Expose some helpers for debugging
window.HerpCare = { loadSpecimens, saveSpecimens, createSpecimen, renderSpecimens, initMapIfAvailable };

