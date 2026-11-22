/**
 * HerpCare DataService
 * Capa de datos con autorización por usuario, ownership checks, cuotas y sanitización.
 * Todas las operaciones requieren sesión válida y verifican pertenencia del recurso.
 */
(function (window) {
  'use strict';

  const STORAGE_PREFIX = 'herpcare_data_';
  const auth = () => window.AuthService;
  const cfg = () => window.SecurityConfig;

  // --- Sanitize string input (XSS defense-in-depth) ---
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&"']/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
    })[c]).trim().slice(0, 2000);
  }

  // --- Verify session is valid ---
  function requireAuth() {
    const a = auth();
    if (!a || !a.isAuthenticated()) {
      throw new Error('AUTH_REQUIRED');
    }
    return a.getUser();
  }

  // --- Verify resource belongs to user ---
  function assertOwnership(record, user) {
    if (!record || record.user_id !== user.id) {
      throw new Error('FORBIDDEN');
    }
  }

  // --- Get user-scoped storage key ---
  function userKey(userId, collection) {
    return `${STORAGE_PREFIX}${userId}_${collection}`;
  }

  // --- Rate limit check before write ---
  function checkRateLimit() {
    const c = cfg();
    if (!c?.RateLimiter) return;
    const check = c.RateLimiter.check('general');
    if (!check.allowed) throw new Error(check.message);
  }

  function recordRateLimit() {
    const c = cfg();
    if (!c?.RateLimiter) return;
    c.RateLimiter.record('general');
  }

  // --- Daily log counter for quotas ---
  function countToday(collection, userId, foreignKeyId) {
    try {
      const raw = localStorage.getItem(userKey(userId, collection));
      const records = JSON.parse(raw) || [];
      const today = new Date().toISOString().slice(0, 10);
      return records.filter(r => {
        const matchesFK = foreignKeyId ? r.reptile_id === foreignKeyId : true;
        const isToday = r.created_at && r.created_at.slice(0, 10) === today;
        return matchesFK && isToday;
      }).length;
    } catch {
      return 0;
    }
  }

  // --- Collections that are daily-logged per animal ---
  const DAILY_LOG_COLLECTIONS = ['weight_logs', 'length_logs', 'feeding_logs', 'shedding_logs', 'climate_logs', 'temperature_logs', 'humidity_logs', 'thermal_incidents', 'brumation_periods'];

  const DataService = {
    sanitize,

    // List all records of a collection for current user
    list(collection) {
      const user = requireAuth();
      try {
        const raw = localStorage.getItem(userKey(user.id, collection));
        const records = JSON.parse(raw) || [];
        return Array.isArray(records) ? records : [];
      } catch {
        return [];
      }
    },

    // Get one record by ID, enforcing ownership
    get(collection, id) {
      const user = requireAuth();
      const records = this.list(collection);
      const record = records.find(r => r.id === id);
      assertOwnership(record, user);
      return record;
    },

    // Create record, auto-assign user_id, enforce quotas
    create(collection, data) {
      const user = requireAuth();
      checkRateLimit();

      const quotas = cfg()?.quotas || {};

      // Quota: max animals per user
      if (collection === 'reptiles') {
        const existing = this.list(collection);
        if (existing.length >= (quotas.maxAnimalsPerUser || 20)) {
          throw new Error('QUOTA_EXCEEDED:maxAnimalsPerUser');
        }
      }

      // Quota: daily logs per animal
      if (DAILY_LOG_COLLECTIONS.includes(collection)) {
        const reptileId = data.reptile_id;
        if (!reptileId) throw new Error('INVALID_PAYLOAD:reptile_id required');
        const dailyCount = countToday(collection, user.id, reptileId);
        if (dailyCount >= (quotas.maxLogsPerAnimalPerDay || 50)) {
          throw new Error('QUOTA_EXCEEDED:maxLogsPerAnimalPerDay');
        }
      }

      // Quota: AI diagnoses per day
      if (collection === 'health_diagnoses') {
        const dailyCount = countToday(collection, user.id);
        if (dailyCount >= (quotas.maxAIDiagnosesPerDay || 5)) {
          throw new Error('QUOTA_EXCEEDED:maxAIDiagnosesPerDay');
        }
      }

      // Validate payload
      if ((collection === 'weight_logs' || collection === 'length_logs') && (typeof data.value !== 'number' || data.value <= 0)) {
        throw new Error('INVALID_PAYLOAD');
      }
      if (collection === 'temperature_logs') {
        if (typeof data.temp_hot !== 'number' || typeof data.temp_cool !== 'number') throw new Error('INVALID_PAYLOAD');
      }
      if (collection === 'humidity_logs') {
        if (typeof data.humidity !== 'number' || data.humidity < 0 || data.humidity > 100) throw new Error('INVALID_PAYLOAD');
      }
      if (collection === 'thermal_incidents') {
        if (!data.incident_type) throw new Error('INVALID_PAYLOAD');
      }
      if (collection === 'brumation_periods') {
        if (!data.start_date) throw new Error('INVALID_PAYLOAD');
      }
      if (collection === 'reptiles') {
        if (!data.name || !data.species) throw new Error('INVALID_PAYLOAD');
      }

      // Sanitize string fields
      const stringFields = ['name', 'notes', 'species', 'morph', 'prey_type', 'symptom_text', 'caption', 'sex', 'enclosure', 'microchip_id', 'status', 'zone', 'unit'];
      stringFields.forEach(f => {
        if (data[f] && typeof data[f] === 'string') data[f] = sanitize(data[f]);
      });

      const now = new Date().toISOString();
      const record = {
        id: window.crypto.randomUUID(),
        user_id: user.id,
        ...data,
        created_at: data.weight_date ? now : now,
        weight_date: data.weight_date || null,
        updated_at: now
      };

      const records = this.list(collection);
      records.push(record);
      localStorage.setItem(userKey(user.id, collection), JSON.stringify(records));

      recordRateLimit();
      return record;
    },

    // Update record, enforcing ownership
    update(collection, id, data) {
      const user = requireAuth();
      checkRateLimit();

      const records = this.list(collection);
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('NOT_FOUND');
      assertOwnership(records[idx], user);

      // Sanitize string fields
      const stringFields = ['name', 'notes', 'species', 'morph', 'prey_type', 'symptom_text', 'caption', 'sex', 'enclosure', 'microchip_id', 'status', 'zone', 'unit'];
      const sanitized = { ...data };
      stringFields.forEach(f => {
        if (sanitized[f] && typeof sanitized[f] === 'string') sanitized[f] = sanitize(sanitized[f]);
      });

      records[idx] = { ...records[idx], ...sanitized, updated_at: new Date().toISOString() };
      localStorage.setItem(userKey(user.id, collection), JSON.stringify(records));

      recordRateLimit();
      return records[idx];
    },

    // Delete record, enforcing ownership
    delete(collection, id) {
      const user = requireAuth();
      checkRateLimit();

      const records = this.list(collection);
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('NOT_FOUND');
      assertOwnership(records[idx], user);

      records.splice(idx, 1);
      localStorage.setItem(userKey(user.id, collection), JSON.stringify(records));

      recordRateLimit();
      return true;
    }
  };

  window.DataService = DataService;
})(window);
