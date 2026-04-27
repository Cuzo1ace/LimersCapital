import Icon from './_Icon';

/** ☀ — bright sun, used for Solflare branding / light-mode toggle / daytime contexts. */
export default function SunIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2 V4" />
      <path d="M12 20 V22" />
      <path d="M4.93 4.93 L6.34 6.34" />
      <path d="M17.66 17.66 L19.07 19.07" />
      <path d="M2 12 H4" />
      <path d="M20 12 H22" />
      <path d="M4.93 19.07 L6.34 17.66" />
      <path d="M17.66 6.34 L19.07 4.93" />
    </Icon>
  );
}
