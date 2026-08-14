'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
      <button onClick={() => reset()} style={{ marginTop: '1rem' }}>
        Try again
      </button>
    </div>
  );
}
