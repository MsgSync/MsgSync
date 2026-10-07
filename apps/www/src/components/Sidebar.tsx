'use client';
import Link from 'next/link';

export default function Sidebar() {
    return (
        <aside style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem' }}>
            <nav>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '1rem' }}>
                        <Link href="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                        <Link href="/campaigns">Campaigns</Link>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}
