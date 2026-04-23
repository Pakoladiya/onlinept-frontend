import clsx from 'clsx';

/**
 * Card component — Apple-style with soft shadow and rounded corners.
 * All colors from CSS variables.
 */
export default function Card({
  children,
  className,
  hover = false,
  padding = true,
  ...rest
}) {
  return (
    <div
      className={clsx(
        'bg-surface rounded-card shadow-card-sm border border-border',
        padding ? 'p-6' : '',
        hover && 'hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
