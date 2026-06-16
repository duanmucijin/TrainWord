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
    var isMobile = /iphone|ipad|ipod|android|mobile/.test(ua);

    if (isWeChat) {
        var mask = document.getElementById("wx-mask");
        if (mask) {
            mask.style.display = "flex";
            mask.classList.toggle("wx-mobile", isMobile);
            mask.classList.toggle("wx-desktop", !isMobile);
        }
    }
});

function closeMask() {
    var mask = document.getElementById("wx-mask");
    if (mask) {
        mask.style.display = "none";
    }
}

function copyPageLink() {
    var url = window.location.href;
    var tip = document.getElementById("wx-copy-tip");
    var done = function () {
        if (!tip) return;
        tip.classList.add("active");
        window.setTimeout(function () {
            tip.classList.remove("active");
        }, 1600);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function () {
            fallbackCopy(url, done);
        });
        return;
    }

    fallbackCopy(url, done);
}

function fallbackCopy(text, done) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand("copy");
        done();
    } catch (error) {
        window.prompt("复制链接后在浏览器中打开", text);
    }
    document.body.removeChild(textarea);
}
