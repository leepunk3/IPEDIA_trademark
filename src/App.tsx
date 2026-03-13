import LandingPage from "./components/LandingPage";
import ProgressPage from "./components/ProgressPage";

function App() {
  const path = window.location.pathname;

  if (path.startsWith("/progress")) {
    return <ProgressPage />;
  }

  return <LandingPage />;
}

export default App;