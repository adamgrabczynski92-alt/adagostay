
// === MICRO ANIMATIONS: scroll reveal ===
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window) || els.length === 0) {
    // Fallback: just show elements
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15});
  els.forEach(el => io.observe(el));
})();
