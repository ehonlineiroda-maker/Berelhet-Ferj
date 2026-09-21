/**
 * cookie-consent-integrations.js
 * -------------------------------
 * Ez a script a cookie-consent.js bannerhez KAPCSOLJA a tényleges
 * mérőkódokat (Google Analytics / gtag és Meta / Facebook Pixel).
 *
 * A LÉNYEG: ez a fájl saját magától SOHA nem tölt be semmilyen
 * mérőkódot. Csak akkor indítja el a Google Analytics-et, ha a
 * látogató a "statisztikai" kategóriát elfogadta, és csak akkor
 * indítja a Facebook Pixelt, ha a "marketing" kategóriát elfogadta.
 * Ha valaki "Csak a szükségeseket" választ, egyik sem indul el.
 *
 * FONTOS – így kell beillesztened a HTML-be (ebben a sorrendben,
 * a <head>-ben vagy közvetlenül a </body> előtt, de mindenképp
 * EGYÜTT és EBBEN a sorrendben):
 *
 *   <script src="cookie-consent.js"></script>
 *
 *   <script>
 *     window.CCB_INTEGRATIONS_CONFIG = {
 *       googleAnalyticsId: "G-XXXXXXXXXX",   // a saját GA4 mérési azonosítód
 *       facebookPixelId: "XXXXXXXXXXXXXXX"   // a saját Meta Pixel azonosítód
 *     };
 *   </script>
 *   <script src="cookie-consent-integrations.js"></script>
 *
 * Az eredeti, feltétel nélkül lefutó Google gtag / Meta Pixel kódblokkokat
 * a <head>-ből TÖRÖLD KI (vagy kommenteld ki) – ez a script veszi át a
 * helyüket, csak feltételesen indítja el ugyanazt.
 */

(function () {
  "use strict";

  var CONFIG = window.CCB_INTEGRATIONS_CONFIG || {};

  // Ennek a kulcsnak PONTOSAN egyeznie kell a cookie-consent.js
  // fájlban lévő CONFIG.storageKey értékével!
  var STORAGE_KEY = "cookie_consent_v1";

  var gaLoaded = false;
  var fbLoaded = false;

  // ------------------------------------------------------------------
  // Google Analytics (gtag.js) betöltése és inicializálása
  // ------------------------------------------------------------------
  function loadGoogleAnalytics(measurementId) {
    if (gaLoaded || !measurementId) return;
    gaLoaded = true;

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  // ------------------------------------------------------------------
  // Meta (Facebook) Pixel betöltése és inicializálása
  // ------------------------------------------------------------------
  function loadFacebookPixel(pixelId) {
    if (fbLoaded || !pixelId) return;
    fbLoaded = true;

    /* eslint-disable */
    !(function (f, b, e, v, n, t, s2) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s2 = b.getElementsByTagName(e)[0];
      s2.parentNode.insertBefore(t, s2);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");

    // noscript fallback kép (csak egyszer kerül be a DOM-ba)
    if (!document.getElementById("ccb-fb-noscript")) {
      var noscript = document.createElement("noscript");
      noscript.id = "ccb-fb-noscript";
      noscript.innerHTML =
        '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' +
        pixelId +
        '&ev=PageView&noscript=1" />';
      document.body.appendChild(noscript);
    }
  }

  // ------------------------------------------------------------------
  // A süti-döntés hozzárendelése a mérőkódokhoz
  // ------------------------------------------------------------------
  function applyConsentToIntegrations(consentValues) {
    if (!consentValues) return;

    if (consentValues.analytics && CONFIG.googleAnalyticsId) {
      loadGoogleAnalytics(CONFIG.googleAnalyticsId);
    }
    if (consentValues.marketing && CONFIG.facebookPixelId) {
      loadFacebookPixel(CONFIG.facebookPixelId);
    }

    // Ha később további, kategóriához kötött szkriptet (pl. chat widget,
    // beágyazott videó stb.) szeretnél feltételhez kötni, itt add hozzá:
    // if (consentValues.preferences) { ... }
  }

  function readStoredConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.values ? parsed.values : null;
    } catch (e) {
      return null;
    }
  }

  // 1) Visszatérő látogató: ha már van korábban mentett döntés,
  //    azonnal (a cookie-consent.js-től függetlenül is) alkalmazzuk.
  var existingConsent = readStoredConsent();
  if (existingConsent) {
    applyConsentToIntegrations(existingConsent);
  }

  // 2) Új döntés / módosítás: amikor a látogató a bannerben vagy a
  //    beállítások panelen dönt, a cookie-consent.js egy
  //    "cookieConsentChanged" eseményt küld – erre azonnal reagálunk.
  //    (Ez a figyelő rögtön a script betöltésekor regisztrálódik, nem
  //    kell rá várni DOMContentLoaded-re, így nem eshet ki az esemény.)
  document.addEventListener("cookieConsentChanged", function (e) {
    applyConsentToIntegrations(e.detail);
  });
})();
