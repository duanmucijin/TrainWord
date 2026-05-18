const items = document.querySelectorAll('.reveal');

function reveal() {
  items.forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 100) {
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', reveal);
reveal();

document.addEventListener("DOMContentLoaded", function () {

    var ua = navigator.userAgent.toLowerCase();

    var isWeChat = ua.indexOf("micromessenger") !== -1;

    if (isWeChat) {
        var mask = document.getElementById("wx-mask");
        if (mask) {
            mask.style.display = "flex";
        }
    }
});

function closeMask() {
    var mask = document.getElementById("wx-mask");
    if (mask) {
        mask.style.display = "none";
    }
}