// Inline SVG icons. Decorative unless a label is passed.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { label?: string };

function Svg({ label, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Octagon with "!" — Likely scam. */
export const IconStop = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z" />
    <path d="M12 7.5v5.5" />
    <path d="M12 16.5h.01" />
  </Svg>
);

/** Triangle with "!" — Worth a closer look. */
export const IconCaution = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 3.9 1.8 18.5a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4.5" />
    <path d="M12 17.5h.01" />
  </Svg>
);

/** Circle with "i" — No known pattern found (never a checkmark). */
export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6" />
    <path d="M12 7.5h.01" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconClipboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="M9 11h6M9 15h4" />
  </Svg>
);

export const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IconNext = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 5v14" />
    <path d="m10 6 9 6-9 6z" />
  </Svg>
);

export const IconMark = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h16" />
    <path d="m6 16 2.5-.5L18 6l-2-2-9.5 9.5z" />
  </Svg>
);

export const IconBalance = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v16M7 20h10" />
    <path d="M5 8h14" />
    <path d="m5 8-2.5 6a3 3 0 0 0 5 0z" />
    <path d="m19 8-2.5 6a3 3 0 0 0 5 0z" />
  </Svg>
);

export const IconLink = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Svg>
);
