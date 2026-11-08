import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  House,
  Plus,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { DemoSlug } from '@tenday/domain';
import { useIdentity } from '../../../mobile/src/lib/auth-session';
import { Avatar, Brand, Chip, type AvatarTone } from './ui';
import { AssistantMark } from './assistant-mark';

export const DEMO_TONES: Record<DemoSlug, AvatarTone> = {
  maya: 'lime',
  arjun: 'protein',
  leah: 'fat',
};
export const NAV: { to: string; title: string; icon: LucideIcon }[] = [
  { to: '/', title: 'Today', icon: House },
  { to: '/assistant', title: 'Assistant', icon: Sparkles },
  { to: '/reports', title: 'Reports', icon: FileText },
];
export function useAccountAvatar() {
  const { account } = useIdentity();
  return {
    account,
    initial: account?.name?.slice(0, 1).toUpperCase() ?? '·',
    tone: (account?.demo ? DEMO_TONES[account.demo] : 'ink') as AvatarTone,
  };
}

/** Phone header: brand, shared-demo chip and account avatar. Hidden on desktop. */
export function AccountBar() {
  const { account, initial, tone } = useAccountAvatar();
  return (
    <div className="account-bar">
      <Brand />
      <div className="account-bar-end">
        {account?.demo && <Chip label="Shared demo" tone="lime" to="/account" />}
        <Link to="/account" className="avatar-link" aria-label="Profiles and account">
          <Avatar label={initial} size={40} tone={tone} />
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { account, initial, tone } = useAccountAvatar();
  const navigate = useNavigate();
  return (
    <aside className="sidebar" aria-label="Tenday">
      <Brand />
      <button
        type="button"
        className="button primary medium sidebar-log"
        onClick={() => navigate('/meal')}
      >
        <Plus className="button-icon" size={19} strokeWidth={2.6} />
        <span>Log a meal</span>
      </button>
      <nav aria-label="Main navigation">
        {NAV.map((item) => (
          <NavLink
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            key={item.to}
            to={item.to}
          >
            {({ isActive }) => (
              <>
                {item.to === '/assistant' ? (
                  <AssistantMark
                    size={24}
                    kind={isActive ? 'full' : 'line'}
                    color="currentColor"
                    halo={isActive ? 'var(--ink)' : 'var(--screen)'}
                  />
                ) : (
                  <item.icon size={21} strokeWidth={2.1} />
                )}
                <span>{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          to="/goal"
        >
          <SlidersHorizontal size={21} strokeWidth={2.1} />
          <span>Goal & preferences</span>
        </NavLink>
      </nav>
      <Link className="account-card" to="/account" aria-label="Profiles and account">
        <Avatar label={initial} size={42} tone={tone} />
        <span>
          <strong>{account?.name}</strong>
          <small>{account?.demo ? 'Shared demo' : account?.email ?? 'Personal account'}</small>
        </span>
      </Link>
    </aside>
  );
}

/** Phone/tablet bottom navigation with the raised log-a-meal action. */
export function TabBar() {
  const navigate = useNavigate();
  return (
    <nav className="tab-bar" aria-label="Main navigation">
      <div className="tab-bar-inner">
        {NAV.map((item) => (
          <NavLink
            end={item.to === '/'}
            key={item.to}
            to={item.to}
            className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {item.to === '/assistant' ? (
                  <AssistantMark
                    size={26}
                    kind={isActive ? 'full' : 'line'}
                    color="var(--muted)"
                    halo="var(--screen)"
                  />
                ) : (
                  <item.icon size={23} />
                )}
                <span>{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          className="tab-fab"
          aria-label="Log a meal"
          onClick={() => navigate('/meal')}
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
      </div>
    </nav>
  );
}
