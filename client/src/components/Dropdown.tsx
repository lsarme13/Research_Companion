import { ReactNode, useRef } from 'react';
import { Icon, IconName } from './Icons';

interface DropdownProps {
  label: string;
  icon?: IconName;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ label, icon, children, align = 'right' }: DropdownProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };
  return (
    <details className="dropdown" ref={ref}>
      <summary className={`btn btn-secondary btn-md dropdown-trigger dropdown-${align}`}>
        {icon ? <Icon name={icon} size={16} /> : null}
        <span>{label}</span>
        <Icon name="chevron-down" size={14} />
      </summary>
      <div className="dropdown-menu" onClick={close}>
        {children}
      </div>
    </details>
  );
}

interface DropdownItemProps {
  icon?: IconName;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  download?: boolean;
}

export function DropdownItem({ icon, children, onClick, href, danger, download }: DropdownItemProps) {
  const className = `dropdown-item ${danger ? 'dropdown-item-danger' : ''}`.trim();
  if (href) {
    return (
      <a className={className} href={href} download={download ? '' : undefined}>
        {icon ? <Icon name={icon} size={15} /> : null}
        <span>{children}</span>
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {icon ? <Icon name={icon} size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="dropdown-separator" role="separator" />;
}
