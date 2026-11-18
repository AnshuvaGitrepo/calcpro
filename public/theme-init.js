try {
  var t = localStorage.getItem("calc-theme");
  document.documentElement.setAttribute("data-theme", t === "light" || t === "ocean" ? t : "dark");
} catch { /* storage blocked: keep the default dark theme */ }
