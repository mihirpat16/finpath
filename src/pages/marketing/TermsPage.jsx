import { Helmet } from 'react-helmet-async'
import { Badge } from '@/components/ui/badge'

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — FinPath</title>
        <meta name="description" content="FinPath terms of service." />
      </Helmet>

      <div className="container max-w-3xl py-16">
        <Badge variant="outline" className="mb-4">Legal</Badge>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Acceptance</h2>
            <p>
              By using FinPath you agree to these terms. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Educational use only</h2>
            <p>
              FinPath is provided strictly as an educational tool. You acknowledge that no content on
              this platform constitutes financial advice and that you will not make investment decisions
              based solely on information from FinPath.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">No warranty</h2>
            <p>
              FinPath is provided "as is" without warranty of any kind. We do not guarantee the
              accuracy, completeness, or timeliness of any information displayed. Calculations are
              illustrative and based on assumed rates of return.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Limitation of liability</h2>
            <p>
              FinPath and its creators shall not be liable for any financial losses, damages, or
              consequences arising from your use of this platform or reliance on its content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Modifications</h2>
            <p>
              We may update these terms at any time. Continued use of FinPath after changes constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Governing law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to the
              jurisdiction of courts in India.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
