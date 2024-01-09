export const showAlert = (type, msg, time = 2500) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document
    .querySelector('body')
    .insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time);
};

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
