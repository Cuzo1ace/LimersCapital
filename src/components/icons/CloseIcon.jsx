import Icon from './_Icon';

export default function CloseIcon(props) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M6 6 L18 18" />
      <path d="M18 6 L6 18" />
    </Icon>
  );
}
