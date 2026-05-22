import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Button3D } from '../components/Button3D';
import { DinoPet } from '../components/DinoPet';
import type { PetShopItem } from '../types';
import { audioSynth } from '../utils/audioSynth';

export const PetShop: React.FC = () => {
  const navigate = useNavigate();
  const { currentChild, customizePet } = useAuthStore();

  if (!currentChild) return null;

  // Danh mục vật phẩm trong Cửa hàng Pet cưng
  const SHOP_ITEMS: PetShopItem[] = [
    // 1. Thức ăn (Hồi sinh mạng tim ❤️)
    { id: 'food_apple', name: 'Táo Giòn Ngọt 🍎', type: 'food', cost: 8, value: '1', emoji: '🍎' },
    { id: 'food_candy', name: 'Kẹo Dẻo Sắc Màu 🍬', type: 'food', cost: 12, value: '2', emoji: '🍬' },

    // 2. Màu da Khủng long (Skins)
    { id: 'color_green', name: 'Da Xanh Dino 🦖', type: 'color', cost: 0, value: 'green', emoji: '🟢' },
    { id: 'color_blue', name: 'Băng Giá Hải Dương 🌊', type: 'color', cost: 25, value: 'blue', emoji: '🔵' },
    { id: 'color_pink', name: 'Hồng Kẹo Bông 🦄', type: 'color', cost: 35, value: 'pink', emoji: '🌸' },
    { id: 'color_yellow', name: 'Rồng Vàng Chuối 🍌', type: 'color', cost: 45, value: 'yellow', emoji: '🟡' },

    // 3. Nón phụ kiện đội đầu (Hats)
    { id: 'hat_cap', name: 'Nón Đỏ Năng Động 🧢', type: 'hat', cost: 30, value: 'cap', emoji: '🧢' },
    { id: 'hat_cowboy', name: 'Cowboy Miền Tây 🤠', type: 'hat', cost: 50, value: 'cowboy', emoji: '🤠' },
    { id: 'hat_wizard', name: 'Mũ Phù Thủy Ma Thuật 🧙', type: 'hat', cost: 70, value: 'wizard', emoji: '🧙' },
    { id: 'hat_crown', name: 'Vương Miện Hoàng Gia 👑', type: 'hat', cost: 95, value: 'crown', emoji: '👑' }
  ];

  // Helper kiểm tra xem vật phẩm đã sở hữu hay chưa
  const checkIfOwned = (item: PetShopItem): boolean => {
    if (item.type === 'food') return false; // Thức ăn mua xong ăn mất, không tích lũy sở hữu
    if (item.value === 'green' && item.type === 'color') return true; // Mặc định xanh lá
    
    // Giả lập lưu trữ danh sách đồ đã mua trong localStorage cho chế độ offline mượt
    const ownedKeys = JSON.parse(localStorage.getItem(`owned_items_${currentChild.id}`) || '[]');
    return ownedKeys.includes(item.id);
  };

  // Helper mặc/áo phụ kiện
  const checkIfEquipped = (item: PetShopItem): boolean => {
    if (item.type === 'color') return currentChild.pet_color === item.value;
    if (item.type === 'hat') return currentChild.pet_hat === item.value;
    return false;
  };

  const handlePurchase = async (item: PetShopItem) => {
    const isOwned = checkIfOwned(item);

    // Kiểm tra đủ sao nếu chưa sở hữu
    if (!isOwned && currentChild.stars < item.cost) {
      alert('Ôi! Bé cần chăm chỉ luyện tập toán để kiếm đủ Sao ⭐ đổi món quà này nhé!');
      return;
    }

    if (item.type === 'food' && currentChild.lives >= 5) {
      alert('Tim của Khủng long Dino đã đầy rồi ❤️ Bé không cần mua đồ ăn lúc này đâu!');
      return;
    }

    // Thực hiện tùy chỉnh
    const success = await customizePet({
      ...item,
      bought: isOwned
    });

    if (success) {
      audioSynth.playCorrect();
      
      // Nếu mua mới thành công, lưu lại vào danh sách đã sở hữu
      if (!isOwned && item.type !== 'food') {
        const ownedKeys = JSON.parse(localStorage.getItem(`owned_items_${currentChild.id}`) || '[]');
        ownedKeys.push(item.id);
        localStorage.setItem(`owned_items_${currentChild.id}`, JSON.stringify(ownedKeys));
      }

      if (item.type === 'food') {
        alert(`Bé đã cho Dino ăn ${item.name} thành công! Dino hồi phục tim ❤️!`);
      } else {
        alert(`Đã trang trí ${item.name} cho Pet cưng thành công! 🥰`);
      }
    } else {
      alert('Không thể thực hiện giao dịch, hãy thử lại!');
    }
  };

  const handleRemoveHat = async () => {
    await customizePet({
      id: 'hat_none',
      name: 'Tháo nón',
      type: 'hat',
      cost: 0,
      value: 'none',
      emoji: '',
      bought: true
    });
    audioSynth.playClick();
  };

  return (
    <div className="min-h-screen bg-[#fff9c4] flex flex-col items-center justify-between pb-8 font-sans overflow-x-hidden relative">
      
      {/* 1. THANH TOP BAR TIỀN TỆ */}
      <div className="sticky top-0 w-full bg-white border-b-[5px] border-[#e5e5e5] px-4 py-3 z-30 flex items-center justify-between max-w-5xl mx-auto rounded-b-[2rem] shadow-sm select-none">
        
        {/* Nút quay lại Map */}
        <Button3D variant="ghost" size="sm" onClick={() => navigate('/map')}>
          ◀ Bản Đồ 🗺️
        </Button3D>

        {/* Tiêu đề Cửa hàng */}
        <h2 className="text-xl md:text-2xl font-black text-[#ff9600]">
          CỬA HÀNG DINO 🛒
        </h2>

        {/* Số sao của bé */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-4 border-[#e5e5e5] rounded-2xl bg-white shadow-inner">
          <span className="text-xl filter drop-shadow">⭐</span>
          <span className="text-lg font-black text-yellow-500">{currentChild.stars}</span>
        </div>
      </div>

      {/* 2. KHU VỰC THỬ ĐỒ TRỰC QUAN CHO PET */}
      <div className="w-full max-w-2xl px-6 py-6 flex flex-col items-center select-none">
        
        {/* Vòng tròn trưng bày Pet */}
        <div className="relative bg-white border-[6px] border-[#ffc800] rounded-[3rem] p-6 shadow-lg w-full flex flex-col items-center mb-8 bg-radial-gradient">
          <div className="absolute top-3 left-4 bg-yellow-400 text-white text-xs font-black px-3 py-1 rounded-full shadow">
            Phòng Thử Đồ 🦖👗
          </div>

          <DinoPet 
            state="cheering" 
            color={currentChild.pet_color} 
            hat={currentChild.pet_hat} 
            size={180} 
          />

          <h3 className="text-xl font-black text-[#3c3c3c] mt-2">
            🦖 {currentChild.pet_name}
          </h3>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold text-red-500">Mạng: ❤️ {currentChild.lives} / 5</span>
            {currentChild.pet_hat !== 'none' && (
              <button 
                onClick={handleRemoveHat}
                className="bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300"
              >
                Cởi Nón Đang Đội 🎩
              </button>
            )}
          </div>
        </div>

        {/* DANH SÁCH BÁN VẬT PHẨM THEO TỪNG CỰC */}
        <div className="w-full flex flex-col gap-6 text-left">
          
          {/* A. THỨC ĂN HỒI TIM */}
          <div>
            <h4 className="text-lg font-black text-[#ff9600] border-b-4 border-[#fff176] pb-1.5 mb-3 uppercase tracking-wide">
              🍱 Thức ăn cho Pet (Hồi Mạng ❤️)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHOP_ITEMS.filter(i => i.type === 'food').map(item => (
                <div key={item.id} className="bg-white border-4 border-[#e5e5e5] rounded-3xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] shadow-inner select-none">{item.emoji}</span>
                    <div>
                      <h5 className="font-extrabold text-[#3c3c3c] leading-tight">{item.name}</h5>
                      <span className="text-xs font-bold text-red-500">Hồi +{item.value} Tim ❤️</span>
                    </div>
                  </div>
                  <Button3D variant="yellow" size="sm" onClick={() => handlePurchase(item)}>
                    {item.cost} ⭐
                  </Button3D>
                </div>
              ))}
            </div>
          </div>

          {/* B. MÀU SẮC DA RỒNG (SKINS) */}
          <div>
            <h4 className="text-lg font-black text-[#1cb0f6] border-b-4 border-[#b3e5fc] pb-1.5 mb-3 uppercase tracking-wide">
              🎨 Sắc màu cá tính (Skin màu da)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHOP_ITEMS.filter(i => i.type === 'color').map(item => {
                const isOwned = checkIfOwned(item);
                const isEquipped = checkIfEquipped(item);

                return (
                  <div key={item.id} className={`bg-white border-4 rounded-3xl p-4 flex items-center justify-between shadow-sm ${isEquipped ? 'border-[#58cc02]' : 'border-[#e5e5e5]'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl p-2 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] shadow-inner select-none">{item.emoji}</span>
                      <div>
                        <h5 className="font-extrabold text-[#3c3c3c] leading-tight">{item.name}</h5>
                        <span className="text-xs font-bold text-gray-400">
                          {isEquipped ? 'Đang áp dụng' : isOwned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                        </span>
                      </div>
                    </div>
                    {isEquipped ? (
                      <span className="text-[#58cc02] font-black text-sm pr-2">✓ Đang Dùng</span>
                    ) : isOwned ? (
                      <Button3D variant="primary" size="sm" onClick={() => handlePurchase(item)}>
                        Dùng 👕
                      </Button3D>
                    ) : (
                      <Button3D variant="secondary" size="sm" onClick={() => handlePurchase(item)}>
                        {item.cost} ⭐
                      </Button3D>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. NÓN ĐỘI ĐẦU ĐỘC ĐÁO (HATS) */}
          <div>
            <h4 className="text-lg font-black text-[#58cc02] border-b-4 border-[#c8e6c9] pb-1.5 mb-3 uppercase tracking-wide">
              🎩 Nón đội đầu phong cách
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHOP_ITEMS.filter(i => i.type === 'hat').map(item => {
                const isOwned = checkIfOwned(item);
                const isEquipped = checkIfEquipped(item);

                return (
                  <div key={item.id} className={`bg-white border-4 rounded-3xl p-4 flex items-center justify-between shadow-sm ${isEquipped ? 'border-[#58cc02]' : 'border-[#e5e5e5]'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl p-2 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] shadow-inner select-none">{item.emoji}</span>
                      <div>
                        <h5 className="font-extrabold text-[#3c3c3c] leading-tight">{item.name}</h5>
                        <span className="text-xs font-bold text-gray-400">
                          {isEquipped ? 'Đang đội' : isOwned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                        </span>
                      </div>
                    </div>
                    {isEquipped ? (
                      <span className="text-[#58cc02] font-black text-sm pr-2">✓ Đang Đội</span>
                    ) : isOwned ? (
                      <Button3D variant="primary" size="sm" onClick={() => handlePurchase(item)}>
                        Đội Lên 🎩
                      </Button3D>
                    ) : (
                      <Button3D variant="orange" size="sm" onClick={() => handlePurchase(item)}>
                        {item.cost} ⭐
                      </Button3D>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 3. FOOTER THÔNG TIN */}
      <div className="w-full flex items-center justify-center mt-8 z-10">
        <Button3D variant="ghost" size="md" className="bg-white/80 border-2 border-[#e5e5e5]" onClick={() => navigate('/map')}>
          ◀ Quay lại Đảo học toán 🗺️
        </Button3D>
      </div>

    </div>
  );
};
export default PetShop;
