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
        'bg-white rounded-[3rem] shadow-2xl shadow-gray-200/40 border border-gray-100/50',
        padding ? 'p-6' : '',
        hover && 'hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/60 transition-all duration-300 cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
