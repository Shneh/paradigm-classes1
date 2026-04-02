
document.querySelectorAll(".faq-question").forEach(button => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    item.classList.toggle("active");
  });
});
const track = document.getElementById('slider-track');
const slides = track ? track.querySelectorAll('.slider-img') : [];
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('slider-dots');
const wrapper = document.querySelector('.slider-wrapper');
let index = 0;
let interval;
let startX = 0;

let dots = [];
if (track && dotsContainer && slides.length) {
  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
    dot.addEventListener('click', () => {
      index = i;
      updateSlider();
    });
  });

  dots = dotsContainer.querySelectorAll('span');
}


function updateSlider() {
  if (!track || !dots.length) return;
  track.style.transform = `translateX(${-index * 100}%)`;
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
}

function nextSlide() {
  if (!slides.length) return;
  index = (index + 1) % slides.length;
  updateSlider();
}

function prevSlide() {
  if (!slides.length) return;
  index = (index - 1 + slides.length) % slides.length;
  updateSlider();
}

function startAutoSlide() {
  if (!slides.length) return;
  interval = setInterval(nextSlide, 3000);
}

function stopAutoSlide() {
  clearInterval(interval);
}

if (nextBtn && prevBtn && wrapper && slides.length) {
  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);
  wrapper.addEventListener('mouseenter', stopAutoSlide);
  wrapper.addEventListener('mouseleave', startAutoSlide);

  // Touch support
  wrapper.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  wrapper.addEventListener('touchend', e => {
    let endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) nextSlide();
    else if (endX - startX > 50) prevSlide();
  });

  startAutoSlide();
}

document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const data = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        alert("🎉 Thanks! Your demo class is booked. We’ll contact you soon.");
        form.reset();
      } else {
        alert("❌ Oops! Something went wrong. Try again later.");
      }
    });
  });
});

const gallery = document.querySelector('.gallery');
if (gallery) {
  gallery.addEventListener('wheel', (e) => {
    e.preventDefault();
    gallery.scrollLeft += e.deltaY;
  });
}

// Mobile nav menu toggle (supports any page with this structure)
document.querySelectorAll('.mobile-menu-toggle').forEach(toggle => {
  const nav = toggle.closest('.navbar');
  const menu = nav ? nav.querySelector('.mobile-menu') : document.getElementById('mobileMenu');

  if (!menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
    });
  });
});