export default function NotFound() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>404 — Page not found</h1>
      <p style={{ marginTop: '0.5rem' }}>
        <a href="/dashboard">Back to dashboard</a>
      </p>
    </div>
  );
}
