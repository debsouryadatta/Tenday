import { Component, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Compass, TriangleAlert } from 'lucide-react';
import { Banner, Button, ButtonLink, Empty, Loading } from './components/ui';
import { Sidebar, TabBar } from './components/shell';
import { useApp } from './lib/app-state';
import { GoalPage } from './features/goal';
import { History, Today } from './features/today';
import { MealPage } from './features/meal';
import { AddReport, ReportDetail, Reports } from './features/reports';
import { AccountPage } from './features/auth';
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
      <Empty
        icon={TriangleAlert}
        title="Let’s get you back"
        action={
          <Button
            onClick={() => window.location.assign(import.meta.env.BASE_URL)}
          >
            Back to Today
          </Button>
        }
      >
        This page couldn’t open. Your saved records and drafts are safe.
      </Empty>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  const { profile, pending, retry, discard } = useApp(),
    location = useLocation();
  if (profile === undefined) return <Loading />;
  if (profile === null) return <GoalPage />;
  const chat = location.pathname === '/assistant';
  return (
    <div className={`app-shell ${chat ? 'is-chat' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar />
      <main id="main" className="main-content" tabIndex={-1}>
        {pending.length > 0 && (
          <div className="pending-list">
            {pending.map((item) => (
              <Banner
                key={item.operationId}
                tone={item.status === 'failed' ? 'error' : 'info'}
                title={
                  item.status === 'failed'
                    ? 'This entry needs attention'
                    : 'Waiting to save'
                }
                action={
                  item.status === 'failed' ? (
                    <div className="row">
                      <Button size="small" onClick={() => retry(item.operationId)}>
                        Retry
                      </Button>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => discard(item.operationId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : undefined
                }
              >
                {item.error ?? 'Kept on this device. It saves when you’re connected.'}
              </Banner>
            ))}
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
                <Empty
                  icon={Compass}
                  title="A small detour"
                  action={<ButtonLink to="/">Back to Today</ButtonLink>}
                >
                  This page isn’t here.
                </Empty>
              }
            />
          </Routes>
        </PageBoundary>
      </main>
      <TabBar />
    </div>
  );
}
