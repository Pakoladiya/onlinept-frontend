import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Instantly scrolls the browser to the very top (0, 0) on every route change.
 * Place this once inside <BrowserRouter> so it runs on every navigation.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use instant (not smooth) so the user is at the top before content renders
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
