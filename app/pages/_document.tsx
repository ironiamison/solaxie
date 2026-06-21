import { Html, Head, Main, NextScript } from 'next/document'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solaxie.com";
const SITE_NAME = "Solaxie";
const SITE_DESC = "Collect, breed, and battle Solaxies on Solana. Link your wallet and play.";

// Registered as the very first thing in <head> — before Next's dev runtime and
// error overlay attach their own listeners — so our capture-phase handler wins
// and can stopImmediatePropagation() the benign "Failed to connect to MetaMask"
// noise that wallet browser extensions (inpage.js) auto-fire on every page load.
const SILENCE_METAMASK = `
(function () {
  if (window.__mmSilenced) return;
  window.__mmSilenced = true;
  var noise = function (s) {
    return /metamask|failed to connect to metamask|inpage\\.js|chrome-extension:\\/\\//i.test(String(s || ""));
  };
  var reason = function (r) {
    if (!r) return "";
    if (typeof r === "string") return r;
    return (r.message || "") + " " + (r.stack || "") + " " + String(r);
  };
  window.addEventListener("unhandledrejection", function (e) {
    if (noise(reason(e.reason))) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  window.addEventListener("error", function (e) {
    if (noise((e.message || "") + " " + (e.filename || "") + " " + reason(e.error))) {
      e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
  var orig = console.error.bind(console);
  console.error = function () {
    for (var i = 0; i < arguments.length; i++) { if (noise(reason(arguments[i]))) return; }
    return orig.apply(null, arguments);
  };
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: SILENCE_METAMASK }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ff5fb0" />
        <meta name="description" content={SITE_DESC} />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={SITE_NAME} />
        <meta property="og:description" content={SITE_DESC} />
        <meta property="og:image" content={`${SITE_URL}/icon-512.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_NAME} />
        <meta name="twitter:description" content={SITE_DESC} />
        <meta name="twitter:image" content={`${SITE_URL}/icon-512.png`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
