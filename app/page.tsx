import Link from 'next/link'

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          marginBottom: '1.5rem',
          letterSpacing: '-0.05em',
          background: 'linear-gradient(to bottom right, #fff, #a1a1aa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          GIKOmplain
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--muted-foreground)',
          marginBottom: '3rem',
          lineHeight: '1.75'
        }}>
          The official complaint management system for GIKI. <br />
          Simple. Efficient. Transparent.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/login"
            className="btn btn-primary"
            style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn btn-outline"
            style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}
          >
            Register
          </Link>
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          <p>Restricted Access: Please log in with your university credentials.</p>
        </div>
      </div>
    </div>
  )
}
