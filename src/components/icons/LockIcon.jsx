import Icon from './_Icon';

/** 🔒 — Privacy pillar. */
export default function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11 V7 A4 4 0 0 1 16 7 V11" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}
