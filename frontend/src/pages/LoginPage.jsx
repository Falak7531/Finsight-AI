import { AuthLayout } from '../components/auth/AuthLayout'
import { LoginForm } from '../components/auth/LoginForm'

const LOGIN_BENEFITS = [
  'Track your expenses',
  'Get AI-powered insights',
  'Take control of your money',
]

export function LoginPage() {
  return (
    <AuthLayout
      variant="login"
      panelTitle="Welcome Back!"
      panelDescription="Sign in to continue your financial journey with FinSight."
      benefits={LOGIN_BENEFITS}
    >
      <LoginForm />
    </AuthLayout>
  )
}
