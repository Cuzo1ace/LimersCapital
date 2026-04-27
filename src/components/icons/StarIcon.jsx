import Icon from './_Icon';

/** Outline star. Pass `filled` to render solid (for active/premium states). */
export default function StarIcon({ filled = false, ...props }) {
  return (
    <Icon {...props}>
      <path
        d="M12 2.5 L14.8 8.6 L21.5 9.4 L16.5 14 L17.8 20.6 L12 17.3 L6.2 20.6 L7.5 14 L2.5 9.4 L9.2 8.6 Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Icon>
  );
}
