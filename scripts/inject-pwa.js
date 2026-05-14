const fs = require('fs');
const path = require('path');

const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distHtml)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtml, 'utf-8');

const pwaTags = `
    <!-- PWA Meta Tags -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Estron" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="Estron" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-TileColor" content="#007AFF" />
    <meta name="msapplication-tap-highlight" content="no" />`;

const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    </script>`;

// Inject PWA tags before </head>
html = html.replace('</head>', pwaTags + '\n  </head>');

// Inject service worker registration before </body>
html = html.replace('</body>', swScript + '\n  </body>');

// Update viewport for PWA (add viewport-fit=cover)
html = html.replace(
  'width=device-width, initial-scale=1, shrink-to-fit=no',
  'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
);

// Add overscroll-behavior to body style
html = html.replace(
  'overflow: hidden;',
  'overflow: hidden;\n        overscroll-behavior-y: contain;\n        -webkit-tap-highlight-color: transparent;'
);

// Add safe area CSS for PWA standalone mode
const safeAreaCSS = `
    <style id="pwa-safe-area">
      #root {
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        box-sizing: border-box;
        background-color: #F9F9F9; /* Match Navigator background */
      }
      /* Fill status bar area with screen background color */
      html {
        background-color: #F2F2F7;
      }
    </style>`;

html = html.replace('</head>', safeAreaCSS + '\n  </head>');

fs.writeFileSync(distHtml, html, 'utf-8');
console.log('✅ PWA tags injected into dist/index.html');
