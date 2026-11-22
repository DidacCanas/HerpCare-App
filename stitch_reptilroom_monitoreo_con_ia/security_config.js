/**
 * security_config.js
 * Centralized security configurations and rate limit settings.
 */

(function (global) {
  const SecurityConfig = {
    // Rate Limiting (tiers: milliseconds and attempt thresholds)
    limits: {
      auth: { maxAttempts: 5, windowMs: 5 * 60 * 1000 },
      ai_vision: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
      upload: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
      general: { maxAttempts: 100, windowMs: 60 * 1000 }
    },
    payloads: {
      maxImageSizeBytes: 5 * 1024 * 1024,
      allowedImageTypes: ['image/jpeg', 'image/webp', 'image/png'],
      maxImageWidth: 4096,
      maxImageHeight: 4096,
    },
    quotas: {
      maxAnimalsPerUser: 20,
      maxLogsPerAnimalPerDay: 50,
      maxAIDiagnosesPerDay: 5,
    },

    // General-purpose rate limiter (localStorage-backed)
    RateLimiter: {
      _key: 'herpcare_rate_limits',
      _get() {
        try { return JSON.parse(localStorage.getItem(this._key)) || {}; }
        catch { return {}; }
      },
      _set(records) { localStorage.setItem(this._key, JSON.stringify(records)); },

      check(category) {
        const limits = window.SecurityConfig?.limits?.[category];
        if (!limits) return { allowed: true };
        const records = this._get();
        const entry = records[category];
        if (!entry) return { allowed: true };
        const now = Date.now();
        if (now - entry.windowStart > limits.windowMs) {
          delete records[category];
          this._set(records);
          return { allowed: true };
        }
        if (entry.count >= limits.maxAttempts) {
          const retryMs = limits.windowMs - (now - entry.windowStart);
          return {
            allowed: false,
            retryAfterMs: retryMs,
            message: 'Demasiadas peticiones. Inténtalo en ' + Math.ceil(retryMs / 60000) + ' min.'
          };
        }
        return { allowed: true };
      },

      record(category) {
        const limits = window.SecurityConfig?.limits?.[category];
        if (!limits) return;
        const records = this._get();
        const now = Date.now();
        const entry = records[category] || { count: 0, windowStart: now };
        if (now - entry.windowStart > limits.windowMs) {
          entry.count = 0;
          entry.windowStart = now;
        }
        entry.count++;
        records[category] = entry;
        this._set(records);
      },

      reset(category) {
        const records = this._get();
        delete records[category];
        this._set(records);
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityConfig;
  } else {
    global.SecurityConfig = SecurityConfig;
  }
})(typeof window !== 'undefined' ? window : this);
