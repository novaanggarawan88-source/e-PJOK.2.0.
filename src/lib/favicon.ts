/**
 * Dynamic Favicon Sync
 * Menyesuaikan ikon tab browser dengan logo aplikasi yang aktif (custom logo URL atau ikon preset e-PJOK).
 */

export function generatePresetSvgFavicon(preset: string = 'activity'): string {
  let iconContent = '';
  switch (preset) {
    case 'trophy':
      iconContent = `
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34M7 4h10v6a5 5 0 0 1-10 0V4z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
      break;
    case 'medal':
      iconContent = `
        <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12 5.12 2.2M13 12l5.88-9.8M12 22a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
      break;
    case 'flame':
      iconContent = `
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
      break;
    case 'basketball':
      iconContent = `
        <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2" fill="none"/>
        <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      `;
      break;
    case 'activity':
    default:
      iconContent = `
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="pjokGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="50%" stop-color="#0d9488" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="18" fill="url(#pjokGrad)" />
    <g transform="translate(14, 14) scale(1.5)">
      ${iconContent}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function updateFavicon(iconUrl?: string | null, preset?: string) {
  if (typeof document === 'undefined') return;

  let targetUrl = '/favicon.svg';
  if (iconUrl && iconUrl.trim().length > 0) {
    targetUrl = iconUrl;
  } else if (preset) {
    targetUrl = generatePresetSvgFavicon(preset);
  }

  let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = targetUrl;

  let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = targetUrl;
}

