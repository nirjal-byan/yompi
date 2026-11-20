import type { ReactNode, SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
  </Icon>
);

export const TrekIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M2 20 9 7l4 6 2-3 7 10z" />
  </Icon>
);

export const PermitIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5M9 13h7M9 17h7" />
  </Icon>
);

export const CostIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9.5c0-1 1.3-2 3-2s3 .9 3 2.2-1.3 1.8-3 2.3-3 1-3 2.3 1.3 2.2 3 2.2 3-1 3-2" />
  </Icon>
);

export const ExternalIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </Icon>
);

export const SignOutIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M10 4H4v16h6M9 12h11M16 8l4 4-4 4" />
  </Icon>
);

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 5l14 14M19 5 5 19" />
  </Icon>
);
