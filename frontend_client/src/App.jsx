import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';

export default function App() {
  return (
    // Bắt buộc phải bọc toàn bộ ứng dụng trong BrowserRouter
    <BrowserRouter>
      
      {/* 1. Thanh điều hướng (Navbar) */}
      <nav style={{ padding: '15px', background: '#f8f9fa', marginBottom: '20px' }}>
        {/* Dùng Link thay cho thẻ <a> */}
        <Link to="/" style={{ marginRight: '20px', textDecoration: 'none' }}>Trang chủ</Link>
        <Link to="/Admin" style={{ textDecoration: 'none' }}>Quản lý</Link>
      </nav>

      {/* 2. Khu vực hiển thị nội dung động */}
      <main style={{ padding: '0 20px' }}>
        <Routes>
          {/* Định nghĩa đường dẫn nào sẽ render Component nào */}
          <Route path="/" element={<Home />} />
          <Route path="/Admin" element={<Admin />} />
          
          {/* Mẹo nhỏ: Bắt lỗi 404 cho các đường dẫn nhập sai */}
          <Route path="*" element={<h2>404 - Không tìm thấy trang</h2>} />
        </Routes>
      </main>

    </BrowserRouter>
  );
}