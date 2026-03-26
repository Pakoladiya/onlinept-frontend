import { useEffect } from 'react';
import { derivedConfig } from '@/config/clinicConfig';

/**
 * ThemeProvider — injects CSS variables from clinicConfig into :root at runtime.
 * All white-label colors flow from clinicConfig.js → :root → TailwindCSS.
 * This component must be mounted early in the app tree.
 */
export default function ThemeProvider() {
  useEffect(() => {
    const root = document.documentElement;
    const vars = derivedConfig.cssVariables;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, []);

  return null;
}
