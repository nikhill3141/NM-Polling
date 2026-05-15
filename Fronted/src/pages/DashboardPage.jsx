import React, { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  Lock,
  LogOut,
  PieChart,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import AuthPanel from "../components/AuthPanel.jsx";
import BrandName from "../components/BrandName.jsx";
import PollResults, { getTopOption } from "../components/PollResults.jsx";
import StatsGrid from "../components/StatsGrid.jsx";
import ThemeButton from "../components/ThemeButton.jsx";
import { demoPoll } from "../constants/demoPoll.js";
import { apiRequest } from "../services/api.js";
import { clearAuth, readStoredAuth, saveAuth } from "../utils/authStorage.js";

const defaultQuestion = () => ({
  questionText: "",
  isMandatory: true,
  options: [{ optionText: "" }, { optionText: "" }],
});

export default function DashboardPage({ theme, onToggleTheme, onNavigate }) {
  const [auth, setAuth] = useState(readStoredAuth());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPollData, setPendingPollData] = useState(null);
  const [pollForm, setPollForm] = useState({
    title: "",
    description: "",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    isAnonymous: true,
    questions: [defaultQuestion()],
  });

  const isAuthed = Boolean(auth?.user && auth?.accessToken);

  useEffect(() => {
    if (isAuthed) loadPolls();
  }, [isAuthed, getDashboardStats, DashboardPage]);

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const endpoint =
        authMode === "login" ? "/api/users/login" : "/api/users/signup";
      const body =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : {
              firstName: authForm.firstName,
              ...(authForm.lastName.trim()
                ? { lastName: authForm.lastName }
                : {}),
              email: authForm.email,
              password: authForm.password,
            };
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      saveAuth(data.data);
      setAuth(data.data);
      setMessage("Dashboard unlocked");

      // If coming from poll creation modal, close modal and proceed with poll creation
      if (showAuthModal) {
        setShowAuthModal(false);
        setAuthForm({ firstName: "", lastName: "", email: "", password: "" });
        setAuthMode("login");
        // Trigger poll creation after a short delay to ensure auth state is updated
        setTimeout(() => {
          if (pendingPollData) {
            // Create a synthetic event for the form submission
            const syntheticEvent = { preventDefault: () => {} };
            createPollWithData(pendingPollData, syntheticEvent);
            setPendingPollData(null);
          }
        }, 100);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPollWithData(pollData, event) {
    if (event) event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        ...pollData,
        expiresAt: new Date(pollData.expiresAt).toISOString(),
        questions: pollData.questions.map((question) => ({
          ...question,
          options: question.options.map((option) => ({
            optionText: option.optionText,
          })),
        })),
      };
      const data = await apiRequest("/api/polls", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSelectedPoll(data.data.poll);
      setPollForm({
        title: "",
        description: "",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
        isAnonymous: true,
        questions: [defaultQuestion()],
      });
      await loadPolls();
      setMessage("Poll created and link is ready");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await apiRequest("/api/users/logout", { method: "POST", body: "{}" });
    } catch {
      // Local cleanup is still correct if the token has already expired.
    }
    clearAuth();
    setAuth({});
    setPolls([]);
    setSelectedPoll(null);
  }

  async function loadPolls() {
    try {
      const data = await apiRequest("/api/polls");
      setPolls(data.data.polls);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openPoll(pollId) {
    if (!isAuthed) return;
    try {
      const data = await apiRequest(`/api/polls/${pollId}`);
      setSelectedPoll(data.data.poll);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createPoll(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        ...pollForm,
        expiresAt: new Date(pollForm.expiresAt).toISOString(),
        questions: pollForm.questions.map((question) => ({
          ...question,
          options: question.options.map((option) => ({
            optionText: option.optionText,
          })),
        })),
      };
      const data = await apiRequest("/api/polls", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSelectedPoll(data.data.poll);
      setPollForm({
        title: "",
        description: "",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
        isAnonymous: true,
        questions: [defaultQuestion()],
      });
      await loadPolls();
      setMessage("Poll created and link is ready");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function publishPoll(pollId) {
    try {
      const data = await apiRequest(`/api/polls/${pollId}/publish`, {
        method: "PATCH",
        body: "{}",
      });
      setSelectedPoll(data.data.poll);
      await loadPolls();
      setMessage("Results published");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function closePoll(pollId) {
    try {
      const data = await apiRequest(`/api/polls/${pollId}/close`, {
        method: "PATCH",
        body: "{}",
      });
      setSelectedPoll(data.data.poll);
      await loadPolls();
      setMessage("Poll closed");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function copyLink(url) {
    await navigator.clipboard.writeText(url);
    setMessage("Share link copied");
  }

  function updateQuestion(index, field, value) {
    setPollForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    setPollForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex
                  ? { optionText: value }
                  : option,
              ),
            }
          : question,
      ),
    }));
  }

  function addOption(questionIndex) {
    setPollForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...question.options, { optionText: "" }] }
          : question,
      ),
    }));
  }

  function removeOption(questionIndex, optionIndex) {
    setPollForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex && question.options.length > 2
          ? {
              ...question,
              options: question.options.filter(
                (_, currentOptionIndex) => currentOptionIndex !== optionIndex,
              ),
            }
          : question,
      ),
    }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a href="/">
          <BrandName compact />
        </a>
        {/* <button className="ghost-btn" onClick={() => onNavigate("/")}>Landing</button> */}
        {isAuthed && (
          <button className="ghost-btn" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        )}
        <div className="sidebar-label">Your polls</div>
        <div className="poll-list">
          {polls.map((poll) => (
            <button
              key={poll.id}
              className="poll-list-item"
              onClick={() => openPoll(poll.id)}
            >
              <span>{poll.title}</span>
              <small>{poll.totalResponses} responses</small>
              <em className={`mini-status ${poll.status}`}>{poll.status}</em>
            </button>
          ))}
          {polls.length === 0 && (
            <p className="muted-text">
              Your created polls will appear here after login.
            </p>
          )}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Creator dashboard</p>
            <h2>
              {isAuthed
                ? `Welcome, ${auth.user.firstName}`
                : "Preview the workspace"}
            </h2>
          </div>
          <div className="topbar-actions">
            {message && <span className="toast">{message}</span>}
            <ThemeButton theme={theme} onToggleTheme={onToggleTheme} />
          </div>
        </header>

        <StatsGrid stats={getDashboardStats(polls, selectedPoll)} />

        <div className="main-grid">
          <PollBuilder
            pollForm={pollForm}
            setPollForm={setPollForm}
            loading={loading}
            createPoll={createPoll}
            updateQuestion={updateQuestion}
            updateOption={updateOption}
            addOption={addOption}
            removeOption={removeOption}
            isAuthed={isAuthed}
            onAuthRequired={() => setShowAuthModal(true)}
            onPendingPoll={setPendingPollData}
          />

          <section className="results-panel dashboard-results">
            {selectedPoll ? (
              <PollResults
                poll={selectedPoll}
                onCopy={copyLink}
                onPublish={publishPoll}
                onClose={closePoll}
              />
            ) : (
              <PollResults
                poll={demoPoll}
                isDemo
                onCopy={copyLink}
                onPublish={() => {}}
                onClose={() => {}}
              />
            )}
          </section>
        </div>
      </section>

      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowAuthModal(false)}
            >
              <X size={20} />
            </button>
            <AuthGate
              authMode={authMode}
              setAuthMode={setAuthMode}
              authForm={authForm}
              setAuthForm={setAuthForm}
              handleAuth={handleAuth}
              loading={loading}
              message={message}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function AuthGate(props) {
  return (
    <section className="auth-gate">
      <div className="gate-copy">
        <span className="gate-icon">
          <Lock size={22} />
        </span>
        <p className="eyebrow">Login required</p>
        <h3>Create polls after authentication.</h3>
        <p>
          You can explore the dashboard first. Login or signup here when you are
          ready to create and manage live polls.
        </p>
      </div>
      <AuthPanel {...props} />
    </section>
  );
}

function PollBuilder({
  pollForm,
  setPollForm,
  loading,
  createPoll,
  updateQuestion,
  updateOption,
  addOption,
  removeOption,
  isAuthed,
  onAuthRequired,
  onPendingPoll,
}) {
  const handleAuthCheck = (event) => {
    event.preventDefault();
    if (!isAuthed) {
      // Store poll data to create after authentication
      onPendingPoll(pollForm);
      // Show auth modal
      onAuthRequired();
    } else {
      // User is authenticated, proceed with poll creation
      createPoll(event);
    }
  };
  return (
    <form className="builder-panel" onSubmit={createPoll}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Build</p>
          <h3>Create a live poll</h3>
        </div>
        <span className="secure-pill">
          <ShieldCheck size={16} />
          Device guarded
        </span>
      </div>

      <div className="form-grid">
        <label>
          Poll title
          <input
            value={pollForm.title}
            onChange={(event) =>
              setPollForm({ ...pollForm, title: event.target.value })
            }
            required
            minLength={5}
          />
        </label>
        <label>
          Expires at
          <input
            type="datetime-local"
            value={pollForm.expiresAt}
            onChange={(event) =>
              setPollForm({ ...pollForm, expiresAt: event.target.value })
            }
            required
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          value={pollForm.description}
          onChange={(event) =>
            setPollForm({ ...pollForm, description: event.target.value })
          }
          rows="3"
        />
      </label>
      <label className="toggle-line">
        <input
          type="checkbox"
          checked={pollForm.isAnonymous}
          onChange={(event) =>
            setPollForm({ ...pollForm, isAnonymous: event.target.checked })
          }
        />
        Anonymous public responses
      </label>

      {pollForm.questions.map((question, questionIndex) => (
        <div className="question-editor" key={questionIndex}>
          <div className="editor-heading">
            <span>Question {questionIndex + 1}</span>
            {pollForm.questions.length > 1 && (
              <button
                type="button"
                className="icon-btn"
                onClick={() =>
                  setPollForm((current) => ({
                    ...current,
                    questions: current.questions.filter(
                      (_, index) => index !== questionIndex,
                    ),
                  }))
                }
                aria-label="Remove question"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <input
            placeholder="Question text"
            value={question.questionText}
            onChange={(event) =>
              updateQuestion(questionIndex, "questionText", event.target.value)
            }
            required
          />
          <label className="toggle-line small">
            <input
              type="checkbox"
              checked={question.isMandatory}
              onChange={(event) =>
                updateQuestion(
                  questionIndex,
                  "isMandatory",
                  event.target.checked,
                )
              }
            />
            Mandatory
          </label>
          <div className="option-stack">
            {question.options.map((option, optionIndex) => (
              <div className="option-row" key={optionIndex}>
                <Radio size={18} />
                <input
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option.optionText}
                  onChange={(event) =>
                    updateOption(questionIndex, optionIndex, event.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeOption(questionIndex, optionIndex)}
                  aria-label="Remove option"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-btn"
            onClick={() => addOption(questionIndex)}
          >
            <Plus size={17} />
            Add option
          </button>
        </div>
      ))}

      <div className="action-row">
        <button
          type="button"
          className="secondary-btn"
          onClick={() =>
            setPollForm((current) => ({
              ...current,
              questions: [...current.questions, defaultQuestion()],
            }))
          }
        >
          <Plus size={18} />
          Add question
        </button>
        <button
          type="submit"
          className="primary-btn"
          onClick={handleAuthCheck}
          disabled={loading}
        >
          <Check size={18} />
          Create poll
        </button>
      </div>
    </form>
  );
}

function getDashboardStats(polls, selectedPoll) {
  const topOption = getTopOption(selectedPoll || demoPoll);
  return [
    {
      label: "Total polls",
      value: polls.length,
      icon: <BarChart3 size={20} />,
    },
    {
      label: "Active",
      value: polls.filter((poll) => poll.status === "active").length,
      icon: <Activity size={20} />,
    },
    {
      label: "Responses",
      value: polls.reduce((sum, poll) => sum + (poll.totalResponses || 0), 0),
      icon: <Users size={20} />,
    },
    {
      label: "Published",
      value: polls.filter((poll) => poll.link?.isPublished).length,
      icon: <PieChart size={20} />,
    },
    {
      label: "Top choice",
      value: topOption?.percentage ? `${topOption.percentage}%` : "0%",
      icon: <TrendingUp size={20} />,
    },
  ];
}
