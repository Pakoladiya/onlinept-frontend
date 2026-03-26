import clsx from 'clsx';

/**
 * Input component with label and error state.
 * All colors from CSS variables.
 */
export default function Input({
  label,
  error,
  id,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className,
  ...rest
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(
          'w-full px-4 py-3 rounded-input',
          'bg-white border text-text-primary placeholder:text-text-secondary',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-error focus:ring-error/30 focus:border-error'
            : 'border-border focus:ring-primary/30 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        {...rest}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          role="alert"
          className="text-sm text-error"
        >
          {error}
        </span>
      )}
    </div>
  );
}
