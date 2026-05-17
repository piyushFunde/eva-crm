export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`card p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
