(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Mobil hamburger menü
  ------------------------------------------------------------------ */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var drawer = document.getElementById('mobileDrawer');
  var drawerCloseBtn = document.getElementById('drawerCloseBtn');
  var backdrop = document.getElementById('backdrop');
  var lastFocusedEl = null;

  function openDrawer() {
    lastFocusedEl = document.activeElement;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-visible');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    drawerCloseBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocusedEl) { lastFocusedEl.focus(); }
  }

  if (hamburgerBtn && drawer) {
    hamburgerBtn.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('is-open');
      if (isOpen) { closeDrawer(); } else { openDrawer(); }
    });
    drawerCloseBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  /* ------------------------------------------------------------------
     Smooth scroll a fix fejléc magasságának figyelembevételével
  ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');

  function getHeaderOffset() {
    return header ? header.offsetHeight + 12 : 0;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') { return; }
      var target = document.querySelector(targetId);
      if (!target) { return; }
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.pushState(null, '', targetId);
    });
  });

  /* ------------------------------------------------------------------
     Aktív navigációs elem kiemelése görgetéskor
  ------------------------------------------------------------------ */
  var navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  var sections = Array.prototype.slice.call(navLinks).map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  function updateActiveNav() {
    var scrollPos = window.pageYOffset + getHeaderOffset() + 16;
    var currentSection = null;
    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) {
        currentSection = section;
      }
    });
    navLinks.forEach(function (link) {
      var isActive = currentSection && link.getAttribute('href') === '#' + currentSection.id;
      link.classList.toggle('active', !!isActive);
    });
  }

  /* ------------------------------------------------------------------
     Vissza a tetejére gomb
  ------------------------------------------------------------------ */
  var backToTop = document.getElementById('backToTop');

  function updateBackToTop() {
    if (!backToTop) { return; }
    if (window.pageYOffset > 480) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        updateActiveNav();
        updateBackToTop();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  updateActiveNav();
  updateBackToTop();

  /* ------------------------------------------------------------------
     Finom megjelenési animáció (fade-in) az elemek felbukkanásakor
  ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------
     GYIK — csak egy accordion legyen nyitva egyszerre (fallback)
  ------------------------------------------------------------------ */
  var faqItems = document.querySelectorAll('.faq-item');
  var supportsNameAttr = 'name' in document.createElement('details');
  if (!supportsNameAttr) {
    faqItems.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open) {
          faqItems.forEach(function (other) {
            if (other !== item) { other.open = false; }
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Ajánlatkérő űrlap — kliensoldali validáció
     A jelenlegi verzió nem küld valódi kérést; a submitQuoteRequest
     függvény könnyen lecserélhető egy tényleges API-hívásra.
  ------------------------------------------------------------------ */
  var form = document.getElementById('quoteForm');
  var formSuccess = document.getElementById('formSuccess');

  function setFieldError(field, message) {
    var errorEl = document.getElementById('err-' + field.name);
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      if (errorEl) { errorEl.textContent = message; }
    } else {
      field.removeAttribute('aria-invalid');
      if (errorEl) { errorEl.textContent = ''; }
    }
  }

  function validateForm(formEl) {
    var isValid = true;

    var name = formEl.querySelector('#qf-name');
    if (!name.value.trim()) {
      setFieldError(name, 'Kérjük, add meg a neved.');
      isValid = false;
    } else {
      setFieldError(name, '');
    }

    var email = formEl.querySelector('#qf-email');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
      setFieldError(email, 'Kérjük, add meg az e-mail címed.');
      isValid = false;
    } else if (!emailPattern.test(email.value.trim())) {
      setFieldError(email, 'Kérjük, adj meg egy érvényes e-mail címet.');
      isValid = false;
    } else {
      setFieldError(email, '');
    }

    var phone = formEl.querySelector('#qf-phone');
    if (!phone.value.trim()) {
      setFieldError(phone, 'Kérjük, add meg a telefonszámod.');
      isValid = false;
    } else {
      setFieldError(phone, '');
    }

    var message = formEl.querySelector('#qf-message');
    if (!message.value.trim()) {
      setFieldError(message, 'Kérjük, írd le röviden, miben segíthetünk.');
      isValid = false;
    } else {
      setFieldError(message, '');
    }

    return isValid;
  }

/* ------------------------------------------------------------------
   Fájlfeltöltés (fotók csatolása az ajánlatkéréshez)
------------------------------------------------------------------ */
var MAX_FILES = 3;
var MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
var fileInput = document.getElementById('qf-photos');
var fileUploadWrap = document.getElementById('fileUpload');
var fileList = document.getElementById('fileUploadList');
var errPhotos = document.getElementById('err-photos');
var selectedFiles = [];

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach(function (file, index) {
    var li = document.createElement('li');
    var sizeKb = Math.round(file.size / 1024);
    li.innerHTML =
      '<span>' + file.name + ' (' + sizeKb + ' KB)</span>' +
      '<button type="button" class="file-remove" data-index="' + index + '" aria-label="' + file.name + ' eltávolítása">✕</button>';
    fileList.appendChild(li);
  });
}

function syncFileInput() {
  var dataTransfer = new DataTransfer();
  selectedFiles.forEach(function (file) { dataTransfer.items.add(file); });
  fileInput.files = dataTransfer.files;
}

function addFiles(fileArray) {
  errPhotos.textContent = '';
  fileArray.forEach(function (file) {
    if (selectedFiles.length >= MAX_FILES) {
      errPhotos.textContent = 'Legfeljebb ' + MAX_FILES + ' képet lehet csatolni.';
      return;
    }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      errPhotos.textContent = 'Csak JPG, PNG vagy WEBP formátumú képet lehet csatolni.';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      errPhotos.textContent = 'A(z) "' + file.name + '" túl nagy (max. 8 MB).';
      return;
    }
    selectedFiles.push(file);
  });
  syncFileInput();
  renderFileList();
}

if (fileInput) {
  fileInput.addEventListener('change', function () {
    addFiles(Array.prototype.slice.call(fileInput.files));
  });

  fileList.addEventListener('click', function (e) {
    var btn = e.target.closest('.file-remove');
    if (!btn) { return; }
    var index = Number(btn.getAttribute('data-index'));
    selectedFiles.splice(index, 1);
    syncFileInput();
    renderFileList();
  });

  ['dragover', 'dragleave', 'drop'].forEach(function (evt) {
    fileUploadWrap.addEventListener(evt, function (e) {
      e.preventDefault();
      fileUploadWrap.classList.toggle('is-dragover', evt === 'dragover');
    });
  });
  fileUploadWrap.addEventListener('drop', function (e) {
    addFiles(Array.prototype.slice.call(e.dataTransfer.files));
  });
}


  /**
   * Ide kerül majd a tényleges backend-integráció (REST API / serverless
   * function / form-handling szolgáltatás). Jelenleg csak a beküldött
   * adatokat adja vissza egy Promise-ban, hogy a hívási felület már most
   * a véglegeshez hasonló legyen.
   */
  /**
   /**
   * Adatok küldése a Make.com webhookra (FormData-val, fájlokkal együtt)
   */
  function submitQuoteRequest(formData) {
    var webhookUrl = 'https://hook.eu1.make.com/veitjjt4azpxk3qwss8awcxrev7vt37d';
    
    return fetch(webhookUrl, {
      method: 'POST',
      body: formData
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Hiba történt a küldés során.');
      }
      return response;
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm(form)) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) { firstInvalid.focus(); }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Küldés…';

      var formData = new FormData(form);

      submitQuoteRequest(formData).then(function () {
        form.classList.add('is-hidden');
        formSuccess.classList.add('is-visible');
        formSuccess.setAttribute('tabindex', '-1');
        formSuccess.focus();
        form.reset();
        selectedFiles = [];
        renderFileList();
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
    });
  }
})();