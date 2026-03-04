import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Briefcase, Bookmark, Mail } from 'lucide-react';

function PageContainer({ children, maxWidth = '720px' }: { children: React.ReactNode, maxWidth?: string }) {
    return (
        <main style={{ padding: 'var(--space-64) var(--space-64)', maxWidth }}>
            {children}
        </main>
    );
}

function LandingPage() {
    const navigate = useNavigate();
    return (
        <PageContainer maxWidth="800px">
            <div style={{ marginTop: 'var(--space-64)' }}>
                <h1 style={{ fontSize: '64px', marginBottom: 'var(--space-24)', fontWeight: 700 }}>
                    Stop Missing The Right Jobs.
                </h1>
                <p style={{ fontSize: '20px', color: '#555', marginBottom: 'var(--space-40)', maxWidth: '600px' }}>
                    Precision-matched job discovery delivered daily at 9AM.
                </p>
                <button className="btn-primary" onClick={() => navigate('/settings')} style={{ fontSize: '18px', padding: '12px 32px' }}>
                    Start Tracking
                </button>
            </div>
        </PageContainer>
    );
}

function DashboardPage() {
    return (
        <PageContainer>
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Dashboard</h1>
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                <Briefcase size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '400px' }}>
                    No jobs yet. In the next step, you will load a realistic dataset.
                </p>
            </div>
        </PageContainer>
    );
}

function SettingsPage() {
    return (
        <PageContainer>
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Discovery Settings</h1>
            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 500 }}>Role Keywords</label>
                        <input type="text" placeholder="e.g. Senior Frontend Engineer, Product Designer" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 500 }}>Preferred Locations</label>
                        <input type="text" placeholder="e.g. Remote, New York, London" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 500 }}>Work Mode</label>
                            <select style={{ width: '100%', padding: 'var(--space-8)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', background: 'transparent' }}>
                                <option>Remote</option>
                                <option>Hybrid</option>
                                <option>Onsite</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 500 }}>Experience Level</label>
                            <select style={{ width: '100%', padding: 'var(--space-8)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', background: 'transparent' }}>
                                <option>Entry Level</option>
                                <option>Mid-Senior</option>
                                <option>Director</option>
                                <option>Executive</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 'var(--space-8)' }}>
                        Save Preferences
                    </button>
                </div>
            </div>
        </PageContainer>
    );
}

function SavedPage() {
    return (
        <PageContainer>
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Saved Jobs</h1>
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                <Bookmark size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '450px' }}>
                    Your saved opportunities will appear here. Track the roles that matter most to your career journey.
                </p>
            </div>
        </PageContainer>
    );
}

function DigestPage() {
    return (
        <PageContainer>
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Daily Digest</h1>
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                <Mail size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '400px' }}>
                    In the future, this section will provide a curated daily summary of the best matches found across the web.
                </p>
            </div>
        </PageContainer>
    );
}

function ProofPage() {
    return (
        <PageContainer>
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Proof of Delivery</h1>
            <p style={{ fontSize: '18px', color: '#555' }}>
                Technical logs and artifact validation for the current build session.
            </p>
            <div className="card" style={{ marginTop: 'var(--space-32)' }}>
                <div style={{ opacity: 0.5 }}>
                    <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>[System]: Ready for dataset integration...</p>
                </div>
            </div>
        </PageContainer>
    );
}

function NotFoundPage() {
    return (
        <PageContainer>
            <h1 style={{ fontSize: '48px', marginBottom: 'var(--space-16)' }}>Page Not Found</h1>
            <p style={{ fontSize: '18px', color: '#555', margin: 0 }}>The page you are looking for does not exist.</p>
        </PageContainer>
    );
}

function NavigationShell({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <header className="shared-top-nav">
                <div className="nav-container">
                    <div className="nav-brand">
                        <Link to="/" onClick={closeMenu} style={{ textDecoration: 'none', color: 'inherit' }}>
                            Job Notification Tracker
                        </Link>
                    </div>

                    <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                        <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
                        <NavLink to="/saved" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Saved</NavLink>
                        <NavLink to="/digest" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Digest</NavLink>
                        <NavLink to="/settings" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Settings</NavLink>
                        <NavLink to="/proof" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Proof</NavLink>
                    </nav>
                </div>
            </header>
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                {children}
            </div>
        </>
    );
}

function App() {
    return (
        <Router>
            <NavigationShell>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/saved" element={<SavedPage />} />
                    <Route path="/digest" element={<DigestPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/proof" element={<ProofPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </NavigationShell>
        </Router>
    );
}

export default App;
