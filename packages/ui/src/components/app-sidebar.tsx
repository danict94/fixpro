'use client';

import React from 'react';
import { LogOut, X } from 'lucide-react';
import { cn } from '../lib/cn';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  cta?: boolean;
}

export interface AppSidebarProps {
  navItems: NavItem[];
  currentPath: string;
  user: { name: string; email: string; image?: string };
  onLogout: () => void;
  onClose?: () => void;
}

export function AppSidebar({
  navItems,
  currentPath,
  user,
  onLogout,
  onClose,
}: AppSidebarProps) {
  return (
    <aside className="flex h-full flex-col px-4 py-6">
      {/* MOBILE HEADER */}
      {onClose && (
        <div className="mb-6 flex items-center justify-between">
          <span className="font-semibold text-secondary">
            Fix<span className="text-primary">Pro</span>
          </span>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* DESKTOP LOGO */}
      {!onClose && (
        <div className="mb-8">
          <span className="text-lg font-semibold text-secondary">
            Fix<span className="text-primary">Pro</span>
          </span>
        </div>
      )}

      {/* NAV */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = currentPath === item.href;

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-sm transition',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-secondary',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-6 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
            {user.name?.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-secondary">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>

          <button type="button" onClick={onLogout}>
            <LogOut className="h-4 w-4 text-muted-foreground hover:text-danger" />
          </button>
        </div>
      </div>
    </aside>
  );
}