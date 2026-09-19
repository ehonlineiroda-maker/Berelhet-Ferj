/**
 * Egyszerű, testreszabható cookie (süti) banner
 * -----------------------------------------------
 * Használat: illeszd be ezt a sort a </body> tag elé bármelyik oldaladon:
 *   <script src="cookie-consent.js"></script>
 *
 * Testreszabás: a fájl tetején lévő CONFIG objektumban tudod módosítani
 * a szöveget, a kategóriákat és a színeket (CSS változókon keresztül).
 *
 * A tényleges adatgyűjtő szkriptek (pl. Google Analytics, Facebook Pixel)
 * betöltéséhez figyeld a "cookieConsentChanged" eseményt, vagy olvasd ki
 * bármikor a window.cookieConsent objektumot. Lásd a fájl alján lévő
 * PÉLDA részt.
 */

(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 1) BEÁLLÍTÁSOK – ide írd a saját szövegeidet / kategóriáidat
  // ------------------------------------------------------------------
  var CONFIG = {
    storageKey: "cookie_consent_v1",
    bannerText:
      "Weboldalunk sütiket (cookie-kat) használ a megfelelő működés, " +
      "statisztikai elemzés és a felhasználói élmény javítása érdekében. " +
      "A „Beállítások” gombra kattintva egyénileg is megadhatod, mihez járulsz hozzá.",
    privacyLinkText: "Adatkezelési tájékoztató",
    privacyLinkUrl: "/gdpr/adatkezel_si_t_j_koztat.html", // állítsd be a saját linkedre, vagy hagyd üresen ("") ha nincs

    // A kategóriák listája. A "necessary" mindig kötelező és nem kapcsolható ki.
    categories: [
      {
        id: "necessary",
        label: "Szükséges sütik",
        description: "Az oldal alapvető működéséhez elengedhetetlenek. Ezek nem kapcsolhatók ki.",
        required: true,
        defaultValue: true
      },
      {
        id: "analytics",
        label: "Statisztikai sütik",
        description: "Segítenek megérteni, hogyan használják a látogatók az oldalt (pl. Google Analytics).",
        required: false,
        defaultValue: false
      },
      {
        id: "marketing",
        label: "Marketing sütik",
        description: "Személyre szabott hirdetések megjelenítésére szolgálnak (pl. Facebook Pixel, Google Ads).",
        required: false,
        defaultValue: false
      },
      {
        id: "preferences",
        label: "Preferencia sütik",
        description: "Megjegyzik a beállításaidat (pl. nyelv, régió) a következő látogatáshoz.",
        required: false,
        defaultValue: false
      }
    ]
  };

  // ------------------------------------------------------------------
  // 2) STÍLUS – CSS változókkal könnyen ráigazítható az oldal arculatára
  // ------------------------------------------------------------------
  var STYLE = `
  :root {
    --ccb-bg: #1f2430;
    --ccb-text: #f2f2f2;
    --ccb-muted: #c7cbd4;
    --ccb-accent: #4f8cff;
    --ccb-accent-text: #ffffff;
    --ccb-border: rgba(255,255,255,0.12);
    --ccb-btn-secondary-bg: transparent;
    --ccb-btn-secondary-border: rgba(255,255,255,0.35);
    --ccb-radius: 6px;
    --ccb-font: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .ccb-banner {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999999;
    background: var(--ccb-bg);
    color: var(--ccb-text);
    font-family: var(--ccb-font);
    font-size: 14px;
    line-height: 1.4;
    border-top: 1px solid var(--ccb-border);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.15);
    padding: 10px 16px;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  .ccb-banner.ccb-visible { transform: translateY(0); }

  .ccb-content {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
  }
  .ccb-text { flex: 1 1 320px; margin: 0; color: var(--ccb-text); }
  .ccb-text a { color: var(--ccb-accent); text-decoration: underline; }

  .ccb-buttons { display: flex; flex-wrap: wrap; gap: 8px; flex: 0 0 auto; }

  .ccb-btn {
    cursor: pointer;
    border-radius: var(--ccb-radius);
    padding: 8px 14px;
    font-size: 13px;
    font-family: inherit;
    border: 1px solid transparent;
    white-space: nowrap;
  }
  .ccb-btn-accept { background: var(--ccb-accent); color: var(--ccb-accent-text); }
  .ccb-btn-reject,
  .ccb-btn-settings {
    background: var(--ccb-btn-secondary-bg);
    color: var(--ccb-text);
    border-color: var(--ccb-btn-secondary-border);
  }

  /* Beállítások panel */
  .ccb-modal-overlay {
    position: fixed; inset: 0; z-index: 1000000;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .ccb-modal-overlay[hidden] { display: none; }
  .ccb-modal {
    background: #fff; color: #1f2430;
    font-family: var(--ccb-font);
    width: 100%; max-width: 480px;
    border-radius: 10px;
    padding: 20px;
    max-height: 85vh;
    overflow-y: auto;
  }
  .ccb-modal h2 { margin: 0 0 12px; font-size: 17px; }
  .ccb-cat { border-top: 1px solid #eee; padding: 12px 0; }
  .ccb-cat:first-of-type { border-top: none; }
  .ccb-cat-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ccb-cat-title { font-weight: 600; font-size: 14px; }
  .ccb-cat-desc { font-size: 12.5px; color: #555; margin-top: 4px; }

  .ccb-switch { position: relative; width: 40px; height: 22px; flex: 0 0 auto; }
  .ccb-switch input { opacity: 0; width: 0; height: 0; }
  .ccb-slider {
    position: absolute; inset: 0; background: #ccc; border-radius: 999px;
    transition: background 0.2s; cursor: pointer;
  }
  .ccb-slider::before {
    content: ""; position: absolute; width: 16px; height: 16px;
    left: 3px; top: 3px; background: #fff; border-radius: 50%;
    transition: transform 0.2s;
  }
  .ccb-switch input:checked + .ccb-slider { background: var(--ccb-accent); }
  .ccb-switch input:checked + .ccb-slider::before { transform: translateX(18px); }
  .ccb-switch input:disabled + .ccb-slider { opacity: 0.5; cursor: not-allowed; }

  .ccb-modal-actions {
    display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;
  }

  /* A panel fehér hátterű, ezért a "másodlagos" gomboknak saját, sötét
     szöveg- és szegélyszínt adunk (nem a sötét sávhoz igazított
     --ccb-text változót használjuk) */
  .ccb-modal .ccb-btn-reject {
    color: #1f2430;
    border-color: rgba(0,0,0,0.25);
    background: #f2f3f5;
  }
  .ccb-modal .ccb-btn-reject:hover { background: #e6e8eb; }
  `;

  // ------------------------------------------------------------------
  // 3) SEGÉDFÜGGVÉNYEK
  // ------------------------------------------------------------------
  function readStoredConsent() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(consentValues) {
    var payload = { values: consentValues, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(payload));
    } catch (e) {}
    applyConsent(consentValues);
  }

  function applyConsent(consentValues) {
    window.cookieConsent = consentValues;
    document.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: consentValues })
    );
  }

  function defaultValues() {
    var values = {};
    CONFIG.categories.forEach(function (c) {
      values[c.id] = !!c.defaultValue || !!c.required;
    });
    return values;
  }

  function allTrueValues() {
    var values = {};
    CONFIG.categories.forEach(function (c) {
      values[c.id] = true;
    });
    return values;
  }

  function necessaryOnlyValues() {
    var values = {};
    CONFIG.categories.forEach(function (c) {
      values[c.id] = !!c.required;
    });
    return values;
  }

  // ------------------------------------------------------------------
  // 4) UI FELÉPÍTÉSE
  // ------------------------------------------------------------------
  function injectStyle() {
    var styleEl = document.createElement("style");
    styleEl.setAttribute("data-ccb", "true");
    styleEl.textContent = STYLE;
    document.head.appendChild(styleEl);
  }

  function buildBanner() {
    var banner = document.createElement("div");
    banner.className = "ccb-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Süti (cookie) tájékoztató");

    var privacyHtml = CONFIG.privacyLinkUrl
      ? ' <a href="' + CONFIG.privacyLinkUrl + '">' + CONFIG.privacyLinkText + "</a>"
      : "";

    banner.innerHTML =
      '<div class="ccb-content">' +
      '<p class="ccb-text">' + CONFIG.bannerText + privacyHtml + "</p>" +
      '<div class="ccb-buttons">' +
      '<button type="button" class="ccb-btn ccb-btn-settings">Beállítások</button>' +
      '<button type="button" class="ccb-btn ccb-btn-reject">Csak a szükségesek</button>' +
      '<button type="button" class="ccb-btn ccb-btn-accept">Mind elfogadása</button>' +
      "</div></div>";

    return banner;
  }

  function buildModal() {
    var overlay = document.createElement("div");
    overlay.className = "ccb-modal-overlay";
    overlay.hidden = true;

    var modal = document.createElement("div");
    modal.className = "ccb-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Süti beállítások");

    var html = "<h2>Süti beállítások</h2>";
    CONFIG.categories.forEach(function (c) {
      html +=
        '<div class="ccb-cat">' +
        '<div class="ccb-cat-row">' +
        '<span class="ccb-cat-title">' + c.label + "</span>" +
        '<label class="ccb-switch">' +
        '<input type="checkbox" data-cat="' + c.id + '"' +
        (c.required ? " checked disabled" : "") +
        ">" +
        '<span class="ccb-slider"></span>' +
        "</label>" +
        "</div>" +
        '<p class="ccb-cat-desc">' + c.description + "</p>" +
        "</div>";
    });
    html +=
      '<div class="ccb-modal-actions">' +
      '<button type="button" class="ccb-btn ccb-btn-reject ccb-modal-reject">Csak a szükségesek</button>' +
      '<button type="button" class="ccb-btn ccb-btn-accept ccb-modal-save">Kiválasztottak mentése</button>' +
      "</div>";

    modal.innerHTML = html;
    overlay.appendChild(modal);
    return overlay;
  }

  // ------------------------------------------------------------------
  // 5) INICIALIZÁLÁS
  // ------------------------------------------------------------------
  function init() {
    injectStyle();

    var stored = readStoredConsent();
    if (stored && stored.values) {
      // Már van korábbi döntés – nem mutatjuk a sávot, de a beállítás
      // bármikor újranyitható a window.openCookieSettings() hívással.
      applyConsent(stored.values);
    }

    var banner = buildBanner();
    var modalOverlay = buildModal();
    document.body.appendChild(banner);
    document.body.appendChild(modalOverlay);

    function showBanner() {
      requestAnimationFrame(function () {
        banner.classList.add("ccb-visible");
      });
    }
    function hideBanner() {
      banner.classList.remove("ccb-visible");
    }
    function openModal() {
      var checked = (stored && stored.values) || defaultValues();
      modalOverlay.querySelectorAll("input[data-cat]").forEach(function (input) {
        var id = input.getAttribute("data-cat");
        input.checked = !!checked[id] || input.disabled;
      });
      modalOverlay.hidden = false;
    }
    function closeModal() {
      modalOverlay.hidden = true;
    }

    if (!stored) {
      showBanner();
    }

    banner.querySelector(".ccb-btn-accept").addEventListener("click", function () {
      saveConsent(allTrueValues());
      hideBanner();
    });
    banner.querySelector(".ccb-btn-reject").addEventListener("click", function () {
      saveConsent(necessaryOnlyValues());
      hideBanner();
    });
    banner.querySelector(".ccb-btn-settings").addEventListener("click", function () {
      openModal();
    });

    modalOverlay.querySelector(".ccb-modal-save").addEventListener("click", function () {
      var values = {};
      modalOverlay.querySelectorAll("input[data-cat]").forEach(function (input) {
        values[input.getAttribute("data-cat")] = input.checked || input.disabled;
      });
      saveConsent(values);
      closeModal();
      hideBanner();
    });
    modalOverlay.querySelector(".ccb-modal-reject").addEventListener("click", function () {
      saveConsent(necessaryOnlyValues());
      closeModal();
      hideBanner();
    });
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    // Bárhonnan újranyitható a beállítás (pl. lábléc "Süti beállítások" linkről)
    window.openCookieSettings = function () {
      openModal();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ------------------------------------------------------------------
  // PÉLDA – így tudod feltételhez kötni a tényleges adatgyűjtést:
  // ------------------------------------------------------------------
  // document.addEventListener("cookieConsentChanged", function (e) {
  //   var consent = e.detail;
  //   if (consent.analytics) {
  //     // pl. Google Analytics betöltése
  //     // loadGoogleAnalytics();
  //   }
  //   if (consent.marketing) {
  //     // pl. Facebook Pixel betöltése
  //     // loadFacebookPixel();
  //   }
  // });
  //
  // Vagy bármikor közvetlenül lekérdezheted:
  //   if (window.cookieConsent && window.cookieConsent.analytics) { ... }
})();
