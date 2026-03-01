import React from "react";
import Link from "next/link";

const RELEASE_URL = "https://github.com/ockhamdev/desktop/releases/latest";

const features = [
  {
    icon: "⟁",
    title: "CodeScan",
    desc: "Parse every file in your project and extract syntax units — functions, classes, interfaces, types — into a structured, searchable catalogue.",
  },
  {
    icon: "◈",
    title: "Spec Tests",
    desc: "Define specification-level tests that link directly to syntax units. Group them hierarchically and track coverage across your entire codebase.",
  },
  {
    icon: "▣",
    title: "AI Stories",
    desc: "Feed your code structure and spec tests to AI. Get intelligent story breakdowns, issue discovery, and actionable improvement suggestions.",
  },
  {
    icon: "◉",
    title: "Unit Tests",
    desc: "Manage and organise unit test cases alongside your specs. Keep a single source of truth for what is tested and what is not.",
  },
  {
    icon: "⬡",
    title: "Source Viewer",
    desc: "Browse any file with full syntax highlighting, line-level navigation, and instant lookups — all without leaving the app.",
  },
  {
    icon: "◆",
    title: "Notes & Docs",
    desc: "Capture decisions, context, and architectural notes in Markdown. Keep project knowledge close to the code it describes.",
  },
];

export default function Home() {
  return (
    <div className="page-wrapper">
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            Ock<span>ham</span>
          </Link>
          <div className="nav-links">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#download" className="nav-link">
              Download
            </a>
            <a href={RELEASE_URL} className="nav-cta" target="_blank" rel="noopener noreferrer">
              Get Ockham
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">Now available for macOS</div>
        <h1 className="hero-title">
          Test-driven delivery,
          <br />
          powered by <em>AI collaboration</em>
        </h1>
        <p className="hero-subtitle">
          Ockham scans your codebase, maps every syntax unit, and collaborates
          with AI to turn specifications into verified, working software.
        </p>
        <div className="hero-actions">
          <a href={RELEASE_URL} className="btn-primary" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download for Mac
          </a>
          <a href="#features" className="btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 16 16 12 12 8" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Learn More
          </a>
        </div>
        <p className="hero-platform">macOS · Apple Silicon & Intel · Free</p>
      </section>

      {/* ── Features ── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Capabilities</div>
            <h2 className="section-title">
              Everything you need for
              <br />
              specification-driven development
            </h2>
            <p className="section-desc">
              From scanning your codebase to generating AI-powered stories,
              Ockham brings structure and intelligence to your delivery workflow.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download ── */}
      <section className="section download-section" id="download">
        <div className="container download-content">
          <div className="section-header">
            <div className="section-label">Download</div>
            <h2 className="section-title">Get Ockham for macOS</h2>
            <p className="section-desc">
              Choose the version for your Mac architecture.
              Both are free and always will be.
            </p>
          </div>

          <div className="download-cards">
            <a href={RELEASE_URL} className="download-card" target="_blank" rel="noopener noreferrer">
              <div className="download-icon">🍎</div>
              <div className="download-arch">Apple Silicon</div>
              <div className="download-chip">M1 / M2 / M3 / M4</div>
            </a>
            <a href={RELEASE_URL} className="download-card" target="_blank" rel="noopener noreferrer">
              <div className="download-icon">💻</div>
              <div className="download-arch">Intel Mac</div>
              <div className="download-chip">x86_64</div>
            </a>
          </div>

          <p className="download-hint">
            On first launch, right-click the app → Open (required for unsigned apps).
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-logo">
            Ock<span>ham</span>
          </div>
          <div className="footer-links">
            <a href="#features" className="footer-link">
              Features
            </a>
            <a href="#download" className="footer-link">
              Download
            </a>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Ockham. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
