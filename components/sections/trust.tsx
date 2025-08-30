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
    <section className="py-20 border-y border-[#FFD700]/20 bg-[#0A0F1C]">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#FFD700] uppercase tracking-[0.2em]">
            Trusted by industry leaders
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {trustedBy.map((company) => (
              <div
                key={company.name}
                className="flex flex-col items-center justify-center group"
              >
                <div className="text-2xl font-bold text-white/50 group-hover:text-[#FFD700] transition-all duration-300">
                  {company.name}
                </div>
                <div className="text-xs text-white/40 mt-1 group-hover:text-white/70 transition-all duration-300">
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