export default function TestPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Test Page</h1>
      <p>If you can see this, the app directory is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}