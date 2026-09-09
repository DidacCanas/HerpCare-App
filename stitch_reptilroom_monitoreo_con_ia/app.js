const chips = document.querySelectorAll('.chip');
const points = document.querySelectorAll('.point');
const tooltipDate = document.getElementById('tooltipDate');
const tooltipVal = document.getElementById('tooltipVal');
const tooltipDelta = document.getElementById('tooltipDelta');

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
