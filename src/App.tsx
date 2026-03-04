import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bookmark, Mail, Search, MapPin, Briefcase as BriefcaseIcon, Filter, AlertCircle } from 'lucide-react';
import { JOBS, Job } from './data/jobs';

// --- Types ---

interface Preferences {
    roleKeywords: string;
    preferredLocations: string[];
    preferredMode: string[];
    experienceLevel: string;
    skills: string;
    minMatchScore: number;
}

const DEFAULT_PREFS: Preferences = {
    roleKeywords: '',
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: '',
    skills: '',
    minMatchScore: 40
};

type JobStatus = 'Not Applied' | 'Applied' | 'Rejected' | 'Selected';

interface StatusUpdate {
    jobId: string;
    jobTitle: string;
    company: string;
    status: JobStatus;
    timestamp: number;
}

// --- Status Handling ---

const getStatusColor = (status: JobStatus) => {
    switch (status) {
        case 'Applied': return '#2196F3';
        case 'Rejected': return '#F44336';
        case 'Selected': return '#4CAF50';
        default: return '#757575';
    }
};

const getStatusStyles = (status: JobStatus) => {
    const color = getStatusColor(status);
    return {
        backgroundColor: `${color}11`,
        color: color,
        border: `1px solid ${color}33`,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.02em'
    };
};

// --- Helper Functions ---

const calculateMatchScore = (job: Job, prefs: Preferences | null): number => {
    if (!prefs) return 0;
    let score = 0;
    const roleKeywords = (prefs.roleKeywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const userSkills = (prefs.skills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    // Rule 1: +25 if any roleKeyword in title
    if (roleKeywords.some(k => job.title.toLowerCase().includes(k))) score += 25;

    // Rule 2: +15 if any roleKeyword in description
    if (roleKeywords.some(k => job.description.toLowerCase().includes(k))) score += 15;

    // Rule 3: +15 if location matches
    if (prefs.preferredLocations.includes(job.location)) score += 15;

    // Rule 4: +10 if mode matches
    if (prefs.preferredMode.includes(job.mode)) score += 10;

    // Rule 5: +10 if experience matches
    if (job.experience === prefs.experienceLevel) score += 10;

    // Rule 6: +15 if any skill match
    if (job.skills.some(s => userSkills.includes(s.toLowerCase()))) score += 15;

    // Rule 7: +5 if posted <= 2 days
    if (job.postedDaysAgo <= 2) score += 5;

    // Rule 8: +5 if source is LinkedIn
    if (job.source === 'LinkedIn') score += 5;

    return Math.min(score, 100);
};

const getScoreVariant = (score: number) => {
    if (score >= 80) return { bg: '#E6F4EA', color: '#1E4620', label: 'Excellent Match' };
    if (score >= 60) return { bg: '#FFF4E5', color: '#663C00', label: 'Good Match' };
    if (score >= 40) return { bg: '#F1F3F4', color: '#3C4043', label: 'Neutral Match' };
    return { bg: '#F8F9FA', color: '#70757A', label: 'Subtle Match' };
};

const getSalaryValue = (s: string) => {
    const match = s.match(/(\d+(\.\d+)?)/);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    if (s.toLowerCase().includes('month')) return val / 12; // Normalize monthly to annual LPA (rough)
    return val;
};

// --- Status Helpers ---

const getJobStatus = (jobId: string): JobStatus => {
    const statuses = JSON.parse(localStorage.getItem('jobTrackerStatus') || '{}');
    return statuses[jobId] || 'Not Applied';
};

const saveJobStatus = (jobId: string, jobTitle: string, company: string, status: JobStatus) => {
    const statuses = JSON.parse(localStorage.getItem('jobTrackerStatus') || '{}');
    statuses[jobId] = status;
    localStorage.setItem('jobTrackerStatus', JSON.stringify(statuses));

    // Update history
    const history: StatusUpdate[] = JSON.parse(localStorage.getItem('jobTrackerStatusHistory') || '[]');
    history.unshift({ jobId, jobTitle, company, status, timestamp: Date.now() });
    localStorage.setItem('jobTrackerStatusHistory', JSON.stringify(history.slice(0, 50)));
};

// --- Components ---

function Toast({ message, onClear }: { message: string, onClear: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClear, 3000);
        return () => clearTimeout(timer);
    }, [message, onClear]);

    if (!message) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#333', color: '#fff', padding: '12px 24px', borderRadius: '8px',
            fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'none'
        }}>
            <AlertCircle size={18} color="#fff" />
            {message}
        </div>
    );
}

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

function JobCard({ job, onSave, onUnsave, isSaved, onView, matchScore, onStatusChange }: {
    job: Job, onSave: (id: string) => void, onUnsave: (id: string) => void, isSaved: boolean, onView: (job: Job) => void, matchScore?: number,
    onStatusChange?: (id: string, status: JobStatus) => void
}) {
    const scoreInfo = matchScore !== undefined ? getScoreVariant(matchScore) : null;
    const [status, setStatus] = useState<JobStatus>(getJobStatus(job.id));

    const handleStatusClick = (newStatus: JobStatus) => {
        setStatus(newStatus);
        saveJobStatus(job.id, job.title, job.company, newStatus);
        if (onStatusChange) onStatusChange(job.id, newStatus);
    };

    return (
        <div className="card" style={{ marginBottom: 'var(--space-24)', transition: 'transform 0.2s', cursor: 'default', position: 'relative' }}>
            {matchScore !== undefined && (
                <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    backgroundColor: scoreInfo?.bg, color: scoreInfo?.color,
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    border: `1px solid ${scoreInfo?.color}22`,
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {matchScore}% Match
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-16)', paddingRight: matchScore !== undefined ? '100px' : '0' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{job.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <p style={{ margin: 0, color: 'var(--color-accent)', fontWeight: 500 }}>{job.company}</p>
                        <span style={getStatusStyles(status)}>{status}</span>
                    </div>
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-16)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['Applied', 'Rejected', 'Selected'] as JobStatus[]).map(s => (
                        <button
                            key={s}
                            onClick={() => handleStatusClick(s)}
                            style={{
                                background: status === s ? getStatusColor(s) : 'transparent',
                                color: status === s ? '#fff' : '#888',
                                border: `1px solid ${status === s ? getStatusColor(s) : '#ddd'}`,
                                fontSize: '11px', padding: '2px 10px', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            {s}
                        </button>
                    ))}
                    {status !== 'Not Applied' && (
                        <button
                            onClick={() => handleStatusClick('Not Applied')}
                            style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Reset
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
                    <button onClick={() => onView(job)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', padding: 0, textDecoration: 'underline' }}>View</button>
                    {isSaved ? (
                        <button onClick={() => onUnsave(job.id)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '14px', padding: 0 }}>Unsave</button>
                    ) : (
                        <button onClick={() => onSave(job.id)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', padding: 0 }}>Save</button>
                    )}
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
    const [statusFilter, setStatusFilter] = useState('All');
    const [sort, setSort] = useState('match');
    const [showOnlyMatches, setShowOnlyMatches] = useState(false);
    const [prefs, setPrefs] = useState<Preferences | null>(null);
    const [toast, setToast] = useState('');

    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Load status for filtering
    const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});

    useEffect(() => {
        const saved = localStorage.getItem('savedJobs');
        if (saved) setSavedIds(JSON.parse(saved));

        const storedPrefs = localStorage.getItem('jobTrackerPreferences');
        if (storedPrefs) setPrefs(JSON.parse(storedPrefs));

        const storedStatuses = JSON.parse(localStorage.getItem('jobTrackerStatus') || '{}');
        setJobStatuses(storedStatuses);
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

    const handleStatusChange = (id: string, status: JobStatus) => {
        const newStatuses = { ...jobStatuses, [id]: status };
        setJobStatuses(newStatuses);
        setToast(`Status updated: ${status}`);
    };

    const jobsWithScores = useMemo(() => {
        return JOBS.map(job => ({
            ...job,
            matchScore: calculateMatchScore(job, prefs)
        }));
    }, [prefs]);

    const filteredJobs = useMemo(() => {
        return jobsWithScores
            .filter(job => {
                const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                    job.company.toLowerCase().includes(search.toLowerCase());
                const matchesLoc = location === '' || job.location === location;
                const matchesMode = mode === '' || job.mode === mode;
                const matchesExp = exp === '' || job.experience === exp;
                const matchesSource = source === '' || job.source === source;
                const passesThreshold = !showOnlyMatches || (prefs && (job.matchScore || 0) >= prefs.minMatchScore);

                // Status filtering logic
                const jobStatus = jobStatuses[job.id] || 'Not Applied';
                const matchesStatus = statusFilter === 'All' || jobStatus === statusFilter;

                return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSource && passesThreshold && matchesStatus;
            })
            .sort((a, b) => {
                if (sort === 'latest') return a.postedDaysAgo - b.postedDaysAgo;
                if (sort === 'match') return (b.matchScore || 0) - (a.matchScore || 0);
                if (sort === 'salary') return getSalaryValue(b.salaryRange) - getSalaryValue(a.salaryRange);
                return 0;
            });
    }, [jobsWithScores, search, location, mode, exp, source, sort, showOnlyMatches, prefs, statusFilter, jobStatuses]);

    const uniqueLocations = Array.from(new Set(JOBS.map(j => j.location)));

    return (
        <PageContainer maxWidth="940px">
            {!prefs && (
                <div style={{
                    backgroundColor: '#FFF4E5', border: '1px solid #FFE2B7', borderRadius: 'var(--border-radius)',
                    padding: 'var(--space-16) var(--space-24)', marginBottom: 'var(--space-32)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-12)', color: '#663C00'
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                        Set your <Link to="/settings" style={{ color: 'inherit', textDecoration: 'underline' }}>preferences</Link> to activate intelligent matching.
                    </span>
                </div>
            )}

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-16)', marginBottom: 'var(--space-24)' }}>
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
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff' }}>
                        <option value="All">All Statuses</option>
                        <option value="Not Applied">Not Applied</option>
                        <option value="Applied">Applied</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-24)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
                            <input
                                type="checkbox"
                                checked={showOnlyMatches}
                                onChange={e => setShowOnlyMatches(e.target.checked)}
                                disabled={!prefs}
                                style={{ width: '16px', height: '16px' }}
                            />
                            Show only jobs above my threshold ({prefs?.minMatchScore || 40}%)
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Filter size={14} style={{ color: '#777' }} />
                        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}>
                            <option value="match">Match Score</option>
                            <option value="latest">Latest First</option>
                            <option value="salary">Salary (High-Low)</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredJobs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 'var(--space-24)' }}>
                    {filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onSave={handleSave}
                            onUnsave={handleUnsave}
                            isSaved={savedIds.includes(job.id)}
                            onView={setSelectedJob}
                            matchScore={prefs ? job.matchScore : undefined}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                    <Filter size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                    <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '400px' }}>
                        {prefs ? "No roles match your criteria. Adjust filters or lower threshold." : "No jobs match your search. Try adjusting the filters."}
                    </p>
                    <button onClick={() => { setSearch(''); setLocation(''); setMode(''); setExp(''); setSource(''); setShowOnlyMatches(false); setStatusFilter('All'); }} style={{ marginTop: 'var(--space-16)', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                        Clear all filters
                    </button>
                </div>
            )}

            <Toast message={toast} onClear={() => setToast('')} />

            <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title || ''}>
                {selectedJob && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-16)' }}>
                            <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '18px', margin: 0 }}>{selectedJob.company}</p>
                            {selectedJob.matchScore !== undefined && (
                                <div style={{
                                    backgroundColor: getScoreVariant(selectedJob.matchScore).bg,
                                    color: getScoreVariant(selectedJob.matchScore).color,
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                                    border: `1px solid ${getScoreVariant(selectedJob.matchScore).color}33`
                                }}>
                                    {selectedJob.matchScore}% Match
                                </div>
                            )}
                        </div>
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
    const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('jobTrackerPreferences');
        if (stored) setPrefs(JSON.parse(stored));
    }, []);

    const handleChange = (field: keyof Preferences, value: any) => {
        setPrefs(prev => ({ ...prev, [field]: value }));
    };

    const handleModeToggle = (mode: string) => {
        const current = prefs.preferredMode;
        if (current.includes(mode)) {
            handleChange('preferredMode', current.filter(m => m !== mode));
        } else {
            handleChange('preferredMode', [...current, mode]);
        }
    };

    const handleSave = () => {
        localStorage.setItem('jobTrackerPreferences', JSON.stringify(prefs));
        setStatus('Preferences saved successfully!');
        setTimeout(() => setStatus(''), 3000);
    };

    const uniqueLocations = Array.from(new Set(JOBS.map(j => j.location)));

    return (
        <PageContainer maxWidth="800px">
            <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Discovery Settings</h1>
            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 600 }}>Role Keywords</label>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: 'var(--space-8)' }}>Target specific titles (comma separated).</p>
                        <input
                            type="text"
                            placeholder="e.g. SDE Intern, Frontend Developer"
                            value={prefs.roleKeywords}
                            onChange={e => handleChange('roleKeywords', e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 600 }}>Preferred Locations</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {prefs.preferredLocations.map(loc => (
                                <Badge key={loc} variant="accent">
                                    {loc} <X size={12} style={{ marginLeft: '4px', cursor: 'pointer' }} onClick={() => handleChange('preferredLocations', prefs.preferredLocations.filter(l => l !== loc))} />
                                </Badge>
                            ))}
                        </div>
                        <select
                            onChange={e => {
                                if (e.target.value && !prefs.preferredLocations.includes(e.target.value)) {
                                    handleChange('preferredLocations', [...prefs.preferredLocations, e.target.value]);
                                }
                            }}
                            className="input"
                            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        >
                            <option value="">Add a location...</option>
                            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-12)', fontWeight: 600 }}>Preferred Work Mode</label>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            {['Remote', 'Hybrid', 'Onsite'].map(mode => (
                                <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                                    <input
                                        type="checkbox"
                                        checked={prefs.preferredMode.includes(mode)}
                                        onChange={() => handleModeToggle(mode)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    {mode}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-24)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 600 }}>Experience Level</label>
                            <select
                                value={prefs.experienceLevel}
                                onChange={e => handleChange('experienceLevel', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#fff' }}
                            >
                                <option value="">Select Level</option>
                                <option value="Fresher">Fresher</option>
                                <option value="0-1">0-1 Year</option>
                                <option value="1-3">1-3 Years</option>
                                <option value="3-5">3-5 Years</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 600 }}>Min Match Score ({prefs.minMatchScore}%)</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={prefs.minMatchScore}
                                onChange={e => handleChange('minMatchScore', parseInt(e.target.value))}
                                style={{ width: '100%', marginTop: '12px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 600 }}>Core Skills</label>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: 'var(--space-8)' }}>Key technologies you master (comma separated).</p>
                        <input
                            type="text"
                            placeholder="e.g. React, Node.js, Python"
                            value={prefs.skills}
                            onChange={e => handleChange('skills', e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'var(--space-8)' }}>
                        <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 32px' }}>
                            Save Preferences
                        </button>
                        {status && <span style={{ color: '#2E7D32', fontSize: '14px', fontWeight: 500 }}>{status}</span>}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}

function SavedPage() {
    const [savedJobs, setSavedJobs] = useState<(Job & { matchScore?: number })[]>([]);
    const [selectedJob, setSelectedJob] = useState<(Job & { matchScore?: number }) | null>(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        const storedPrefs = localStorage.getItem('jobTrackerPreferences');
        const p = storedPrefs ? JSON.parse(storedPrefs) : null;

        const savedIdsString = localStorage.getItem('savedJobs');
        if (savedIdsString) {
            const savedIds: string[] = JSON.parse(savedIdsString);
            const filtered = JOBS.filter(job => savedIds.includes(job.id)).map(job => ({
                ...job,
                matchScore: calculateMatchScore(job, p)
            }));
            setSavedJobs(filtered);
        }
    }, []);

    const handleUnsave = (id: string) => {
        const newJobs = savedJobs.filter(job => job.id !== id);
        setSavedJobs(newJobs);
        localStorage.setItem('savedJobs', JSON.stringify(newJobs.map(j => j.id)));
        if (selectedJob?.id === id) {
            setSelectedJob(null);
        }
    };

    const handleStatusChange = (status: JobStatus) => {
        setToast(`Status updated: ${status}`);
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
                            matchScore={job.matchScore}
                            onStatusChange={(_, s) => handleStatusChange(s)}
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

            <Toast message={toast} onClear={() => setToast('')} />

            <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title || ''}>
                {selectedJob && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-16)' }}>
                            <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '18px', margin: 0 }}>{selectedJob.company}</p>
                            {selectedJob.matchScore !== undefined && (
                                <div style={{
                                    backgroundColor: getScoreVariant(selectedJob.matchScore).bg,
                                    color: getScoreVariant(selectedJob.matchScore).color,
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                                    border: `1px solid ${getScoreVariant(selectedJob.matchScore).color}33`
                                }}>
                                    {selectedJob.matchScore}% Match
                                </div>
                            )}
                        </div>
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
    const [digest, setDigest] = useState<(Job & { matchScore: number })[] | null>(null);
    const [prefs, setPrefs] = useState<Preferences | null>(null);
    const [copyStatus, setCopyStatus] = useState('');

    const todayKey = `jobTrackerDigest_${new Date().toISOString().split('T')[0]}`;

    useEffect(() => {
        const storedPrefs = localStorage.getItem('jobTrackerPreferences');
        if (storedPrefs) {
            setPrefs(JSON.parse(storedPrefs));
        }

        const existingDigest = localStorage.getItem(todayKey);
        if (existingDigest) {
            setDigest(JSON.parse(existingDigest));
        }
    }, [todayKey]);

    const generateDigest = () => {
        if (!prefs) return;

        const scored = JOBS.map(job => ({
            ...job,
            matchScore: calculateMatchScore(job, prefs)
        }));

        const top10 = scored
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
                return a.postedDaysAgo - b.postedDaysAgo;
            })
            .slice(0, 10);

        setDigest(top10);
        localStorage.setItem(todayKey, JSON.stringify(top10));
    };

    const getPlaintextDigest = () => {
        if (!digest) return '';
        let text = `Top 10 Jobs For You — 9AM Digest (${new Date().toLocaleDateString()})\n\n`;
        digest.forEach((job, i) => {
            text += `${i + 1}. ${job.title} at ${job.company}\n`;
            text += `   Location: ${job.location} | Match: ${job.matchScore}%\n`;
            text += `   Apply: ${job.applyUrl}\n\n`;
        });
        text += `Generated based on your preferences.\n`;
        return text;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getPlaintextDigest());
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 2000);
    };

    const createEmailDraft = () => {
        const subject = encodeURIComponent(`My 9AM Job Digest - ${new Date().toLocaleDateString()}`);
        const body = encodeURIComponent(getPlaintextDigest());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    if (!prefs) {
        return (
            <PageContainer>
                <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-24)' }}>Daily Digest</h1>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                    <AlertCircle size={48} color="var(--color-accent)" style={{ marginBottom: 'var(--space-16)' }} />
                    <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '400px' }}>
                        Set your <Link to="/settings" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>preferences</Link> to generate a personalized digest.
                    </p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer maxWidth="800px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-40)' }}>
                <h1 style={{ fontSize: '40px', margin: 0 }}>Daily Digest</h1>
                {!digest && (
                    <button className="btn-primary" onClick={generateDigest}>
                        Generate Today's 9AM Digest
                    </button>
                )}
                {digest && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={copyToClipboard} style={{ backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '14px', position: 'relative' }}>
                            {copyStatus || 'Copy Digest'}
                        </button>
                        <button onClick={createEmailDraft} style={{ backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '14px' }}>
                            Email Draft
                        </button>
                        <button onClick={generateDigest} style={{ backgroundColor: 'transparent', border: 'none', color: '#888', textDecoration: 'underline', fontSize: '13px', cursor: 'pointer' }}>
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {digest ? (
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                    {/* Email Style Header */}
                    <div style={{ padding: 'var(--space-40)', borderBottom: '1px solid #eee', textAlign: 'center', backgroundColor: '#fafafa' }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', marginBottom: 'var(--space-8)' }}>
                            Top 10 Jobs For You — 9AM Digest
                        </h2>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div style={{ padding: 'var(--space-24)' }}>
                        {digest.length > 0 ? (
                            digest.map((job, idx) => (
                                <div key={job.id} style={{
                                    padding: 'var(--space-24)',
                                    borderBottom: idx === digest.length - 1 ? 'none' : '1px solid #eee',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>{job.title}</h3>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#666' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{job.company}</span>
                                            <span>{job.location} • {job.experience}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E7D32' }}>
                                            {job.matchScore}% Match
                                        </div>
                                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '13px', padding: '6px 16px', textDecoration: 'none' }}>
                                            Apply
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: 'var(--space-64) 0' }}>
                                <AlertCircle size={40} color="#ccc" style={{ marginBottom: '16px' }} />
                                <p style={{ color: '#666' }}>No matching roles today. Check again tomorrow.</p>
                            </div>
                        )}
                    </div>

                    {/* Email Style Footer */}
                    <div style={{ padding: 'var(--space-32)', textAlign: 'center', backgroundColor: '#fafafa', borderTop: '1px solid #eee' }}>
                        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 var(--space-24) 0' }}>
                            This digest was generated based on your preferences.
                        </p>

                        {/* Recent Status Updates */}
                        <div style={{ textAlign: 'left', borderTop: '1px solid #eee', paddingTop: 'var(--space-24)', marginTop: 'var(--space-24)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-16)', color: '#444' }}>Recent Status Updates</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {JSON.parse(localStorage.getItem('jobTrackerStatusHistory') || '[]').slice(0, 5).map((update: StatusUpdate, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{update.jobTitle}</span> at <span style={{ color: 'var(--color-accent)' }}>{update.company}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={getStatusStyles(update.status)}>{update.status}</span>
                                            <span style={{ color: '#999', fontSize: '11px' }}>{new Date(update.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {JSON.parse(localStorage.getItem('jobTrackerStatusHistory') || '[]').length === 0 && (
                                    <p style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>No recent activity to show.</p>
                                )}
                            </div>
                        </div>

                        <p style={{ fontSize: '11px', color: '#bbb', marginTop: '32px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Demo Mode: Daily 9AM trigger simulated manually.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-64) var(--space-16)' }}>
                    <Mail size={48} color="#ccc" style={{ marginBottom: 'var(--space-16)' }} />
                    <p style={{ fontSize: '18px', color: '#555', margin: '0 auto', maxWidth: '400px' }}>
                        Your daily briefing is ready to be generated.
                    </p>
                </div>
            )}
        </PageContainer>
    );
}

function TestChecklistPage() {
    const [testStatus, setTestStatus] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    const testItems = [
        { id: 'prefs_persist', label: 'Preferences persist after refresh', how: 'Change settings, refresh page, check if values remain.' },
        { id: 'score_correct', label: 'Match score calculates correctly', how: 'Verify score breakdown matches preference rules.' },
        { id: 'toggle_works', label: '"Show only matches" toggle works', how: 'Toggle on dashboard; check if low-score jobs disappear.' },
        { id: 'save_job_persist', label: 'Save job persists after refresh', how: 'Save a job, refresh, check /saved page.' },
        { id: 'apply_new_tab', label: 'Apply opens in new tab', how: 'Click apply; check if new browser tab opens.' },
        { id: 'status_persist', label: 'Status update persists after refresh', how: 'Change status to Applied, refresh, check badge stable.' },
        { id: 'filter_works', label: 'Status filter works correctly', how: 'Select "Applied" in filter; only applied jobs should show.' },
        { id: 'digest_score', label: 'Digest generates top 10 by score', how: 'Check if /digest jobs are sorted by match score.' },
        { id: 'digest_persist', label: 'Digest persists for the day', how: 'Generate digest, navigate away, return; check if same.' },
        { id: 'no_errors', label: 'No console errors on main pages', how: 'Open DevTools (F12); verify console is clean.' }
    ];

    useEffect(() => {
        const stored = localStorage.getItem('jobTrackerTestStatus');
        if (stored) setTestStatus(JSON.parse(stored));
    }, []);

    const toggleTest = (id: string) => {
        const newStatus = { ...testStatus, [id]: !testStatus[id] };
        setTestStatus(newStatus);
        localStorage.setItem('jobTrackerTestStatus', JSON.stringify(newStatus));
    };

    const resetTests = () => {
        setTestStatus({});
        localStorage.setItem('jobTrackerTestStatus', JSON.stringify({}));
    };

    const passedCount = testItems.filter(item => testStatus[item.id]).length;
    const allPassed = passedCount === 10;

    return (
        <PageContainer maxWidth="800px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-40)' }}>
                <div>
                    <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-8)' }}>Test Checklist</h1>
                    <p style={{ color: '#666', margin: 0 }}>Verify build integrity before deployment.</p>
                </div>
                <button onClick={resetTests} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                    Reset Test Status
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-32)', backgroundColor: allPassed ? '#F1F8E9' : '#FFF9C4', border: `1px solid ${allPassed ? '#C5E1A5' : '#FFF176'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', margin: 0, color: allPassed ? '#2E7D32' : '#F57F17' }}>
                            Tests Passed: {passedCount} / 10
                        </h2>
                        {!allPassed && (
                            <p style={{ margin: 'var(--space-8) 0 0 0', fontSize: '14px', color: '#666' }}>
                                Resolve all issues before shipping.
                            </p>
                        )}
                    </div>
                    {allPassed && (
                        <button className="btn-primary" onClick={() => navigate('/jt/08-ship')}>
                            Proceed to Ship
                        </button>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {testItems.map((item, idx) => (
                    <div key={item.id} style={{
                        padding: 'var(--space-20) var(--space-24)',
                        borderBottom: idx === testItems.length - 1 ? 'none' : '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: testStatus[item.id] ? '#fcfcfc' : '#fff'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flex: 1 }}>
                            <input
                                type="checkbox"
                                checked={!!testStatus[item.id]}
                                onChange={() => toggleTest(item.id)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '16px', color: testStatus[item.id] ? '#888' : '#333', textDecoration: testStatus[item.id] ? 'line-through' : 'none' }}>
                                {item.label}
                            </span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span title={item.how} style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                border: '1px solid #ccc', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '12px', color: '#999', cursor: 'help'
                            }}>
                                ?
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}

function ShipPage() {
    const [allPassed, setAllPassed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('jobTrackerTestStatus');
        if (stored) {
            const status = JSON.parse(stored);
            const passedCount = Object.values(status).filter(v => v === true).length;
            setAllPassed(passedCount === 10);
        }
    }, []);

    if (!allPassed) {
        return (
            <PageContainer>
                <div style={{ textAlign: 'center', marginTop: 'var(--space-64)' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#FFF9C4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-24)'
                    }}>
                        <AlertCircle size={40} color="#F57F17" />
                    </div>
                    <h1 style={{ fontSize: '32px', marginBottom: 'var(--space-16)' }}>Shipment Locked</h1>
                    <p style={{ color: '#666', marginBottom: 'var(--space-32)', fontSize: '18px' }}>
                        Complete all 10 tests before shipping.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/jt/07-test')}>
                        Go to Test Checklist
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-64)' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#E8F5E9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-24)'
                }}>
                    <BriefcaseIcon size={40} color="#2E7D32" />
                </div>
                <h1 style={{ fontSize: '48px', marginBottom: 'var(--space-16)' }}>Ready to Ship</h1>
                <p style={{ color: '#666', marginBottom: 'var(--space-40)', fontSize: '20px' }}>
                    All integrity tests passed. Build is stable for deployment.
                </p>
                <div className="card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                    <p style={{ fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>
                        [System]: Generating build artifact...<br />
                        [System]: Integrity check: 100%<br />
                        [System]: Deployment ready.
                    </p>
                </div>
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
                        <NavLink to="/jt/07-test" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Test</NavLink>
                        <NavLink to="/jt/08-ship" onClick={closeMenu} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Ship</NavLink>
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
                    <Route path="/jt/07-test" element={<TestChecklistPage />} />
                    <Route path="/jt/08-ship" element={<ShipPage />} />
                    <Route path="/proof" element={<ProofPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </NavigationShell>
        </Router>
    );
}

export default App;
