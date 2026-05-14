import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Lock, Send, Smartphone } from "lucide-react";
import { io } from "socket.io-client";
import BrandName from "../components/BrandName.jsx";
import ResultQuestion from "../components/ResultQuestion.jsx";
import ThemeButton from "../components/ThemeButton.jsx";
import { API_URL, apiRequest } from "../services/api.js";
import { getDeviceId } from "../utils/device.js";

export default function PublicPollPage({ token, theme, onToggleTheme, onNavigate }) {
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const socket = useMemo(
    () =>
      io(API_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      }),
    [],
  );

  useEffect(() => {
    loadPublicPoll();
  }, [token]);

  useEffect(() => {
    socket.emit("join_poll", token);
    socket.on("poll_results_updated", (payload) => setPoll(payload.poll));
    socket.on("poll_published_notification", (payload) => setPoll(payload.poll));
    socket.on("poll_closed", (payload) => setPoll(payload.poll));

    return () => {
      socket.emit("leave_poll", token);
      socket.disconnect();
    };
  }, [socket, token]);

  async function loadPublicPoll() {
    try {
      const data = await apiRequest(`/api/public/polls/${token}`);
      setPoll(data.data.poll);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const payload = {
        deviceId: getDeviceId(),
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      };
      const data = await apiRequest(`/api/public/polls/${token}/responses`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPoll(data.data.poll);
      setSubmitted(true);
      setMessage("Response submitted");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!poll) {
    return (
      <main className="public-shell center">
        <div className="empty-state">
          <BarChart3 size={42} />
          <h2>Loading poll</h2>
          {message && <p>{message}</p>}
        </div>
      </main>
    );
  }

  const canVote = poll.status === "active" && !submitted;
  const resultsVisible = poll.link?.isPublished || poll.status !== "active" || submitted;

  return (
    <main className="public-shell">
      <nav className="landing-nav public-nav">
        <BrandName />
        <div className="nav-actions">
          <button type="button" onClick={() => onNavigate("/")}>Home</button>
          <ThemeButton theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </nav>

      <section className="public-header">
        <div>
          <span className={`badge ${poll.status}`}>{poll.status}</span>
          <h1>{poll.title}</h1>
          <p>{poll.description}</p>
        </div>
        <div className="metric">
          <strong>{poll.totalResponses}</strong>
          <span>responses</span>
        </div>
      </section>

      <form className="public-grid" onSubmit={submit}>
        <section className="vote-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your vote</p>
              <h2>Choose your answer</h2>
            </div>
            <span className="secure-pill">
              <Smartphone size={16} />
              Device tracked
            </span>
          </div>
          {poll.questions.map((question) => (
            <div className="vote-question" key={question.id}>
              <h2>{question.questionText}</h2>
              <div className="choice-list">
                {question.options.map((option) => (
                  <label className="choice" key={option.id}>
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      disabled={!canVote}
                      required={question.isMandatory}
                    />
                    <span>{option.optionText}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {canVote && (
            <button className="primary-btn">
              <Send size={18} />
              Submit response
            </button>
          )}
          {message && <p className="status-text">{message}</p>}
        </section>

        <section className="results-panel live">
          <div className="live-heading">
            <BarChart3 size={22} />
            <h2>{resultsVisible ? "Live Results" : "Results waiting room"}</h2>
          </div>
          {resultsVisible ? (
            poll.questions.map((question) => <ResultQuestion question={question} key={question.id} />)
          ) : (
            <div className="empty-state compact-empty">
              <Lock size={38} />
              <h3>Creator has not published results yet</h3>
              <p>Your vote is still counted securely.</p>
            </div>
          )}
        </section>
      </form>
    </main>
  );
}
