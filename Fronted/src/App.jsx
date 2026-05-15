import React, { useEffect, useState } from "react";
import AppToaster from "./components/AppToaster.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PublicPollPage from "./pages/PublicPollPage.jsx";
import { getPublicToken, getRoute, navigateTo } from "./utils/routing.js";

// App owns tiny client-side routing so the project stays lightweight for the hackathon.
function App() {
  const [route, setRoute] = useState(getRoute());
  const [theme, setTheme] = useState(localStorage.getItem("nm_theme") || "dark");
  const publicToken = getPublicToken();

// Sync theme to localStorage and document attribute for CSS.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nm_theme", theme);
  }, [theme]);

// Listen to popstate events to handle back/forward navigation.
  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

// Helper to navigate and update route state.
  function goTo(path) {
    navigateTo(path);
    setRoute(getRoute());
  }

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  const pageProps = { theme, onToggleTheme: toggleTheme, onNavigate: goTo };

  return (
    <>
      <AppToaster />
      {publicToken ? (
        <PublicPollPage token={publicToken} {...pageProps} />
      ) : route === "dashboard" ? (
        <DashboardPage {...pageProps} />
      ) : (
        <LandingPage {...pageProps} />
      )}
    </>
  );
}

export default App;
