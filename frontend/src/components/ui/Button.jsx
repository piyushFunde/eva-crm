import { forwardRef } from 'react';

const variants = {
  primary: 'btn-primary',
  success: 'btn-success',
  outline: 'btn-outline',
  call: 'btn-call',
  collect: 'btn-collect',
  danger: 'bg-danger text-white font-semibold rounded-btn px-5 min-h-[48px] inline-flex items-center justify-center gap-2 transition-colors hover:bg-danger-dark text-[15px]',
};

const Button = forwardRef(({ variant = 'primary', className = '', children, ...props }, ref) => {
  const base = variants[variant] || variants.primary;
  return (
    <button
      ref={ref}
      className={`btn-press ${base} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
