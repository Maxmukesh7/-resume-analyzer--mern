import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Render the premium SaaS Landing Page on the root index */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
