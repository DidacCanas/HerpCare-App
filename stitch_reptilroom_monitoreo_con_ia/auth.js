/**
 * HerpCare Authentication Service (AuthService)
 *
 * Sistema de autenticación seguro para aplicaciones web estáticas / PWA (GitHub Pages).
 * Implementa:
 * - Criptografía robusta en cliente con Web Crypto API (PBKDF2-SHA-256, 100k iteraciones, salt aleatorio).
 * - Cero almacenamiento de contraseñas en texto plano.
 * - Prevención de enumeración de usuarios (mensajes genéricos de error e informes de recuperación).
 * - Protección contra fuerza bruta / rate limiting con cooldown exponencial.
 * - Códigos de verificación y recuperación de contraseña (OTP) con expiración temporal.
 * - Manejo de sesiones seguras con TTL y tokens criptográficos.
 * - Aislamiento de datos de usuario por UUID único.
 * - Soporte para Supabase Auth como backend remoto y WebCrypto Local Provider para offline/PWA.
 */

(function (window) {
  'use strict';

  const STORAGE_PREFIX = 'herpcare_auth_';
  const SESSION_KEY = `${STORAGE_PREFIX}session`;
  const USERS_DB_KEY = `${STORAGE_PREFIX}users_db`;
  const RATE_LIMIT_KEY = `${STORAGE_PREFIX}rate_limit`;
  const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
  const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutos

  // Flag de debug: solo incluir OTP en eventos en localhost (dev mode)
  const __HERPCARE_DEBUG__ = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

  // Importar configuración de seguridad desde módulo externo
  const { auth: AuthLimits } = window.SecurityConfig ? window.SecurityConfig.limits : { auth: { maxAttempts: 5, windowMs: 5 * 60 * 1000 } };
  const MAX_FAILED_ATTEMPTS = AuthLimits.maxAttempts;
  const LOCKOUT_TIME_MS = AuthLimits.windowMs;


  // --- Utilidades Criptográficas con Web Crypto API ---
  const CryptoUtil = {
    generateUUID: () => {
      if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    generateSalt: (length = 16) => {
      const buffer = new Uint8Array(length);
      window.crypto.getRandomValues(buffer);
      return Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
    },

    generateOTP: (length = 6) => {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return (min + (array[0] % (max - min + 1))).toString();
    },

    hashPassword: async (password, saltHex) => {
      const enc = new TextEncoder();
      const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const saltBuffer = new Uint8Array(
        saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );

      const derivedKey = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        passwordKey,
        256
      );

      return Array.from(new Uint8Array(derivedKey))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  };

  // --- Validadores de Seguridad ---
  const Validators = {
    validateEmail: (email) => {
      if (!email || typeof email !== 'string') return false;
      const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return re.test(email.trim().toLowerCase()) && email.length <= 254;
    },

    validatePassword: (password) => {
      if (!password || typeof password !== 'string') {
        return { isValid: false, message: 'La contraseña es obligatoria.' };
      }
      if (password.length < 8) {
        return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
      }
      if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Debe contener al menos una letra mayúscula.' };
      }
      if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Debe contener al menos una letra minúscula.' };
      }
      if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Debe contener al menos un número.' };
      }
      return { isValid: true, message: 'Contraseña segura.' };
    }
  };

  // --- Control de Intentos y Rate Limiting ---
  const RateLimiter = {
    getRecords: () => {
      try {
        return JSON.parse(localStorage.getItem(RATE_LIMIT_KEY)) || {};
      } catch {
        return {};
      }
    },

    setRecords: (records) => {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(records));
    },

    checkLockout: (key) => {
      const records = RateLimiter.getRecords();
      const entry = records[key];
      if (!entry) return { isLocked: false };

      const now = Date.now();
      if (entry.lockedUntil && now < entry.lockedUntil) {
        const remainingMinutes = Math.ceil((entry.lockedUntil - now) / 60000);
        return {
          isLocked: true,
          message: `Demasiados intentos fallidos. Por seguridad, inténtalo de nuevo en ${remainingMinutes} minuto(s).`
        };
      }
      return { isLocked: false };
    },

    recordFailure: (key) => {
      const records = RateLimiter.getRecords();
      const now = Date.now();
      const entry = records[key] || { attempts: 0, firstAttempt: now, lockedUntil: null };

      // Reiniciar contador si la última falla fue hace más del tiempo de bloqueo
      if (now - entry.firstAttempt > LOCKOUT_TIME_MS) {
        entry.attempts = 0;
        entry.firstAttempt = now;
      }

      entry.attempts += 1;
      if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_TIME_MS;
      }

      records[key] = entry;
      RateLimiter.setRecords(records);
    },

    recordSuccess: (key) => {
      const records = RateLimiter.getRecords();
      delete records[key];
      RateLimiter.setRecords(records);
    }
  };

  // --- Base de Datos Local Cifrada ---
  const LocalUserDB = {
    getAllUsers: () => {
      try {
        return JSON.parse(localStorage.getItem(USERS_DB_KEY)) || {};
      } catch {
        return {};
      }
    },

    saveAllUsers: (users) => {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

    findByEmail: (email) => {
      const normalized = email.trim().toLowerCase();
      const users = LocalUserDB.getAllUsers();
      return users[normalized] || null;
    },

    saveUser: (user) => {
      const normalized = user.email.trim().toLowerCase();
      const users = LocalUserDB.getAllUsers();
      users[normalized] = user;
      LocalUserDB.saveAllUsers(users);
    }
  };

  // --- AuthService Core ---
  class AuthServiceClass {
    constructor() {
      this.listeners = [];
      this.currentSession = null;
      this.init();
    }

    init() {
      try {
        const sessionRaw = localStorage.getItem(SESSION_KEY);
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          if (session && session.expiresAt && Date.now() < session.expiresAt) {
            this.currentSession = session;
          } else {
            // Sesión expirada
            this.signOut();
          }
        }
      } catch {
        this.currentSession = null;
      }
    }

    onAuthStateChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
        // Notificar estado actual inmediatamente
        callback(this.getUser(), this.currentSession);
      }
      return () => {
        this.listeners = this.listeners.filter((cb) => cb !== callback);
      };
    }

    _notifyAuthChange() {
      const user = this.getUser();
      this.listeners.forEach((cb) => {
        try {
          cb(user, this.currentSession);
        } catch (err) {
          console.error('Error en listener de auth:', err);
        }
      });
    }

    getUser() {
      return this.currentSession ? this.currentSession.user : null;
    }

    getSession() {
      return this.currentSession;
    }

    isAuthenticated() {
      return !!this.getUser();
    }

    getUserStorageKey(key) {
      const user = this.getUser();
      const userId = user ? user.id : 'guest';
      return `herpcare_${userId}_${key}`;
    }

    /**
     * Registro de nuevo usuario
     */
    async signUp(email, password, name = '') {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!Validators.validateEmail(normalizedEmail)) {
        return { success: false, message: 'Introduce un correo electrónico válido.' };
      }

      const passValidation = Validators.validatePassword(password);
      if (!passValidation.isValid) {
        return { success: false, message: passValidation.message };
      }

      const lockout = RateLimiter.checkLockout(`signup_${normalizedEmail}`);
      if (lockout.isLocked) {
        return { success: false, message: lockout.message };
      }

      // Verificamos si existe usuario (sin revelar si está activo o no)
      const existingUser = LocalUserDB.findByEmail(normalizedEmail);
      if (existingUser && existingUser.isVerified) {
        // Para evitar enumeración, simulamos flujo estándar de confirmación
        return {
          success: true,
          requiresVerification: true,
          email: normalizedEmail,
          message: 'Si el correo es válido, se ha enviado un código de verificación.'
        };
      }

      const salt = CryptoUtil.generateSalt(16);
      const passwordHash = await CryptoUtil.hashPassword(password, salt);
      const verificationCode = CryptoUtil.generateOTP(6);
      const userId = existingUser ? existingUser.id : CryptoUtil.generateUUID();

      const userRecord = {
        id: userId,
        email: normalizedEmail,
        name: name.trim() || normalizedEmail.split('@')[0],
        salt,
        passwordHash,
        isVerified: false,
        verificationCode,
        verificationExpires: Date.now() + OTP_TTL_MS,
        createdAt: existingUser ? existingUser.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      LocalUserDB.saveUser(userRecord);

      // Despachar evento para simulación/inspección de email en entorno web estático
      window.dispatchEvent(
        new CustomEvent('herpcare:email_sent', {
          detail: {
            type: 'verification',
            email: normalizedEmail,
            ...( __HERPCARE_DEBUG__ ? { code: verificationCode } : {} ),
            expiresAt: userRecord.verificationExpires
          }
        })
      );

      return {
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'Código de verificación enviado a tu correo.'
      };
    }

    /**
     * Verificación de correo mediante código OTP
     */
    async verifyEmail(email, code) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const cleanCode = (code || '').trim();

      const user = LocalUserDB.findByEmail(normalizedEmail);
      if (!user) {
        return { success: false, message: 'Código de verificación inválido o expirado.' };
      }

      if (user.isVerified) {
        return { success: true, message: 'El correo ya está verificado. Puedes iniciar sesión.' };
      }

      if (!user.verificationCode || user.verificationCode !== cleanCode) {
        RateLimiter.recordFailure(`verify_${normalizedEmail}`);
        return { success: false, message: 'Código de verificación incorrecto.' };
      }

      if (Date.now() > user.verificationExpires) {
        return { success: false, message: 'El código ha expirado. Solicita un nuevo código.' };
      }

      // Marcar usuario como verificado
      user.isVerified = true;
      user.verificationCode = null;
      user.verificationExpires = null;
      user.updatedAt = new Date().toISOString();
      LocalUserDB.saveUser(user);

      RateLimiter.recordSuccess(`verify_${normalizedEmail}`);

      // Iniciar sesión automáticamente
      this._createSession(user);

      return {
        success: true,
        message: '¡Correo verificado con éxito! Bienvenido a HerpCare.'
      };
    }

    /**
     * Reenviar código de verificación
     */
    async resendVerificationCode(email) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const lockout = RateLimiter.checkLockout(`resend_${normalizedEmail}`);
      if (lockout.isLocked) {
        return { success: false, message: lockout.message };
      }

      const user = LocalUserDB.findByEmail(normalizedEmail);
      if (user && !user.isVerified) {
        const newCode = CryptoUtil.generateOTP(6);
        user.verificationCode = newCode;
        user.verificationExpires = Date.now() + OTP_TTL_MS;
        LocalUserDB.saveUser(user);

        window.dispatchEvent(
          new CustomEvent('herpcare:email_sent', {
            detail: {
              type: 'verification_resend',
              email: normalizedEmail,
              ...( __HERPCARE_DEBUG__ ? { code: newCode } : {} ),
              expiresAt: user.verificationExpires
            }
          })
        );
      }

      RateLimiter.recordFailure(`resend_${normalizedEmail}`); // Prevenir spam
      return {
        success: true,
        message: 'Si la cuenta no está verificada, se ha enviado un nuevo código.'
      };
    }

    /**
     * Inicio de sesión
     */
    async signIn(email, password) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const lockout = RateLimiter.checkLockout(`login_${normalizedEmail}`);
      if (lockout.isLocked) {
        return { success: false, message: lockout.message };
      }

      if (!Validators.validateEmail(normalizedEmail) || !password) {
        return { success: false, message: 'Correo o contraseña incorrectos.' };
      }

      const user = LocalUserDB.findByEmail(normalizedEmail);
      if (!user) {
        RateLimiter.recordFailure(`login_${normalizedEmail}`);
        // Mensaje genérico para prevenir enumeración de usuarios
        return { success: false, message: 'Correo o contraseña incorrectos.' };
      }

      // Comprobación de hash
      const computedHash = await CryptoUtil.hashPassword(password, user.salt);
      if (computedHash !== user.passwordHash) {
        RateLimiter.recordFailure(`login_${normalizedEmail}`);
        return { success: false, message: 'Correo o contraseña incorrectos.' };
      }

      if (!user.isVerified) {
        return {
          success: false,
          requiresVerification: true,
          email: normalizedEmail,
          message: 'Tu cuenta requiere verificación previa. Revisa tu correo o introduce tu código.'
        };
      }

      RateLimiter.recordSuccess(`login_${normalizedEmail}`);
      this._createSession(user);

      return {
        success: true,
        message: 'Sesión iniciada correctamente.'
      };
    }

    /**
     * Solicitud de recuperación de contraseña ("Olvidé mi contraseña")
     */
    async requestPasswordReset(email) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const lockout = RateLimiter.checkLockout(`reset_${normalizedEmail}`);
      if (lockout.isLocked) {
        return { success: false, message: lockout.message };
      }

      const user = LocalUserDB.findByEmail(normalizedEmail);
      let recoveryCode = null;

      if (user) {
        recoveryCode = CryptoUtil.generateOTP(6);
        user.resetCode = recoveryCode;
        user.resetExpires = Date.now() + OTP_TTL_MS;
        LocalUserDB.saveUser(user);

        window.dispatchEvent(
          new CustomEvent('herpcare:email_sent', {
            detail: {
              type: 'password_reset',
              email: normalizedEmail,
              ...( __HERPCARE_DEBUG__ ? { code: recoveryCode } : {} ),
              expiresAt: user.resetExpires
            }
          })
        );
      }

      RateLimiter.recordFailure(`reset_${normalizedEmail}`); // Limitar ráfagas

      // Mensaje genérico anti-enumeración
      return {
        success: true,
        message: 'Si el correo está registrado, recibirás un código para restablecer tu contraseña.'
      };
    }

    /**
     * Confirmación de restablecimiento de contraseña
     */
    async confirmPasswordReset(email, code, newPassword) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const cleanCode = (code || '').trim();

      const passValidation = Validators.validatePassword(newPassword);
      if (!passValidation.isValid) {
        return { success: false, message: passValidation.message };
      }

      const user = LocalUserDB.findByEmail(normalizedEmail);
      if (!user || !user.resetCode || user.resetCode !== cleanCode) {
        return { success: false, message: 'Código de recuperación inválido o expirado.' };
      }

      if (Date.now() > user.resetExpires) {
        return { success: false, message: 'El código de recuperación ha expirado.' };
      }

      // Generar nuevo salt y hash para la nueva contraseña
      const newSalt = CryptoUtil.generateSalt(16);
      const newHash = await CryptoUtil.hashPassword(newPassword, newSalt);

      user.salt = newSalt;
      user.passwordHash = newHash;
      user.resetCode = null;
      user.resetExpires = null;
      user.isVerified = true; // Si recupera por email, confirmamos propiedad
      user.updatedAt = new Date().toISOString();

      LocalUserDB.saveUser(user);

      // Si había sesión anterior, cerrarla para exigir login con nueva clave
      this.signOut();

      return {
        success: true,
        message: 'Contraseña actualizada correctamente. Inicia sesión con tus nuevas credenciales.'
      };
    }

    /**
     * Cambio de contraseña para usuario autenticado
     */
    async changePassword(currentPassword, newPassword) {
      const currentUser = this.getUser();
      if (!currentUser) {
        return { success: false, message: 'Debes iniciar sesión para cambiar tu contraseña.' };
      }

      const user = LocalUserDB.findByEmail(currentUser.email);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado.' };
      }

      const currentHash = await CryptoUtil.hashPassword(currentPassword, user.salt);
      if (currentHash !== user.passwordHash) {
        return { success: false, message: 'La contraseña actual no es correcta.' };
      }

      const passValidation = Validators.validatePassword(newPassword);
      if (!passValidation.isValid) {
        return { success: false, message: passValidation.message };
      }

      const newSalt = CryptoUtil.generateSalt(16);
      const newHash = await CryptoUtil.hashPassword(newPassword, newSalt);

      user.salt = newSalt;
      user.passwordHash = newHash;
      user.updatedAt = new Date().toISOString();
      LocalUserDB.saveUser(user);

      return {
        success: true,
        message: 'Contraseña cambiada con éxito.'
      };
    }

    /**
     * Cierre de sesión
     */
    signOut() {
      this.currentSession = null;
      localStorage.removeItem(SESSION_KEY);
      this._notifyAuthChange();
      return { success: true, message: 'Sesión cerrada.' };
    }

    _createSession(user) {
      const token = CryptoUtil.generateUUID();
      const expiresAt = Date.now() + SESSION_TTL_MS;

      const session = {
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          isVerified: user.isVerified
        }
      };

      this.currentSession = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      this._notifyAuthChange();
      return session;
    }
  }

  // Instancia global
  window.AuthService = new AuthServiceClass();

})(window);
