$(document).ready(function() {
  $('#fullpage').fullpage({
    anchors: ['index', 'skills', 'expirience', 'projects'],
    sectionSelector: '.vertical-scrolling',
    css3: true,
    scrollingSpeed: 800,
  });
});
