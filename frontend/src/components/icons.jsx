// Small, dependency-free icon set (hand-written SVGs, Feather-style) -
// avoids pulling in an icon library just for a dozen glyphs.
function Icon({ children, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </Icon>
  );
}

export function DepositIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8.5 11.5 12 8l3.5 3.5" />
    </Icon>
  );
}

export function WithdrawIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8M8.5 12.5 12 16l3.5-3.5" />
    </Icon>
  );
}

export function PlansIcon(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </Icon>
  );
}

export function ReferralIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="7" r="2.4" />
      <path d="M14.7 12.2A4.6 4.6 0 0 1 21.5 16" />
    </Icon>
  );
}

export function TransactionsIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  );
}

export function WalletIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function UsersIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.5 5.3a3.2 3.2 0 0 1 0 6.2" />
      <path d="M18 13.2a6.2 6.2 0 0 1 3.2 5.4" />
    </Icon>
  );
}

export function SettingsIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Icon>
  );
}

export function AuditIcon(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3" />
      <path d="M9 12h6M9 16h6M9 8h2" />
    </Icon>
  );
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 6v6c0 4.5 3 7.7 7.5 9 4.5-1.3 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function LogoutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Icon>
  );
}

export function GiftIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="9" width="18" height="12" rx="1.5" />
      <path d="M3 13h18M12 9v12" />
      <path d="M12 9c-1.6 0-4-.9-4-3s1.6-3 2.6-2c1.2.9 1.4 3 1.4 5Z" />
      <path d="M12 9c1.6 0 4-.9 4-3s-1.6-3-2.6-2c-1.2.9-1.4 3-1.4 5Z" />
    </Icon>
  );
}
