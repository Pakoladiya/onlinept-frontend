import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ThemeProvider from '@/components/ThemeProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import AppRouter from '@/routes/AppRouter';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';

import { ClinicConfigProvider } from '@/context/ClinicConfigContext';
import { loadTenantConfig } from '@/config/tenantLoader';

const root = createRoot(document.getElementById('root'));

async function mountApp() {
  try {
    // 1. Fetch dynamic tenant config from Firebase based on hostname
    await loadTenantConfig();

    // 2. Render application
    root.render(
      <StrictMode>
        <ClinicConfigProvider>
          <ThemeProvider />
          <BrowserRouter>
            <ErrorBoundary>
              <LanguageProvider>
                <AppRouter />
              </LanguageProvider>
            </ErrorBoundary>
          </BrowserRouter>
        </ClinicConfigProvider>
      </StrictMode>
    );
  } catch (err) {
    console.error('RENDER CRASH:', err);
    document.getElementById('root').innerHTML = `
      <div style="padding:20px;font-family:sans-serif;color:#333;">
        <h2 style="color:#ef4444">App failed to load</h2>
        <pre style="background:#f9fafb;padding:12px;border-radius:8px;overflow:auto;font-size:12px">${err?.message || err}</pre>
      </div>
    `;
  }
}

mountApp();
