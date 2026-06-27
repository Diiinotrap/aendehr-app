export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-dark-700 text-dark-200',
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    info: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
