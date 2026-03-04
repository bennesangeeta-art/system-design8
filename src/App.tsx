import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{ padding: 'var(--space-64) var(--space-64)', maxWidth: '720px' }}>
            <h1 style={{ fontSize: '48px', marginBottom: 'var(--space-16)' }}>{title}</h1>
            <p style={{ fontSize: '18px', color: '#555', margin: 0 }}>This section will be built in the next step.</p>
        </div>
    );
}

function NotFoundPage() {
    return (
        <div style={{ padding: 'var(--space-64) var(--space-64)', maxWidth: '720px' }}>
            <h1 style={{ fontSize: '48px', marginBottom: 'var(--space-16)' }}>Page Not Found</h1>
            <p style={{ fontSize: '18px', color: '#555', margin: 0 }}>The page you are looking for does not exist.</p>
        </div>
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
                            Job Notification App
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
                    <Route path="/" element={<PlaceholderPage title="Job Notification App" />} />
                    <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
                    <Route path="/saved" element={<PlaceholderPage title="Saved" />} />
                    <Route path="/digest" element={<PlaceholderPage title="Digest" />} />
                    <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
                    <Route path="/proof" element={<PlaceholderPage title="Proof" />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </NavigationShell>
        </Router>
    );
}

export default App;
