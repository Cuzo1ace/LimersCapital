import Icon from './_Icon';

/** $LIMER token — a lime wedge with citrus segments. Signature brand motif. */
export default function LimerIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 V21" />
      <path d="M3 12 H21" />
      <path d="M12 12 L5.6 5.6" opacity="0.6" />
      <path d="M12 12 L18.4 5.6" opacity="0.6" />
      <path d="M12 12 L18.4 18.4" opacity="0.6" />
      <path d="M12 12 L5.6 18.4" opacity="0.6" />
    </Icon>
  );
}
