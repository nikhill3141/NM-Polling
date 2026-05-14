import React from "react";
import { BarChart3, Copy, Link as LinkIcon, ShieldCheck, X } from "lucide-react";
import ResultQuestion from "./ResultQuestion.jsx";

export function getTopOption(poll) {
  return poll?.questions
    ?.flatMap((question) => question.options || [])
    .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))[0];
}

export default function PollResults({ poll, onCopy, onPublish, onClose, isDemo = false, compact = false }) {
  const topOption = getTopOption(poll);
  const published = poll.link?.isPublished || poll.status !== "active" || isDemo;

  return (
    
    <div className={`poll-results ${compact ? "compact" : ""}`}>
      <div className="result-header">
        <div>
          <span className={`badge ${poll.status}`}>{isDemo ? "Preview" : poll.status}</span>
          <h2>{poll.title}</h2>
          <p>{poll.description}</p>
        </div>
        <div className="metric">
          <strong>{poll.totalResponses}</strong>
          <span>responses</span>
        </div>
      </div>

      {poll.link && !compact && (
        <div className="link-strip">
          <LinkIcon size={18} />
          <span>{poll.link.publicUrl}</span>
          <button className="icon-btn" onClick={() => onCopy(poll.link.publicUrl)} aria-label="Copy poll link">
            <Copy size={18} />
          </button>
        </div>
      )}

      {!compact && !isDemo && (
        <div className="action-row left">
          {!poll.link?.isPublished && (
            <button className="secondary-btn" onClick={() => onPublish(poll.id)}>
              <BarChart3 size={18} />
              Publish results
            </button>
          )}
          {poll.status === "active" && (
            <button className="danger-btn" onClick={() => onClose(poll.id)}>
              <X size={18} />
              Close poll
            </button>
          )}
        </div>
      )}

      <div className="result-insights">
        <div className="donut-card" style={{ "--score": `${topOption?.percentage || 0}%` }}>
          <div className="donut-ring">
            <strong>{topOption?.percentage || 0}%</strong>
          </div>
          <span>Leading option</span>
          <p>{topOption?.optionText || "No votes yet"}</p>
        </div>
        <div className="publish-card">
          <ShieldCheck size={22} />
          <strong>{published ? "Results visible" : "Results hidden"}</strong>
          <p>{published ? "Published board is ready for participants." : "Creator controls when public results appear."}</p>
        </div>
      </div>

      {poll.questions.map((question) => (
        <ResultQuestion question={question} key={question.id} muted={!published} />
      ))}
    </div>
  );
}
