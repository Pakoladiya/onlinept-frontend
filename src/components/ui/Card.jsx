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
        'bg-white rounded-card shadow-card border border-border/50',
        padding ? 'p-5' : '',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
