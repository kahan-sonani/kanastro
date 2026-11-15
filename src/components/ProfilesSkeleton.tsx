export function ProfilesSkeleton() {
  return (
    <section className="profiles-skeleton" role="status" aria-label="Loading profiles" aria-busy="true">
      <div aria-hidden="true">
        <div className="page-heading">
          <span className="skeleton skeleton-heading" />
          <div className="heading-actions">
            <span className="skeleton skeleton-button" />
            <span className="skeleton skeleton-button" />
          </div>
        </div>
        <div className="library-toolbar">
          <span className="skeleton skeleton-label" />
          <div className="library-tools">
            <span className="skeleton skeleton-search" />
            <span className="skeleton skeleton-button" />
          </div>
        </div>
        <div className="profile-grid">
          {[0, 1, 2].map((card) => (
            <div className="profile-card skeleton-card" key={card}>
              <div className="profile-card-top">
                <span className="skeleton skeleton-avatar" />
                <span className="skeleton skeleton-menu" />
              </div>
              <span className="skeleton skeleton-name" />
              <span className="skeleton skeleton-detail" />
              <span className="skeleton skeleton-detail skeleton-short" />
              <div className="profile-card-footer">
                <span className="skeleton skeleton-label" />
                <span className="skeleton skeleton-menu" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AppSkeleton() {
  return (
    <div className="app-shell app-skeleton">
      <aside className="sidebar" aria-hidden="true">
        <div className="sidebar-header"><span className="skeleton skeleton-brand" /></div>
        <div className="skeleton-navigation">
          {[0, 1, 2].map((item) => (
            <div className="skeleton-nav-row" key={item}>
              <span className="skeleton skeleton-menu" />
              <span className="skeleton skeleton-label" />
            </div>
          ))}
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar" aria-hidden="true"><span className="skeleton skeleton-label" /></header>
        <main className="content"><ProfilesSkeleton /></main>
      </div>
    </div>
  );
}
