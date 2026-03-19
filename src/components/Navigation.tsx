'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Daily', icon: '◉' },
  { href: '/weekly', label: 'Weekly', icon: '▦' },
  { href: '/goals', label: 'Goals', icon: '◎' },
  { href: '/pipeline', label: 'Pipeline', icon: '◈' },
  { href: '/revenue', label: 'Revenue', icon: '$' },
  { href: '/linkedin', label: 'LinkedIn', icon: 'in' },
  { href: '/curriculum', label: 'Curriculum', icon: '▤' },
  { href: '/gtm-brief', label: 'GTM Brief', icon: '⚡' },
  { href: '/sleep', label: 'Sleep', icon: '☾' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-50 bg-bg border-r border-white/5">
        {/* Collapsed sidebar for md screens */}
        <div className="lg:hidden flex flex-col items-center py-6 px-2 w-20 gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mb-4">
            <span className="font-heading font-bold text-white text-sm">OS</span>
          </div>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-mono transition-all ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-bg-card text-text-muted hover:bg-accent-dim hover:text-accent'
                }`}
                title={item.label}
              >
                {item.icon}
              </Link>
            );
          })}
        </div>

        {/* Expanded sidebar for lg screens */}
        <div className="hidden lg:flex flex-col py-6 px-4 w-64 gap-2">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="font-heading font-bold text-white text-sm">OS</span>
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-text">Personal OS</h1>
              <p className="text-xs text-text-muted font-mono">v1.0</p>
            </div>
          </div>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-body transition-all ${
                  active
                    ? 'bg-accent text-white font-medium'
                    : 'text-text-muted hover:bg-accent-dim hover:text-accent'
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-xs font-mono">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-white/5 px-2 py-2">
        <div className="flex justify-around items-center overflow-x-auto gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center min-w-[44px] min-h-[44px] justify-center rounded-full px-2 py-1 text-xs transition-all ${
                  active
                    ? 'bg-accent text-white'
                    : 'text-text-muted'
                }`}
              >
                <span className="text-base font-mono">{item.icon}</span>
                <span className="text-[10px] mt-0.5 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
