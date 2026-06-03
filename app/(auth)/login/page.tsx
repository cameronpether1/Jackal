import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Sign in — Jackal' }

export default function LoginPage() {
  return (
    <div className="min-h-full flex items-center justify-center bg-jk-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Jackal" className="w-12 h-12 rounded-xl object-cover mb-4 mx-auto" />
          <h1 className="text-xl font-semibold text-jk-text">Welcome to Jackal</h1>
          <p className="text-sm text-jk-text-muted mt-1">Sign in to your shared board</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
