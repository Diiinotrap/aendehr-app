import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch employee profile linked to auth user
  async function fetchEmployee(authUser) {
    if (!authUser) {
      setEmployee(null)
      setRole(null)
      return
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (error) {
      console.error('Error fetching employee:', error)
      setEmployee(null)
      setRole(null)
      return
    }

    setEmployee(data)
    setRole(data.role)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      fetchEmployee(authUser).finally(() => setLoading(false))
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user ?? null
        setUser(authUser)
        await fetchEmployee(authUser)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setEmployee(null)
    setRole(null)
  }

  const value = {
    user,
    employee,
    role,
    loading,
    signIn,
    signOut,
    isAdmin: role === 'admin',
    isEmployee: role === 'employee',
    refreshEmployee: () => fetchEmployee(user),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
