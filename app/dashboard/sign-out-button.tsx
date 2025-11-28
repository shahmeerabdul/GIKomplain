import { LogOut } from 'lucide-react'
import styles from './dashboard.module.css'
import { signOut } from './actions'

export default function SignOutButton() {
    return (
        <form action={signOut}>
            <button type="submit" className={styles.navItem} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <LogOut size={18} />
                Sign Out
            </button>
        </form>
    )
}
