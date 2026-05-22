import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import LessonMap from '../pages/LessonMap';
import PlayRoom from '../pages/PlayRoom';
import PetShop from '../pages/PetShop';
import ParentDashboard from '../pages/ParentDashboard';

export const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Trang đăng ký/lựa chọn bé */}
        <Route path="/" element={<AuthPage />} />
        
        {/* Bản đồ chặng học toán zigzag */}
        <Route path="/map" element={<LessonMap />} />
        
        {/* Phòng làm toán học mà chơi */}
        <Route path="/play" element={<PlayRoom />} />
        
        {/* Cửa hàng trang trí thú cưng Dino */}
        <Route path="/shop" element={<PetShop />} />
        
        {/* Dashboard theo dõi của phụ huynh */}
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </Router>
  );
};
export default AppRoutes;
