'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import Button from './ui/Button'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount and listen for auth changes
  useEffect(() => {
    checkAuth()

    const handleAuthChange = (event: CustomEvent) => {
      setIsAuthenticated(event.detail.authenticated)
      setUserRole(event.detail.role)
    }

    window.addEventListener('authChange', handleAuthChange as EventListener)

    return () => {
      window.removeEventListener('authChange', handleAuthChange as EventListener) // Cleanup
    }
  }, [])

  // Verify current authentication status with server
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setUserRole(data.role)
      } else {
        setIsAuthenticated(false)
        setUserRole('')
      }
    } catch (error) {
      setIsAuthenticated(false)
      setUserRole('')
    }
  }

  // Handle user logout with server call and state updates
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setUserRole('')
      toast.success('Logged out successfully!')
      window.dispatchEvent(new CustomEvent('authChange', { detail: { authenticated: false, role: '' } }))
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed. Please try again.')
    }
  }

  // Main navigation items
  const navigation = [
    { name: 'Home', href: '/' },
  ]

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">News Portal</h1>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${pathname === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Authenticated user navigation */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {/* Role-specific navigation links */}
                  {userRole === 'author' && (
                    <Link
                      href="/author"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${pathname === '/author'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                        }`}
                    >
                      Author
                    </Link>
                  )}
                  {userRole === 'admin' && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${pathname === '/admin'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                        }`}
                    >
                      Admin
                    </Link>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleLogout}
                    className="text-sm"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm" className="text-sm">
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu toggle button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Mobile navigation menu */}
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${pathname === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile auth navigation */}
              {isAuthenticated ? (
                <>
                  {userRole === 'author' && (
                    <Link
                      href="/author"
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${pathname === '/author'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Author
                    </Link>
                  )}
                  {userRole === 'admin' && (
                    <Link
                      href="/admin"
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${pathname === '/admin'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-red-600 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
