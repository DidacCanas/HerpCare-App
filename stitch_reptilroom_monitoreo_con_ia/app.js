const chips = document.querySelectorAll('.chip');
const points = document.querySelectorAll('.point');
const tooltipDate = document.getElementById('tooltipDate');
const tooltipVal = document.getElementById('tooltipVal');
const tooltipDelta = document.getElementById('tooltipDelta');
const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');
const locationModal = document.getElementById('locationModal');
const locationButton = document.getElementById('locationButton');
const allowLocationButton = document.getElementById('allowLocationButton');
const locationMessage = document.getElementById('locationMessage');
const userLocationStatus = document.getElementById('userLocationStatus');
const installButton = document.getElementById('installButton');
let installPromptEvent;

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
  });
});

points.forEach((point) => {
  point.addEventListener('click', () => {
    points.forEach((item) => item.classList.remove('active'));
    point.classList.add('active');

    const date = point.dataset.date;
    const value = point.dataset.value;
    const delta = point.dataset.delta;

    tooltipDate.textContent = date;
    tooltipVal.textContent = value;
    tooltipDelta.textContent = delta;
  });
});

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((nav) => nav.classList.remove('active'));
    item.classList.add('active');
  });
});

const bottomItems = document.querySelectorAll('.bottom-item');
bottomItems.forEach((item) => {
  item.addEventListener('click', () => {
    bottomItems.forEach((nav) => nav.classList.remove('active'));
    item.classList.add('active');
  });
});

const openModal = (modal) => {
  if (modal) modal.hidden = false;
};

const closeModal = (modal) => {
  if (modal) modal.hidden = true;
};

loginButton?.addEventListener('click', () => {
  openModal(loginModal);
  const clientId = window.HERPCARE_GOOGLE_CLIENT_ID;
  const loginMessage = document.getElementById('loginMessage');
  if (clientId && window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        localStorage.setItem('herpcare_google_credential', response.credential);
        loginMessage.textContent = 'Sesión iniciada correctamente.';
        loginButton.setAttribute('aria-label', 'Sesión iniciada con Google');
      }
    });
    window.google.accounts.id.renderButton(document.getElementById('googleButton'), {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      width: 280
    });
  } else {
    loginMessage.textContent = 'Añade tu Client ID en index.html para activar el acceso con Google.';
  }
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', () => closeModal(document.getElementById(button.dataset.closeModal)));
});

const requestLocation = () => {
  if (!navigator.geolocation) {
    locationMessage.textContent = 'Este navegador no permite obtener la ubicación.';
    return;
  }
  locationMessage.textContent = 'Solicitando permiso de ubicación…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude, longitude } = coords;
      localStorage.setItem('herpcare_location', JSON.stringify({ latitude, longitude }));
      userLocationStatus.textContent = 'Ubicación activa';
      locationMessage.textContent = `Ubicación activa (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
      closeModal(locationModal);
      document.querySelectorAll('.directions-button').forEach((button) => {
        button.addEventListener('click', () => {
          const destination = encodeURIComponent(button.dataset.place);
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}`, '_blank', 'noopener');
        }, { once: true });
      });
    },
    () => {
      locationMessage.textContent = 'No se pudo obtener la ubicación. Puedes intentarlo de nuevo.';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
};

locationButton?.addEventListener('click', () => openModal(locationModal));
allowLocationButton?.addEventListener('click', requestLocation);

if (!localStorage.getItem('herpcare_location')) {
  window.setTimeout(() => openModal(locationModal), 700);
} else {
  userLocationStatus.textContent = 'Ubicación guardada';
  locationMessage.textContent = 'Ubicación guardada en este dispositivo.';
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
