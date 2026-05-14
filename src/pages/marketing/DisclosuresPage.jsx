import { Helmet } from 'react-helmet-async'
import { Badge } from '@/components/ui/badge'

export default function DisclosuresPage() {
  return (
    <>
      <Helmet>
        <title>Disclosures — FinPath</title>
        <meta name="description" content="FinPath legal disclosures. Educational financial tool — not personalized investment advice." />
      </Helmet>

      <div className="container max-w-3xl py-16">
        <Badge variant="outline" className="mb-4">Legal</Badge>
        <h1 className="text-3xl font-bold mb-2">Disclosures &amp; Disclaimers</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Educational Purpose Only</h2>
            <p>
              FinPath is an educational financial planning tool. All content, calculations, projections,
              and suggested allocations displayed on FinPath are for informational and educational
              purposes only. They do not constitute financial advice, investment recommendations,
              or solicitations to buy or sell any financial instrument.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Not SEBI Registered</h2>
            <p>
              FinPath is not registered with the Securities and Exchange Board of India (SEBI) as
              an Investment Adviser under the SEBI (Investment Advisers) Regulations, 2013. The
              platform does not take into account your individual financial circumstances beyond
              what you self-report through the risk questionnaire.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">No Guarantee of Returns</h2>
            <p>
              Past performance of any investment or financial instrument is not a guarantee or indicator
              of future performance. All CAGR estimates, return projections, and portfolio allocations
              shown are illustrative only. Actual returns may vary significantly. All investments carry
              risk, including the possible loss of principal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Consult a Qualified Adviser</h2>
            <p>
              Always consult a SEBI-registered Investment Adviser or a Certified Financial Planner (CFP)
              before making any investment decisions. Do not rely solely on FinPath for financial decision-making.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Data &amp; Accuracy</h2>
            <p>
              Fund data, expense ratios, and CAGR figures shown in the instrument catalog are sourced
              from publicly available information and may not be current. Always verify with the fund
              house or AMFI before investing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Anonymous Usage</h2>
            <p>
              FinPath uses anonymous authentication. No personally identifiable information (PII) is
              required to use the platform. The name you provide is stored only to personalise your
              dashboard experience and is not shared with third parties.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
