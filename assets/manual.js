// 현재 보고 있는 장을 목차에 표시
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.tabnav a'));
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('section.chap').forEach(function (s) { io.observe(s); });
})();
