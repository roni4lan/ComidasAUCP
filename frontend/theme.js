// Immediately apply saved theme to avoid screen flash during load (ES5 Smart TV compatible)
(function() {
  var savedTheme = localStorage.getItem('aucp-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

// Expose global toggleTheme function
function toggleTheme() {
  var html = document.documentElement;
  var actual = html.getAttribute('data-theme');
  var nuevo = actual === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nuevo);
  localStorage.setItem('aucp-theme', nuevo);
  
  // Safely dispatch a global event so other components (like Chart.js charts) can react
  try {
    var event;
    if (typeof Event === 'function') {
      event = new Event('themechange');
    } else {
      event = document.createEvent('Event');
      event.initEvent('themechange', true, true);
    }
    window.dispatchEvent(event);
  } catch (e) {
    // Ignore fail on very old environments
  }
}
