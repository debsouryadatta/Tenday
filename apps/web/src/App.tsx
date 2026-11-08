import { Component, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Files,
  House,
  MessageCircle,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { Banner, Brand, Button, Loading } from './components/ui';
import { useApp } from './lib/app-state';
import { GoalPage } from './features/goal';
import { History, Today } from './features/today';
import { MealPage } from './features/meal';
import { AddReport, ReportDetail, Reports } from './features/reports';
import { AccountPage } from './features/auth';
import { useIdentity } from '../../mobile/src/lib/auth-session';
import { Assistant } from './features/assistant';
class PageBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <section className="empty">
        <h1>This page could not open.</h1>
        <p>
          It may be unavailable or the connection needs a moment. Your saved
          records are kept.
        </p>
        <Button
          onClick={() => window.location.assign(import.meta.env.BASE_URL)}
        >
          Back to Today
        </Button>
      </section>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  const { account } = useIdentity();
  const { profile, pending, retry, discard } = useApp(),
    location = useLocation();
  if (profile === undefined) return <Loading />;
  if (profile === null) return <GoalPage />;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Main navigation">
          {[
            { to: '/', title: 'Today', icon: House },
            { to: '/assistant', title: 'Assistant', icon: MessageCircle },
            { to: '/reports', title: 'Reports', icon: Files },
          ].map((item) => (
            <NavLink
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              key={item.to}
              to={item.to}
            >
              <item.icon size={22} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
        <Link
          className="account-pill"
          to="/account"
          aria-label="Profiles and account"
        >
          <span className="demo-avatar">{account?.name.slice(0, 1)}</span>
          <span>
            <strong>{account?.name}</strong>
            <small>{account?.demo ? 'Shared demo' : 'Personal account'}</small>
          </span>
        </Link>
        <div className="sidebar-foot">
          <ShieldCheck size={21} />
          <p>
            {account?.demo ? 'A shared demo.' : 'Your personal space.'}
            <br />A little care, every day.
          </p>
          <Link className="text-link" to="/goal">
            <Settings2 size={17} />
            Your preferences
          </Link>
        </div>
      </aside>
      <div className="mobile-header">
        <Brand />
        <Link
          className="icon-button"
          aria-label="Profiles and account"
          to="/account"
        >
          <span className="demo-avatar">{account?.name.slice(0, 1)}</span>
        </Link>
      </div>
      <main id="main" className="main-content" tabIndex={-1}>
        {pending.map((item) => (
          <Banner key={item.operationId} error={item.status === 'failed'}>
            <strong>
              {item.status === 'failed'
                ? 'An entry needs your attention'
                : 'An entry is waiting to save'}
            </strong>
            <p>
              {item.error ??
                'It is kept on this device and will save when connected.'}
            </p>
            {item.status === 'failed' && (
              <div className="row">
                <Button
                  variant="secondary"
                  onClick={() => retry(item.operationId)}
                >
                  Retry
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => discard(item.operationId)}
                >
                  Discard pending entry
                </Button>
              </div>
            )}
          </Banner>
        ))}
        {account?.demo && (
          <div className="demo-mode">
            <strong>Shared demo · {account.name}</strong>
            <span>Fictional data. Changes are visible to everyone.</span>
            <Link to="/account">Switch profile</Link>
          </div>
        )}
        <PageBoundary key={location.pathname}>
          <Routes>
            <Route index element={<Today />} />
            <Route
              path="account"
              element={
                <>
                  <Today />
                  <AccountPage />
                </>
              }
            />
            <Route path="history" element={<History />} />
            <Route
              path="goal"
              element={
                <>
                  <Today />
                  <GoalPage editing />
                </>
              }
            />
            <Route
              path="meal"
              element={
                <>
                  <Today />
                  <MealPage />
                </>
              }
            />
            <Route
              path="meal/:id"
              element={
                <>
                  <Today />
                  <MealPage />
                </>
              }
            />
            <Route path="assistant" element={<Assistant />} />
            <Route path="reports" element={<Reports />} />
            <Route
              path="reports/new"
              element={
                <>
                  <Reports />
                  <AddReport />
                </>
              }
            />
            <Route path="reports/:id" element={<ReportDetail />} />
            <Route
              path="*"
              element={
                <section className="empty">
                  <h1>A small detour.</h1>
                  <p>This page isn’t here.</p>
                  <Link className="button primary" to="/">
                    Back to Today
                  </Link>
                </section>
              }
            />
          </Routes>
        </PageBoundary>
      </main>
    </div>
  );
}
