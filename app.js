(function () {
  'use strict';

  var PAGE_DURATION = 500;

  /* =========================================
     NAVIGATION & ROUTING
     ========================================= */
  var navLinks = document.querySelectorAll('.nav-link');
  var isTransitioning = false;

  function getPageIdFromHash() {
    var hash = window.location.hash.replace('#', '') || 'home';
    return hash;
  }

  function updateNav(activeId) {
    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.getAttribute('data-page') === activeId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  }

  function navigateTo(pageId) {
    if (isTransitioning) return;

    var current = document.querySelector('.page.active');
    var next = document.getElementById('page-' + pageId);

    if (!next || next === current) return;

    isTransitioning = true;
    updateNav(pageId);

    /* Reset hero animations for pages with fade-in */
    if (pageId === 'home' || pageId === 'series') {
      var animatedEls = next.querySelectorAll('.hero-title, .hero-subtitle, .btn-hero, .hero-series-link, .series-hero-title, .series-hero-desc');
      for (var i = 0; i < animatedEls.length; i++) {
        animatedEls[i].style.opacity = '0';
        animatedEls[i].style.transform = 'translateY(12px)';
      }
    }

    if (current) {
      current.classList.remove('active');

      next.style.position = 'absolute';
      next.style.top = '0';
      next.style.left = '0';
      next.style.width = '100%';
      next.style.minHeight = '100vh';
      next.style.opacity = '0';
      next.style.pointerEvents = 'none';
      next.style.zIndex = '1';

      current.style.position = 'absolute';
      current.style.top = '0';
      current.style.left = '0';
      current.style.width = '100%';
      current.style.minHeight = '100vh';
      current.style.opacity = '1';
      current.style.pointerEvents = 'none';
      current.style.zIndex = '2';

      void current.offsetHeight;

      current.style.transition = 'opacity ' + PAGE_DURATION + 'ms ease';
      next.style.transition = 'opacity ' + PAGE_DURATION + 'ms ease';

      requestAnimationFrame(function () {
        current.style.opacity = '0';
        next.style.opacity = '1';
      });

      setTimeout(function () {
        current.style.position = '';
        current.style.top = '';
        current.style.left = '';
        current.style.width = '';
        current.style.minHeight = '';
        current.style.opacity = '';
        current.style.pointerEvents = '';
        current.style.transition = '';
        current.style.zIndex = '';

        next.style.position = '';
        next.style.top = '';
        next.style.left = '';
        next.style.width = '';
        next.style.minHeight = '';
        next.style.opacity = '';
        next.style.pointerEvents = '';
        next.style.transition = '';
        next.style.zIndex = '';

        /* Clear hero inline styles so CSS animation can take over */
        var animatedEls = next.querySelectorAll('.hero-title, .hero-subtitle, .btn-hero, .hero-series-link, .series-hero-title, .series-hero-desc');
        for (var i = 0; i < animatedEls.length; i++) {
          animatedEls[i].style.opacity = '';
          animatedEls[i].style.transform = '';
        }

        next.classList.add('active');
        activatePageObservers(pageId);

        isTransitioning = false;
      }, PAGE_DURATION + 30);
    } else {
      next.classList.add('active');
      activatePageObservers(pageId);
      isTransitioning = false;
    }
  }

  function handleNavClick(e) {
    var link = e.currentTarget;
    var pageId = link.getAttribute('data-page');
    window.location.hash = '#' + pageId;
    e.preventDefault();
  }

  function handleHashChange() {
    var pageId = getPageIdFromHash();
    var activePage = document.querySelector('.page.active');
    if (activePage && activePage.id !== 'page-' + pageId) {
      navigateTo(pageId);
    }
  }

  function initNav() {
    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', handleNavClick);
    }
  }

  window.addEventListener('hashchange', handleHashChange);

  var initialHash = getPageIdFromHash();
  if (initialHash !== 'home') {
    var homePage = document.getElementById('page-home');
    var targetPage = document.getElementById('page-' + initialHash);
    if (homePage && targetPage) {
      homePage.classList.remove('active');
      homePage.style.display = 'none';
      targetPage.classList.add('active');
      updateNav(initialHash);
    }
  }

  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#home';
  }

  /* =========================================
     MOUSE PARALLAX — home page only
     ========================================= */
  var parallaxContainer = document.getElementById('page-container');
  var parallaxX = 0;
  var parallaxY = 0;
  var targetX = 0;
  var targetY = 0;

  function isHomeActive() {
    var home = document.getElementById('page-home');
    return home && home.classList.contains('active');
  }

  function updateParallax() {
    var active = isHomeActive();
    if (active) {
      parallaxX += (targetX - parallaxX) * 0.05;
      parallaxY += (targetY - parallaxY) * 0.05;
    } else {
      parallaxX += (0 - parallaxX) * 0.06;
      parallaxY += (0 - parallaxY) * 0.06;
    }

    var maxShift = Math.min(window.innerWidth, 1200) * 0.008;
    var tx = parallaxX * maxShift;
    var ty = parallaxY * maxShift * 0.6;
    parallaxContainer.style.transform = 'translate(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2) + 'px)';

    requestAnimationFrame(updateParallax);
  }

  document.addEventListener('mousemove', function (e) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    targetX = ((e.clientX / vw) - 0.5) * 2;
    targetY = ((e.clientY / vh) - 0.5) * 2;
  });

  document.addEventListener('mouseleave', function () {
    targetX = 0;
    targetY = 0;
  });

  requestAnimationFrame(updateParallax);

  /* =========================================
     TIMELINE: SCROLL FADE-IN + EXPAND + LIGHTBOX
     ========================================= */
  function initTimeline() {
    var entries = document.querySelectorAll('.tl-entry');
    var tl = document.querySelector('.tl');

    /* Scroll fade-in — observer only active when page is visible */
    function setupTimelineObserver() {
      var entries = document.querySelectorAll('.tl-entry');
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              entries[i].target.classList.add('tl-visible');
              observer.unobserve(entries[i].target);
            }
          }
        }, { threshold: 0.08 });
        for (var i = 0; i < entries.length; i++) {
          observer.observe(entries[i]);
        }
      } else {
        for (var i = 0; i < entries.length; i++) {
          entries[i].classList.add('tl-visible');
        }
      }
    }

    /* Lightbox references */
    var lightbox = document.getElementById('tl-lightbox');
    var lightboxImg = lightbox ? lightbox.querySelector('.tl-lightbox-img') : null;
    var lightboxPrev = lightbox ? lightbox.querySelector('.tl-lightbox-prev') : null;
    var lightboxNext = lightbox ? lightbox.querySelector('.tl-lightbox-next') : null;
    var tlImages = [];
    var currentImageIndex = -1;

    function collectImages() {
      tlImages = [];
      var allImages = tl.querySelectorAll('.tl-entry-image img');
      for (var i = 0; i < allImages.length; i++) {
        tlImages.push(allImages[i]);
      }
    }

    function openLightbox(img) {
      if (!img || !lightbox || !lightboxImg) return;
      collectImages();
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      currentImageIndex = -1;
      for (var i = 0; i < tlImages.length; i++) {
        if (tlImages[i].src === img.src) {
          currentImageIndex = i;
          break;
        }
      }
      lightbox.classList.add('tl-lightbox--open');
      document.body.style.overflow = 'hidden';
    }

    function navigateLightbox(direction) {
      if (currentImageIndex < 0 || tlImages.length === 0) return;
      currentImageIndex = (currentImageIndex + direction + tlImages.length) % tlImages.length;
      var img = tlImages[currentImageIndex];
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('tl-lightbox--open');
      document.body.style.overflow = '';
      currentImageIndex = -1;
    }

    /* Click handler */
    if (tl) {
      tl.addEventListener('click', function (e) {
        var entry = e.target.closest('.tl-entry');
        if (!entry) return;

        var img = e.target.closest('img');
        if (img) {
          var inImage = img.closest('.tl-entry-image');
          if (inImage) {
            openLightbox(img);
            return;
          }
        }

        var body = entry.querySelector('.tl-entry-body');
        if (body && body.contains(e.target)) {
          var isOpening = !entry.classList.contains('tl-open');
          var open = tl.querySelector('.tl-entry.tl-open');
          if (open && open !== entry) {
            open.classList.remove('tl-open');
          }
          if (isOpening) {
            entry.classList.add('tl-open');
          }
        }
      });
    }

    /* Lightbox navigation */
    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        navigateLightbox(-1);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener('click', function (e) {
        e.stopPropagation();
        navigateLightbox(1);
      });
    }

    /* Lightbox close */
    var lightboxClose = lightbox ? lightbox.querySelector('.tl-lightbox-close') : null;

    if (lightboxClose) {
      lightboxClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
      });
    }

    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    return setupTimelineObserver;
  }

  /* =========================================
     ARTICLE: TOC + SCROLL ANIMATIONS
     ========================================= */
  function initArticle() {
    var links = document.querySelectorAll('.toc-link');
    var sections = [];
    var articlePage = document.getElementById('page-article-vhs');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href) {
        var section = document.getElementById(href.replace('#', ''));
        if (section) sections.push({ link: links[i], section: section });
      }
    }

    function updateToc() {
      if (!articlePage) return;
      var scrollY = articlePage.scrollTop;
      var activeIndex = -1;
      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].section.getBoundingClientRect();
        if (rect.top <= 200) {
          activeIndex = i;
        }
      }
      for (var i = 0; i < sections.length; i++) {
        if (i === activeIndex) {
          sections[i].link.classList.add('toc-active');
        } else {
          sections[i].link.classList.remove('toc-active');
        }
      }
    }

    if (articlePage) {
      articlePage.addEventListener('scroll', updateToc);
    }

    /* Smooth scroll for TOC links */
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        if (!href) return;
        var target = document.getElementById(href.replace('#', ''));
        if (target && articlePage) {
          var top = target.getBoundingClientRect().top + articlePage.scrollTop - 60;
          articlePage.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    }

    /* Section fade-in — setup observer */
    function setupArticleObserver() {
      var sectionEls = document.querySelectorAll('.article-section');
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              entries[i].target.classList.add('section-visible');
              obs.unobserve(entries[i].target);
            }
          }
        }, { threshold: 0.1 });
        for (var i = 0; i < sectionEls.length; i++) {
          obs.observe(sectionEls[i]);
        }
      } else {
        for (var i = 0; i < sectionEls.length; i++) {
          sectionEls[i].classList.add('section-visible');
        }
      }
      setTimeout(updateToc, 100);
    }

    return setupArticleObserver;
  }

  /* =========================================
     ABOUT: SCROLL ANIMATIONS
     ========================================= */
  function initAbout() {
    function setupAboutObserver() {
      var modules = document.querySelectorAll('.about-module');
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              entries[i].target.classList.add('section-visible');
              obs.unobserve(entries[i].target);
            }
          }
        }, { threshold: 0.15 });
        for (var i = 0; i < modules.length; i++) {
          obs.observe(modules[i]);
        }
      } else {
        for (var i = 0; i < modules.length; i++) {
          modules[i].classList.add('section-visible');
        }
      }
    }
    return setupAboutObserver;
  }

  /* =========================================
     PAGE ACTIVATION — lazy init observers
     ========================================= */
  var pageObservers = {};

  function activatePageObservers(pageId) {
    if (pageObservers[pageId]) {
      pageObservers[pageId]();
    }
  }

  /* =========================================
     BOOTSTRAP
     ========================================= */
  initNav();

  var setupTimeline = initTimeline();
  pageObservers.timeline = setupTimeline;

  var setupArticle = initArticle();
  pageObservers['article-vhs'] = setupArticle;

  var setupAbout = initAbout();
  pageObservers.about = setupAbout;

  var currentId = getPageIdFromHash();
  if (currentId !== 'home' && document.getElementById('page-' + currentId)) {
    updateNav(currentId);
    activatePageObservers(currentId);
  }

})();
