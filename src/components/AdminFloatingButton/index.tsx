'use client';

import { useState, useEffect } from 'react';

interface AuthUser {
  name: string;
  role: string;
}

export default function AdminFloatingButton() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Only check auth if the cookie exists (avoids noisy 401 in console)
    if (!document.cookie.includes('cloudiezzz_token')) return;

    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  if (!user) return null;

  const dashboardUrl = user.role === 'creator' ? '/admin/creator' : '/admin';

  return (
    <a href={dashboardUrl} style={styles.button} title={`Dashboard (${user.name})`}>
      <span style={styles.icon}>&#9881;</span>
    </a>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    position: 'fixed',
    bottom: 24,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#2a2418',
    color: '#fef08a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    zIndex: 999,
    transition: 'transform 0.2s, opacity 0.2s',
    opacity: 0.6,
  },
  icon: {
    fontSize: 20,
    lineHeight: 1,
  },
};
