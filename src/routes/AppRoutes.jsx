import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import MarketingLayout from '@/layouts/MarketingLayout'
import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'

// Marketing
import LandingPage from '@/pages/marketing/LandingPage'
import DisclosuresPage from '@/pages/marketing/DisclosuresPage'
import PrivacyPage from '@/pages/marketing/PrivacyPage'
import TermsPage from '@/pages/marketing/TermsPage'
import AboutPage from '@/pages/marketing/AboutPage'
import ContactPage from '@/pages/marketing/ContactPage'

// Auth
import RegisterPage from '@/pages/auth/RegisterPage'

// Onboarding steps (small — no lazy needed)
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import WelcomeStep from '@/components/features/onboarding/WelcomeStep'
import PersonalInfoStep from '@/components/features/onboarding/PersonalInfoStep'
import ExperienceStep from '@/components/features/onboarding/ExperienceStep'
import ConfirmationStep from '@/components/features/onboarding/ConfirmationStep'

// App (lazy — chart-heavy)
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const GoalsListPage = lazy(() => import('@/pages/goals/GoalsListPage'))
const NewGoalPage = lazy(() => import('@/pages/goals/NewGoalPage'))
const GoalDetailPage = lazy(() => import('@/pages/goals/GoalDetailPage'))
const RiskQuizPage = lazy(() => import('@/pages/risk/RiskQuizPage'))
const RiskQuizInnerPage = lazy(() => import('@/pages/risk/RiskQuizInnerPage'))
const RiskResultsPage = lazy(() => import('@/pages/risk/RiskResultsPage'))
const RecommendationsPage = lazy(() => import('@/pages/portfolio/RecommendationsPage'))
const TrackersHubPage = lazy(() => import('@/pages/trackers/TrackersHubPage'))
const NetWorthPage = lazy(() => import('@/pages/trackers/NetWorthPage'))
const DebtPage = lazy(() => import('@/pages/trackers/DebtPage'))
const PortfolioTrackerPage = lazy(() => import('@/pages/trackers/PortfolioTrackerPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'))
const PlannerPage = lazy(() => import('@/pages/planner/PlannerPage'))

function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-trust border-t-transparent" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing routes */}
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="disclosures" element={<DisclosuresPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      {/* Auth */}
      <Route path="auth" element={<AuthLayout />}>
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/auth/register" replace />} />
      </Route>

      {/* Protected app routes */}
      <Route
        path="app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="onboarding" element={<OnboardingPage />}>
          <Route index element={<Navigate to="step-1" replace />} />
          <Route path="step-1" element={<WelcomeStep />} />
          <Route path="step-2" element={<PersonalInfoStep />} />
          <Route path="step-3" element={<ExperienceStep />} />
          <Route path="step-4" element={<ConfirmationStep />} />
        </Route>

        <Route path="dashboard" element={<Suspense fallback={<PageSpinner />}><DashboardPage /></Suspense>} />
        <Route path="goals" element={<Suspense fallback={<PageSpinner />}><GoalsListPage /></Suspense>} />
        <Route path="goals/new" element={<Suspense fallback={<PageSpinner />}><NewGoalPage /></Suspense>} />
        <Route path="goals/:id" element={<Suspense fallback={<PageSpinner />}><GoalDetailPage /></Suspense>} />
        <Route path="risk" element={<Suspense fallback={<PageSpinner />}><RiskQuizPage /></Suspense>} />
        <Route path="risk/quiz" element={<Suspense fallback={<PageSpinner />}><RiskQuizInnerPage /></Suspense>} />
        <Route path="risk/results" element={<Suspense fallback={<PageSpinner />}><RiskResultsPage /></Suspense>} />
        <Route path="portfolio" element={<Suspense fallback={<PageSpinner />}><RecommendationsPage /></Suspense>} />
        <Route path="planner" element={<Suspense fallback={<PageSpinner />}><PlannerPage /></Suspense>} />
        <Route path="trackers" element={<Suspense fallback={<PageSpinner />}><TrackersHubPage /></Suspense>} />
        <Route path="trackers/net-worth" element={<Suspense fallback={<PageSpinner />}><NetWorthPage /></Suspense>} />
        <Route path="trackers/debt" element={<Suspense fallback={<PageSpinner />}><DebtPage /></Suspense>} />
        <Route path="trackers/portfolio" element={<Suspense fallback={<PageSpinner />}><PortfolioTrackerPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageSpinner />}><SettingsPage /></Suspense>} />
        <Route path="admin" element={<Suspense fallback={<PageSpinner />}><AdminPage /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
