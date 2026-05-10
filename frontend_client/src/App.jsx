import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import './App.css';

export default function App() {
  return (
    <HashRouter>
      <nav className="appNav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Trang chủ
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Quản lý
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Dashboard
        </NavLink>
      </nav>

      <main className="appMain">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/Admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<h2>404 - Không tìm thấy trang</h2>} />
        </Routes>
      </main>
    </HashRouter>
  );
}
