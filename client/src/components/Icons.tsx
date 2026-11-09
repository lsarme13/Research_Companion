import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'library'
  | 'settings'
  | 'file'
  | 'globe'
  | 'reader'
  | 'notes'
  | 'plus'
  | 'search'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-down'
  | 'chevron-right'
  | 'close'
  | 'check'
  | 'x'
  | 'archive'
  | 'trash'
  | 'edit'
  | 'external'
  | 'sparkles'
  | 'folder'
  | 'link'
  | 'alert'
  | 'clock'
  | 'dots'
  | 'download'
  | 'refresh'
  | 'history'
  | 'upload'
  | 'info'
  | 'quote'
  | 'lock';

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  library: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5z" />
      <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" />
      <path d="M8 6h8M8 9h5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="13" cy="18" r="2" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
  reader: (
    <>
      <path d="M12 6.5C10.5 5 8.5 4.5 5 4.5v14c3.5 0 5.5.5 7 2 1.5-1.5 3.5-2 7-2v-14c-3.5 0-5.5.5-7 2z" />
      <path d="M12 6.5v14" />
    </>
  ),
  notes: (
    <>
      <path d="M5 3h11l4 4v14H5z" />
      <path d="M15 3v5h5M8.5 12h7M8.5 16h5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  archive: (
    <>
      <path d="M3 4h18v4H3zM5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
      <path d="m13.5 5.5 4 4" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  folder: <path d="M3 6h6l2 2h10v11H3z" />,
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7.5l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7.5l1.2-1.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 9v5M12 17.5v.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4L4 9" />
      <path d="M4 4v5h5M4 13a8 8 0 0 0 14.5 4L20 15" />
      <path d="M20 20v-5h-5" />
    </>
  ),
  history: (
    <>
      <path d="M4 12a8 8 0 1 1 2.5 5.8" />
      <path d="M4 5v5h5M12 8v4.5l3 2" />
    </>
  ),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.1" />
    </>
  ),
  quote: (
    <>
      <path d="M5 11h5v6H5zM14 11h5v6h-5z" />
      <path d="M10 11c0-3-1.5-5-4-5M19 11c0-3-1.5-5-4-5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
