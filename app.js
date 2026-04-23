document.getElementById("demoBtn").addEventListener("click", () => {
  const core = document.querySelector(".train-core");

  core.style.transform = "scale(1.15)";
  core.style.boxShadow = "0 0 80px rgba(34,197,94,0.6)";

  setTimeout(() => {
    core.style.transform = "scale(1)";
    core.style.boxShadow = "0 0 40px rgba(34,197,94,0.4)";
  }, 250);
});