import { AuthLayout } from '../components/auth/AuthLayout'
import { SignupForm } from '../components/auth/SignupForm'

const SIGNUP_BENEFITS = [
  'Organize everyday UPI and utility expenses in INR',
  'Spot unusual spending patterns with clear context',
  'Visualize monthly budgets, income, and savings rate',
]

export function SignupPage() {
  return (
    <AuthLayout
      variant="signup"
      panelTitle="Start Your Financial Journey"
      panelDescription="Create your FinSight account to turn everyday transactions into clear, intelligent insights."
      benefits={SIGNUP_BENEFITS}
    >
      <SignupForm />
    </AuthLayout>
  )
}
