import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('vb_token', token)
    localStorage.setItem('vb_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  setUser: (user) => {
    localStorage.setItem('vb_user', JSON.stringify(user))
    set({ user })
  },

  clearAuth: () => {
    localStorage.removeItem('vb_token')
    localStorage.removeItem('vb_user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

// Hydrate on load
const storedToken = localStorage.getItem('vb_token')
const storedUser = localStorage.getItem('vb_user')
if (storedToken && storedUser) {
  try {
    useAuthStore.setState({
      token: storedToken,
      user: JSON.parse(storedUser),
      isAuthenticated: true,
    })
  } catch {
    localStorage.removeItem('vb_token')
    localStorage.removeItem('vb_user')
  }
}

export default useAuthStore
