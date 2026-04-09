export default function GradientText({ children, className = '', as: Tag = 'h1' }) {
  return (
    <Tag
      className={`bg-clip-text text-transparent bg-[length:200%_200%] animate-[gradient-shift_6s_ease_infinite] ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #00ffa3, #bf81ff, #FFCA3A, #00ffa3)',
      }}
    >
      {children}
    </Tag>
  );
}
