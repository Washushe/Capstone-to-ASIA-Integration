import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Prediction from './pages/Prediction.jsx';
import Logs from './pages/Logs.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [online, setOnline] = useState(true);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Register onRegister={setUser} />
          }
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} online={online} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/prediction"
          element={user ? <Prediction user={user} online={online} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/logs"
          element={user ? <Logs user={user} online={online} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/settings"
          element={
            user ? (
              <Settings user={user} online={online} onLogout={() => setUser(null)} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
