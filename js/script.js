
// Dark mode toggle
const darkToggle = document.getElementById("dark-toggle");
if (localStorage.getItem("dark-mode") === "enabled") {
  document.body.classList.add("dark-mode");
  darkToggle.checked = true;
}
darkToggle.addEventListener("change", () => {
  if (darkToggle.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("dark-mode", "enabled");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("dark-mode", "disabled");
  }
});

// FAQ toggle
document.querySelectorAll(".faq-question").forEach(button => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    item.classList.toggle("active");
  });
});
const track = document.getElementById('slider-track');
const slides = track.querySelectorAll('.slider-img');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('slider-dots');
const wrapper = document.querySelector('.slider-wrapper');
let index = 0;
let interval;
let startX = 0;

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

const dots = dotsContainer.querySelectorAll('span');

function updateSlider() {
  track.style.transform = `translateX(${-index * 100}%)`;
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
}

function nextSlide() {
  index = (index + 1) % slides.length;
  updateSlider();
}

function prevSlide() {
  index = (index - 1 + slides.length) % slides.length;
  updateSlider();
}

function startAutoSlide() {
  interval = setInterval(nextSlide, 3000);
}

function stopAutoSlide() {
  clearInterval(interval);
}

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
