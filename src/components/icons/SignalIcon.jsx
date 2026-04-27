import Icon from './_Icon';

/** Signal pillar — concentric broadcast waves emanating from a node. */
export default function SignalIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M8.5 15.5 A5 5 0 0 1 8.5 8.5" />
      <path d="M15.5 8.5 A5 5 0 0 1 15.5 15.5" />
      <path d="M5.5 18.5 A9 9 0 0 1 5.5 5.5" opacity="0.55" />
      <path d="M18.5 5.5 A9 9 0 0 1 18.5 18.5" opacity="0.55" />
    </Icon>
  );
}
