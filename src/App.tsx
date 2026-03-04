import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Briefcase, Bookmark, Mail, Search, MapPin, Briefcase as BriefcaseIcon, Clock, ExternalLink, ChevronRight, Filter } from 'lucide-react';
import { JOBS, Job } from './data/jobs';

// --- Components ---

function Badge({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'accent' | 'muted' }) {
    const styles: Record<string, React.CSSProperties> = {
        default: { backgroundColor: '#eee', color: '#333' },
        accent: { backgroundColor: 'var(--color-accent)', color: '#fff' },
        muted: { backgroundColor: '#f0f0f0', color: '#777', border: '1px solid #ddd' }
    };
    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            ...styles[variant]
        }}>
            {children}
        </span>
    );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 'var(--space-24)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--color-bg)', padding: 'var(--space-40)', borderRadius: 'var(--border-radius)',
                maxWidth: '600px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', marginBottom: 'var(--space-24)' }}>{title}</h2>
                {children}
            </div>
        </div>
    );
}

function JobCard({ job, onSave, onUnsave, isSaved, onView }: { job: Job, onSave: (id: string) => void, onUnsave: (id: string) => void, isSaved: boolean, onView: (job: Job) => void }) {
    return (
        <div className="card" style={{ marginBottom: 'var(--space-24)', transition: 'transform 0.2s', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-16)' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{job.title}</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--color-accent)', fontWeight: 500 }}>{job.company}</p>
                </div>
                <Badge variant="muted">{job.source}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', marginBottom: 'var(--space-16)', fontSize: '14px', color: '#555' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {job.location} • {job.mode}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BriefcaseIcon size={14} /> {job.experience}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                    <span style={{ fontWeight: 600, color: '#111' }}>{job.salaryRange}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', marginBottom: 'var(--space-24)' }}>
                {job.skills.slice(0, 3).map(skill => (
                    <Badge key={skill}>{skill}</Badge>
                ))}
                {job.skills.length > 3 && <span style={{ fontSize: '12px', color: '#777' }}>+{job.skills.length - 3} more</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-16)' }}>
                <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {job.postedDaysAgo === 0 ? 'Today' : `${job.postedDaysAgo} days ago`}
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
                    <button onClick={() => onView(job)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', padding: 0, textDecoration: 'underline' }}>View</button>
                    {isSaved ? (
                        <button onClick={() => onUnsave(job.id)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '14px', padding: 0 }}>Unsave</button>
                    ) : (
                        <button onClick={() => onSave(job.id)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', padding: 0 }}>Save</button>
                    )}
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        Apply <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
}

function PageContainer({ children, maxWidth = '720px' }: { children: React.ReactNode, maxWidth?: string }) {
    return (
        <main style={{ padding: 'var(--space-40) var(--space-24)', maxWidth, margin: '0 auto' }}>
            {children}
        </main>
    );
}

// --- Pages ---

function LandingPage() {
    const navigate = useNavigate();
    return (
        <PageContainer maxWidth="800px">
            <div style={{ marginTop: 'var(--space-64)', textAlign: 'center' }}>
                <h1 style={{ fontSize: '64px', marginBottom: 'var(--space-24)', fontWeight: 700 }}>
                    Stop Missing The Right Jobs.
                </h1>
                <p style={{ fontSize: '20px', color: '#555', marginBottom: 'var(--space-40)', maxWidth: '600px', margin: '0 auto var(--space-40)' }}>
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
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');
    const [mode, setMode] = useState('');
    const [exp, setExp] = useState('');
    const [source, setSource] = useState('');
    const [sort, setSort] = useState('latest');

    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('savedJobs');
        if (saved) setSavedIds(JSON.parse(saved));
    }, []);

    const handleSave = (id: string) => {
        const newSaved = [...savedIds, id];
        setSavedIds(newSaved);
        localStorage.setItem('savedJobs', JSON.stringify(newSaved));
    };

    const handleUnsave = (id: string) => {
        const newSaved = savedIds.filter(savedId => savedId !== id);
        setSavedIds(newSaved);
        localStorage.setItem('savedJobs', JSON.stringify(newSaved));
    };

    const filteredJobs = useMemo(() => {
        return JOBS
            .filter(job => {
                const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                    job.company.toLowerCase().includes(search.toLowerCase());
                const matchesLoc = location === '' || job.location === location;
                const matchesMode = mode === '' || job.mode === mode;
                const matchesExp = exp === '' || job.experience === exp;
                const matchesSource = source === '' || job.source === source;
                return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSource;
            })
            .sort((a, b) => {
                if (sort === 'latest') return a.postedDaysAgo - b.postedDaysAgo;
                return 0;
            });
    }, [search, location, mode, exp, source, sort]);

    const uniqueLocations = Array.from(new Set(JOBS.map(j => j.location)));

    return (
        <PageContainer maxWidth="900px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-40)' }}>
                <div>
                    <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-8)' }}>Dashboard</h1>
                    <p style={{ color: '#666', margin: 0 }}>Discover your next role with precision.</p>
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                    Showing {filteredJobs.length} results
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ marginBottom: 'var(--space-40)', padding: 'var(--space-24)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-16)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                        <input
                            type="text"
                            placeholder="Search title, company..."
                            style={{ paddingLeft: '36px' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select value={location} onChange={e => setLocation(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff' }}>
                        <option value="">All Locations</option>
                        {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <select value={mode} onChange={e => setMode(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff' }}>
                        <option value="">All Modes</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">Onsite</option>
                    </select>
                    <select value={exp} onChange={e => setExp(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff' }}>
                        <option value="">All Experience</option>
                        <option value="Fresher">Fresher</option>
                        <option value="0-1">0-1 Year</option>
                        <option value="1-3">1-3 Years</option>
                        <option value="3-5">3-5 Years</option>
                    </select>
                    <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff' }}>
                        <option value="latest">Latest First</option>
                    </select>
                </div>
            </div>

            {filteredJobs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-24)' }}>
                    {filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onSave={handleSave}
                            onUnsave={handleUnsave}
                            isSaved={savedIds.includes(job.id)}
                            onView={setSelectedJob}
                        />
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                    <Filter size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                    <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '400px' }}>
                        No jobs match your search. Try adjusting the filters.
                    </p>
                    <button onClick={() => { setSearch(''); setLocation(''); setMode(''); setExp(''); setSource(''); }} style={{ marginTop: 'var(--space-16)', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                        Clear all filters
                    </button>
                </div>
            )}

            <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title || ''}>
                {selectedJob && (
                    <>
                        <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '18px', marginBottom: 'var(--space-16)' }}>{selectedJob.company}</p>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-24)', color: '#666', fontSize: '14px' }}>
                            <span>{selectedJob.location} • {selectedJob.mode}</span>
                            <span>{selectedJob.experience}</span>
                            <Badge variant="accent">{selectedJob.salaryRange}</Badge>
                        </div>
                        <div style={{ marginBottom: 'var(--space-32)' }}>
                            <h4 style={{ fontSize: '16px', marginBottom: 'var(--space-8)' }}>Description</h4>
                            <p style={{ lineHeight: 1.8, color: '#444' }}>{selectedJob.description}</p>
                        </div>
                        <div style={{ marginBottom: 'var(--space-40)' }}>
                            <h4 style={{ fontSize: '16px', marginBottom: 'var(--space-8)' }}>Core Skills</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedJob.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                                Apply Now
                            </a>
                            <button onClick={() => {
                                if (savedIds.includes(selectedJob.id)) handleUnsave(selectedJob.id);
                                else handleSave(selectedJob.id);
                            }} style={{ flex: 0.5, backgroundColor: '#fff', border: '1px solid #ddd', color: '#333' }}>
                                {savedIds.includes(selectedJob.id) ? 'Unsave' : 'Save'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
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
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        const savedIdsString = localStorage.getItem('savedJobs');
        if (savedIdsString) {
            const savedIds: string[] = JSON.parse(savedIdsString);
            setSavedJobs(JOBS.filter(job => savedIds.includes(job.id)));
        }
    }, []);

    const handleUnsave = (id: string) => {
        const newJobs = savedJobs.filter(job => job.id !== id);
        setSavedJobs(newJobs);
        localStorage.setItem('savedJobs', JSON.stringify(newJobs.map(j => j.id)));
    };

    return (
        <PageContainer maxWidth="900px">
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-8)' }}>Saved Jobs</h1>
            <p style={{ color: '#666', marginBottom: 'var(--space-40)' }}>Opportunities you're tracking for the future.</p>

            {savedJobs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-24)' }}>
                    {savedJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onSave={() => { }}
                            onUnsave={handleUnsave}
                            isSaved={true}
                            onView={setSelectedJob}
                        />
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                    <Bookmark size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                    <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '450px' }}>
                        Your saved items are empty. Explore the dashboard to find roles worth tracking.
                    </p>
                    <Link to="/dashboard" style={{ display: 'inline-block', marginTop: 'var(--space-16)', color: 'var(--color-accent)', fontWeight: 600 }}>Explore Jobs</Link>
                </div>
            )}

            <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title || ''}>
                {selectedJob && (
                    <>
                        <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '18px', marginBottom: 'var(--space-16)' }}>{selectedJob.company}</p>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-24)', color: '#666', fontSize: '14px' }}>
                            <span>{selectedJob.location} • {selectedJob.mode}</span>
                            <span>{selectedJob.experience}</span>
                            <Badge variant="accent">{selectedJob.salaryRange}</Badge>
                        </div>
                        <div style={{ marginBottom: 'var(--space-32)' }}>
                            <h4 style={{ fontSize: '16px', marginBottom: 'var(--space-8)' }}>Description</h4>
                            <p style={{ lineHeight: 1.8, color: '#444' }}>{selectedJob.description}</p>
                        </div>
                        <div style={{ marginBottom: 'var(--space-40)' }}>
                            <h4 style={{ fontSize: '16px', marginBottom: 'var(--space-8)' }}>Core Skills</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedJob.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                                Apply Now
                            </a>
                            <button onClick={() => handleUnsave(selectedJob.id)} style={{ flex: 0.5, backgroundColor: '#fff', border: '1px solid #ddd', color: '#333' }}>
                                Unsave
                            </button>
                        </div>
                    </>
                )}
            </Modal>
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
                    <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>[System]: Data integration successful. 60 records loaded.</p>
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
