import { Helmet } from 'react-helmet-async'
import { Badge } from '@/components/ui/badge'

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — FinPath</title>
        <meta name="description" content="FinPath privacy policy — how we handle your data." />
      </Helmet>

      <div className="container max-w-3xl py-16">
        <Badge variant="outline" className="mb-4">Legal</Badge>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What we collect</h2>
            <p>
              FinPath collects only the information you choose to provide: a display name (optional),
              financial goals, risk quiz answers, net worth entries, debt records, and portfolio holdings.
              We do not collect email addresses, phone numbers, or government-issued identifiers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How we store it</h2>
            <p>
              All data is stored in Supabase (PostgreSQL) with row-level security. Only your anonymous
              user account can read or write your data. We do not have access to your financial entries
              in the normal course of operations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Cookies</h2>
            <p>
              We use a single functional cookie to remember your cookie consent preference. No
              third-party advertising or analytics cookies are set. You can dismiss the cookie banner
              to clear this preference.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Third parties</h2>
            <p>
              We do not sell, share, or transfer your data to third parties. The only third-party
              service used is Supabase for database hosting, which is bound by its own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Deletion</h2>
            <p>
              Because FinPath uses anonymous authentication, you can delete all your data by clearing
              your browser's local storage. There is no account recovery mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
            <p>
              This is a personal project. For questions, raise an issue on the project's GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
