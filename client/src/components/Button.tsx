import type { ButtonHTMLAttributes } from 'react';
import { Icon, IconName } from './Icons';
import { Spinner } from './Feedback';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={14} /> : icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  size?: number;
}

export function IconButton({ icon, label, size = 16, className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
