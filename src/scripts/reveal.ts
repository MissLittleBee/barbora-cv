const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.2 }
);

const init = () => {
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
};

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
