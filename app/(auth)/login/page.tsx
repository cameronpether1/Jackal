import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Sign in — Jackal' }

export default function LoginPage() {
  return (
    <div className="min-h-full flex items-center justify-center bg-[var(--jk-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Jackal" className="w-12 h-12 rounded-xl object-cover mb-4" />
          <h1 className="text-xl font-semibold text-[var(--jk-text)]">Welcome to Jackal</h1>
          <p className="text-sm text-[var(--jk-text-muted)] mt-1">Sign in to your shared board</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
