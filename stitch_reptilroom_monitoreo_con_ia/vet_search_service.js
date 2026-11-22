/**
 * VetSearchService — Búsqueda de veterinarios vía OpenStreetMap (Overpass + Nominatim).
 * Sin claves API. Datos de OSM bajo ODbL.
 */
;(function () {
  'use strict';

  const OVERPASS = 'https://overpass-api.de/api/interpreter';
  const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  const USER_AGENT = 'HerpCare/1.0 (reptile-monitoring-pwa)';

  // ── Exotic-pet keyword detection ──────────────────────────────────────────
  const EXOTIC_KEYWORDS = [
    'reptil', 'reptiles', 'exotic', 'exót', 'exotica', 'exótica',
    'herpeto', 'herpetolog', 'herp', 'terrari', 'terraristic',
    'anfibio', 'anfibios', 'avifauna', 'fauna exot', 'fauna silvestre',
    'mascota exot', 'mascota unusual', 'exotic pet',
    'aves', 'tortuga', 'tortoises', 'iguana', 'serpiente', 'snake',
    'lagarto', 'gecko', 'camaleon', 'camaleón', 'pionus', 'loro'
  ];

  // ── Haversine distance ────────────────────────────────────────────────────
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Classify exotic specialization ────────────────────────────────────────
  function getSpecialization(tags) {
    if (!tags) return { level: 'unknown', label: 'Información no disponible' };

    // Check OSM healthcare tags
    const spec = (
      tags['healthcare:speciality'] ||
      tags['healthcare:specialization'] ||
      tags['speciality'] ||
      ''
    ).toLowerCase();
    const desc = (tags.description || tags.note || '').toLowerCase();
    const name = (tags.name || '').toLowerCase();
    const combined = `${spec} ${desc} ${name}`;

    // Confirmed exotic: explicit healthcare tag or strong match
    if (
      spec.includes('exotic') ||
      spec.includes('reptile') ||
      spec.includes('herpeto') ||
      spec.includes('avian')
    ) {
      return { level: 'confirmed', label: 'Especialización en exóticos' };
    }

    // Possible: name/description contains exotic keywords
    for (const kw of EXOTIC_KEYWORDS) {
      if (combined.includes(kw)) {
        return { level: 'possible', label: 'Posible atención de exóticos' };
      }
    }

    return { level: 'unknown', label: 'Información no disponible' };
  }

  // ── Format Overpass element into clinic object ────────────────────────────
  function formatClinic(element, userLat, userLon) {
    const t = element.tags || {};
    const distance =
      userLat != null && userLon != null
        ? calculateDistance(userLat, userLon, element.lat, element.lon)
        : null;

    return {
      id: element.id,
      name: t.name || 'Veterinaria sin nombre',
      lat: element.lat,
      lon: element.lon,
      distance,
      address: [t['addr:street'], t['addr:housenumber'], t['addr:city']]
        .filter(Boolean)
        .join(' ') || null,
      phone: t.phone || t['contact:phone'] || null,
      website: t.website || t['contact:website'] || null,
      openingHours: t.opening_hours || null,
      specialization: getSpecialization(t),
    };
  }

  // ── Overpass query by bounding box ────────────────────────────────────────
  async function queryOverpass(south, west, north, east) {
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="veterinary"](${south},${west},${north},${east});
        way["amenity"="veterinary"](${south},${west},${north},${east});
      );
      out center;`;

    const resp = await fetch(OVERPASS, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!resp.ok) throw new Error('Overpass API error: ' + resp.status);
    const data = await resp.json();
    return data.elements || [];
  }

  // ── Public API ────────────────────────────────────────────────────────────
  const VetSearchService = {
    /**
     * Search veterinary clinics near coordinates.
     * @param {number} lat
     * @param {number} lon
     * @param {number} radiusKm - search radius
     * @returns {Promise<Array>} sorted by distance
     */
    async searchByLocation(lat, lon, radiusKm) {
      // Build bounding box
      const dLat = (radiusKm / 111) * 1.2; // padding
      const dLon = dLat / Math.cos((lat * Math.PI) / 180);
      const south = lat - dLat;
      const north = lat + dLat;
      const west = lon - dLon;
      const east = lon + dLon;

      const elements = await queryOverpass(south, west, north, east);
      const clinics = elements
        .map((el) => formatClinic(el, lat, lon))
        .filter((c) => c.distance != null && c.distance <= radiusKm * 1.2);

      clinics.sort((a, b) => a.distance - b.distance);
      return clinics;
    },

    /**
     * Geocode a query string (city, postal code) then search nearby.
     * @param {string} query - city name or postal code
     * @returns {Promise<{ clinics: Array, center: {lat, lon} }>}
     */
    async searchByQuery(query) {
      const resp = await fetch(
        `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es,pt,fr`,
        { headers: { 'Accept-Language': 'es', Referer: 'HerpCare PWA' } }
      );
      if (!resp.ok) throw new Error('Nominatim error: ' + resp.status);
      const results = await resp.json();
      if (!results.length) return { clinics: [], center: null };

      const { lat, lon } = results[0];
      const center = { lat: parseFloat(lat), lon: parseFloat(lon) };
      const clinics = await VetSearchService.searchByLocation(
        center.lat,
        center.lon,
        20
      );
      return { clinics, center };
    },

    calculateDistance,
    getSpecialization,
    formatClinic,
  };

  window.VetSearchService = VetSearchService;
})();
