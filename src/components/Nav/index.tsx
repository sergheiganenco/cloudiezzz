'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`site-nav${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="nav-brand">
        Cloudie<span>zzz</span>
      </Link>
      <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '\u00d7' : '\u2630'}
      </button>
      <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
        <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
          Order
        </Link>
        <Link href="/reviews" className={`nav-link${pathname === '/reviews' ? ' active' : ''}`}>
          Reviews
        </Link>
        <Link href="/refer" className={`nav-link${pathname === '/refer' ? ' active' : ''}`}>
          Refer
        </Link>
        <Link href="/contact" className={`nav-link${pathname === '/contact' ? ' active' : ''}`}>
          Contact
        </Link>
        <Link href="/#commission" className="nav-cta">
          Get Started ✿
        </Link>
      </div>
    </nav>
  );
}
