import { useEffect } from 'react';
import { useClinicConfig, useClinicRenderKey } from '@/context/ClinicConfigContext';

/**
 * ThemeProvider — injects CSS variables from clinicConfig into :root at runtime.
 * All white-label colors flow from clinicConfig.js → :root → TailwindCSS.
 */
export default function ThemeProvider() {
  const config = useClinicConfig();
  const renderKey = useClinicRenderKey();

  useEffect(() => {
    const root = document.documentElement;
    const vars = config.cssVariables || {};
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }

    // ── Dynamic Branding (Favicon & Title) ──
    const clinicName = config.name || 'OnlinePT';
    const logo = config.logo || '/onlinept-logo-v3.png';

    // Update Title (only if it's the home page or specific dashboard pages)
    // Actually, document.title should probably be set at the router level,
    // but for the favicon, we want it global.
    document.title = clinicName;

    // Update Favicon
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logo;

    // Update Apple Touch Icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = logo;

  }, [config, renderKey]);

  return null;
}
