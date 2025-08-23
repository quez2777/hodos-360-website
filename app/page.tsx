import { getPageRevalidation } from "@/lib/cache-config"

// Enable ISR with 1 hour revalidation for homepage
export const revalidate = getPageRevalidation('home')

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '2rem', background: 'linear-gradient(to right, #3b82f6, #eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          HODOS 360
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '3rem', color: '#888' }}>
          AI-Powered Legal Tech Solutions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
          <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>HODOS</h2>
            <p style={{ color: '#888' }}>Complete AI Law Firm Management</p>
          </div>
          <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Marketing Platform</h2>
            <p style={{ color: '#888' }}>AI SEO and Paid Marketing</p>
          </div>
          <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>VIDEO Agents</h2>
            <p style={{ color: '#888' }}>AI Reception and Sales Systems</p>
          </div>
        </div>
      </div>
    </div>
  )
}