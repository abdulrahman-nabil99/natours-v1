import { login, logout } from './login.js';
import { displayMap } from './mapBox.js';
import { updateSettings } from './updateSettings.js';
import { bookTour } from './stripe.js';
import { showAlert } from './alerts.js';

const loginForm = document.querySelector('.form--login');
const mapElement = document.getElementById('map');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector(
  '.form-user-password',
);
const bookBtn = document.getElementById('book-tour');

if (mapElement) {
  const locations = JSON.parse(mapElement.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateForm) {
  updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent =
      'Updating...';
    const password = document.getElementById(
      'password-current',
    ).value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm = document.getElementById(
      'password-confirm',
    ).value;
    await updateSettings(
      { password, newPassword, newPasswordConfirm },
      'password',
    );
    document.querySelector('.btn--save--password').textContent =
      'Save Password';
    document.getElementById('password-current').value =
      document.getElementById('password').value =
      document.getElementById('password-confirm').value =
        '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'redirecting...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alert) showAlert('success', alertMessage, 5000);
