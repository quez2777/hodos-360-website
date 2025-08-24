import React from "react"

const trustedBy = [
  { name: "AmLaw 100", description: "Top 100 Law Firms" },
  { name: "BigLaw Partners", description: "Leading Legal Practices" },
  { name: "State Bar Association", description: "Certified Excellence" },
  { name: "Legal Tech Awards", description: "Innovation Leader" },
  { name: "Fortune 500 Legal", description: "Enterprise Trusted" },
  { name: "Innovation Awards", description: "AI Pioneer" },
]

const TrustSection = React.memo(function TrustSection() {
  return (
    <section className="py-20 border-y bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Trusted by industry leaders
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {trustedBy.map((company) => (
              <div
                key={company.name}
                className="flex flex-col items-center justify-center group"
              >
                <div className="text-2xl font-bold text-muted-foreground/50 group-hover:text-muted-foreground transition-colors duration-300">
                  {company.name}
                </div>
                <div className="text-xs text-muted-foreground/40 mt-1 group-hover:text-muted-foreground/60 transition-colors duration-300">
                  {company.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
})

TrustSection.displayName = 'TrustSection'

export { TrustSection }