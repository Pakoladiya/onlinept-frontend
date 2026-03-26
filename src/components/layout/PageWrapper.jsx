import clsx from 'clsx';
import Header from './Header';
import Footer from './Footer';

/**
 * PageWrapper — consistent padding + max-width + mobile-first layout.
 * Wraps every page with Header + Footer.
 */
export default function PageWrapper({ children, className, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main
        className={clsx(
          'flex-1 w-full mx-auto px-4',
          'max-w-mobile sm:max-w-tablet lg:max-w-desktop',
          'py-6 pb-24 sm:py-8',
          className
        )}
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
