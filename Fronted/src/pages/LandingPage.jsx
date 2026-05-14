import React, { useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Link as LinkIcon,
  PieChart,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
} from "lucide-react";
import BrandName from "../components/BrandName.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import PollResults from "../components/PollResults.jsx";
import ThemeButton from "../components/ThemeButton.jsx";
import { demoPoll, landingFlows } from "../constants/demoPoll.js";

const features = [
  {
    icon: <Plus size={22} />,
    title: "Create",
    text: "Build polls with questions, options, expiry, and mandatory choices.",
  },
  {
    icon: <LinkIcon size={22} />,
    title: "Share",
    text: "Send one public link that works instantly for participants.",
  },
  {
    icon: <Smartphone size={22} />,
    title: "Protect",
    text: "Use device-based vote tracking to reduce repeat voting.",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Visualize",
    text: "Publish clean charts only when the creator is ready.",
  },
];

export default function LandingPage({ theme, onToggleTheme, onNavigate }) {
  const [activeFlow, setActiveFlow] = useState(landingFlows[0]);

  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <BrandName />
        <div className="nav-actions">
          <a href="#flow">Flow</a>
          <a href="#features">Features</a>
          <ThemeButton theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={16} />
            Real-time polling
          </span>
          <h1>Turn any room into a live decision.</h1>
          <p>
            NM Polling gives creators a simple way to ask, share, protect votes,
            and publish visual results in real time.
          </p>
          <div className="hero-actions">
            <button
              className="primary-btn"
              onClick={() => onNavigate("/dashboard")}
            >
              Get started
              <ChevronRight size={18} />
            </button>
            <a className="secondary-btn" href="#flow">
              See how it works
            </a>
          </div>
          <div className="trust-row">
            <span>
              <ShieldCheck size={16} />
              Device vote guard
            </span>
            <span>
              <Timer size={16} />
              Live updates
            </span>
            <span>
              <PieChart size={16} />
              Creator analytics
            </span>
          </div>
        </div>

        <div
          className="hero-visual compact-visual"
          aria-label="NM Polling product preview"
        >
          <div className="browser-dots">
            <span />
            <span />
            <span />
          </div>
          <PollResults
            poll={demoPoll}
            isDemo
            onCopy={() => {}}
            onPublish={() => {}}
            onClose={() => {}}
            compact
          />
        </div>
      </section>

      <section className="flow-section" id="flow">
        <div className="section-heading">
          <p className="eyebrow">Product flow</p>
          <h2>Three steps, no noise.</h2>
        </div>
        <div className="flow-grid">
          <div className="flow-tabs">
            {landingFlows.map((flow) => (
              <button
                className={activeFlow.key === flow.key ? "active" : ""}
                key={flow.key}
                onClick={() => setActiveFlow(flow)}
                type="button"
              >
                <span>{flow.label}</span>
                <strong>{flow.title}</strong>
              </button>
            ))}
          </div>
          <div className="flow-preview">
            <span className="flow-metric">{activeFlow.metric}</span>
            <h3>{activeFlow.title}</h3>
            <p>{activeFlow.text}</p>
            <div className={`flow-device ${activeFlow.key}`}>
              <Activity size={22} />
              <span>{activeFlow.label}</span>
              <div />
            </div>
          </div>
        </div>
      </section>

      <section className="feature-strip" id="features">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">Ready for demo day</p>
          <h2>Open the dashboard first. Sign in only when you create.</h2>
        </div>
        <button
          className="primary-btn"
          onClick={() => onNavigate("/dashboard")}
        >
          Get started
          <ChevronRight size={18} />
        </button>
      </section>

      <footer className="site-footer" id="footer">
        <div>
          <BrandName compact />
          <div>
            <a href="#flow">Flow</a>
            <a href="#features">Features</a>
            <button type="button" onClick={() => onNavigate("/dashboard")}>
              Dashboard
            </button>
          </div>
          <div></div>
        </div>
        <small>
          Built for live polling, trusted participation, and clear result
          visualization.
        </small>
      </footer>
    </main>
  );
}
