import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Fingerprint, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password harus diisi')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Login berhasil!')
      // Navigation will be handled by App.jsx based on role
    } catch (error) {
      console.error('Login error:', error)
      if (error.message?.includes('Invalid login')) {
        toast.error('Email atau password salah')
      } else {
        toast.error('Gagal login. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-dark-950">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Login Card */}
      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-primary-500/5">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-lg shadow-primary-500/25 animate-pulse-glow">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-1">HRIS Login</h1>
            <p className="text-dark-400 text-sm">Masuk ke sistem manajemen SDM</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-dark-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 
                    text-dark-100 placeholder:text-dark-600 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                    transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-dark-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 
                    text-dark-100 placeholder:text-dark-600 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                    transition-all duration-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-primary-600 to-primary-500
                hover:from-primary-500 hover:to-primary-400
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40
                transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-dark-500">
              © 2026 HRIS System • All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
