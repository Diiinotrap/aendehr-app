import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} text-primary-400 animate-spin`} />
      {text && <p className="text-sm text-dark-400">{text}</p>}
    </div>
  )
}

export function FullPageLoader({ text = 'Memuat...' }) {
  return (
    <div className="fixed inset-0 bg-dark-950 flex items-center justify-center z-50">
      <div className="text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-dark-800 border-t-primary-500 animate-spin" />
        </div>
        <p className="text-dark-300 text-sm">{text}</p>
      </div>
    </div>
  )
}
