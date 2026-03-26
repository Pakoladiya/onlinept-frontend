import clsx from 'clsx';

/**
 * Button component — all colors from CSS variables (no hardcoding).
 *
 * @param {'primary' | 'secondary' | 'outline' | 'ghost'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} fullWidth
 * @param {boolean} loading
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  ...rest
}) {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-button transition-all duration-150',
    'select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ];

  const variants = {
    primary: [
      'bg-primary text-white',
      'hover:bg-primary-hover active:scale-[0.98]',
      'focus-visible:ring-primary',
    ],
    secondary: [
      'bg-secondary text-white',
      'hover:bg-secondary-hover active:scale-[0.98]',
      'focus-visible:ring-secondary',
    ],
    outline: [
      'bg-transparent border-2 border-primary text-primary',
      'hover:bg-primary hover:text-white active:scale-[0.98]',
      'focus-visible:ring-primary',
    ],
    ghost: [
      'bg-transparent text-primary',
      'hover:bg-primary-light active:scale-[0.98]',
      'focus-visible:ring-primary',
    ],
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 min-h-[36px]',
    md: 'text-base px-5 py-2.5 min-h-[44px]',
    lg: 'text-lg px-7 py-3.5 min-h-[52px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        ...base,
        ...variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
