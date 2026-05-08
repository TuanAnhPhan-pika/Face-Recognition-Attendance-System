import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
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
        <a href="dashboard.html">Dashboard</a>
      </nav>

      <main className="appMain">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/Admin" element={<Admin />} />
          <Route path="*" element={<h2>404 - Không tìm thấy trang</h2>} />
        </Routes>
      </main>
    </HashRouter>
  );
}
