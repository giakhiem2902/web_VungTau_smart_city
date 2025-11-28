import React, { useEffect, useState, useCallback } from 'react';
// Import các hàm API cần thiết cho CRUD
import { getEvents, deleteEvent, createEvent, updateEvent } from '../services/api.js'; 
import Panel from '../components/Panel.jsx';

// COMPONENT CHÍNH: EVENTS

export default function Events() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // STATES MỚI CHO MODAL VÀ FORM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null); // Lưu banner đang Sửa (null nếu là Thêm)

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      // Xử lý dữ liệu trả về có thể nằm trong res.data.data hoặc res.data
      setBanners(res.data?.data || res.data || []); 
      setError('');
    } catch (err) {
      setError(err.message || 'Lỗi tải Event Banners');
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa Banner này?')) return;
    try {
      await deleteEvent(id);
      alert('Xóa thành công!');
      loadBanners();
    } catch (err) {
      alert(`Xóa thất bại: ${err.message || 'Lỗi server'}`);
      console.error(err);
    }
  };
  
  // HÀM MỞ MODAL CHO CHỨC NĂNG THÊM MỚI
  const handleAddClick = () => {
    setCurrentBanner(null);
    setIsModalOpen(true);
  };

  // HÀM MỞ MODAL CHO CHỨC NĂNG SỬA
  const handleEditClick = (banner) => {
    setCurrentBanner(banner);
    setIsModalOpen(true);
  };
  
  // HÀM XỬ LÝ LƯU (THÊM HOẶC SỬA) TỪ MODAL
  const handleSave = async (data) => {
    // data chứa { id: ..., formData: FormData }
    const { id, formData } = data; 
    
    try {
      if (id) {
        // Cập nhật (Sửa): Gửi ID và FormData
        await updateEvent(id, formData); 
        alert('Cập nhật Event Banner thành công!');
      } else {
        // Thêm mới: Chỉ gửi FormData
        await createEvent(formData); 
        alert('Thêm Event Banner mới thành công!');
      }
      setIsModalOpen(false);
      loadBanners(); // Tải lại danh sách
    } catch (err) {
      alert(`Thao tác thất bại: ${err.message || 'Lỗi server'}`);
      console.error('Lỗi khi lưu/cập nhật:', err);
    }
  };

  return (
    <Panel>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            Danh sách Event Banner
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Quản lý các sự kiện và banner quảng cáo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn"
            onClick={loadBanners}
            style={{
              background: '#6b7280',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔄 Làm mới
          </button>
          <button
            className="btn"
            onClick={handleAddClick} 
            style={{
              background: '#10b981',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ➕ Thêm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div style={{
          padding: '20px',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: '500' }}>❌ {error}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Title</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Description</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Image</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>{b.id}</td>
                  <td style={{ padding: '16px', color: '#111827', fontSize: '14px', fontWeight: '500', maxWidth: '200px' }}>{b.title}</td>
                  <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px', maxWidth: '300px' }}>
                    {b.description?.substring(0, 80)}...
                  </td>
                  <td style={{ padding: '16px' }}>
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      style={{
                        height: '60px',
                        width: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn"
                        onClick={() => handleEditClick(b)} 
                        style={{
                          background: '#3b82f6',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn"
                        style={{
                          background: '#ef4444',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                        onClick={() => handleDelete(b.id)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    {/* MODAL THÊM/SỬA */}
    {isModalOpen && (
        <EventBannerFormModal
            bannerData={currentBanner}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
        />
    )}
    </Panel>
  );
}

//COMPONENT MODAL THÊM/SỬA

function EventBannerFormModal({ bannerData, onClose, onSave }) {
    const [title, setTitle] = useState(bannerData?.title || '');
    const [description, setDescription] = useState(bannerData?.description || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageUrlPreview, setImageUrlPreview] = useState(bannerData?.imageUrl || '');
    const [loading, setLoading] = useState(false);
    const isEdit = !!bannerData;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !description || (!imageUrlPreview && !selectedFile)) {
            alert('Vui lòng điền đủ Title, Description và cung cấp File ảnh/Image URL.');
            return;
        }
        // TẠO FormData để gửi file và các trường dữ liệu khác
        const formData = new FormData();
        
        // Thêm các trường text
        formData.append('title', title);
        formData.append('description', description);
        
        // Logic gửi file hoặc URL cũ
        if (selectedFile) {
            // Nếu có file mới được chọn, gửi file đó (server sẽ xử lý upload)
            formData.append('imageFile', selectedFile); 
        } else if (imageUrlPreview && isEdit) {
            // Nếu là Sửa và không chọn file mới, gửi lại URL cũ (server cần biết để không xóa)
            formData.append('imageUrl', imageUrlPreview); 
        }
        const dataToSave = {
            id: isEdit ? bannerData.id : undefined,
            formData, // Gửi FormData đi
        };
        
        setLoading(true);
        // Gọi hàm onSave được truyền từ component cha
        onSave(dataToSave).finally(() => setLoading(false));
    };
    // Hàm xử lý chọn file
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Tạo URL tạm thời để hiển thị preview
            setImageUrlPreview(URL.createObjectURL(file)); 
        } else {
            setSelectedFile(null);
            // Quay lại URL cũ nếu không có file mới
            setImageUrlPreview(bannerData?.imageUrl || ''); 
        }
    };
    // Xử lý khi Modal đóng, giải phóng URL tạm thời
    useEffect(() => {
        return () => {
            if (imageUrlPreview && imageUrlPreview.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrlPreview);
            }
        };
    }, [imageUrlPreview]);

    return (
        // Modal Overlay
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
            overflowY: 'auto'
        }}>
            {/* Modal Content */}
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                margin: '20px 0'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                    {isEdit ? '✏️ Sửa Event Banner' : '➕ Thêm Event Banner Mới'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ 
                                width: '100%', padding: '10px', border: '1px solid #d1d5db', 
                                borderRadius: '6px', boxSizing: 'border-box' 
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                            style={{ 
                                width: '100%', padding: '10px', border: '1px solid #d1d5db', 
                                borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box' 
                            }}
                            required
                        />
                    </div>
                    
                    {/* ✅ TRƯỜNG TẢI FILE ẢNH */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                            {isEdit ? 'Tải ảnh mới (chọn file để thay thế ảnh cũ)' : 'Tải ảnh Banner'}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ 
                                width: '100%', padding: '10px', border: '1px solid #d1d5db', 
                                borderRadius: '6px', boxSizing: 'border-box' 
                            }}
                            required={!isEdit} // Bắt buộc khi Thêm mới
                        />
                        {/* Hiển thị ảnh preview (Ảnh cũ HOẶC ảnh mới chọn) */}
                        {imageUrlPreview && (
                             <img 
                                src={imageUrlPreview} 
                                alt="Preview" 
                                style={{ 
                                    maxWidth: '100%', 
                                    height: 'auto', 
                                    marginTop: '10px', 
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb'
                                }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                            />
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            style={{ 
                                padding: '10px 20px', 
                                background: '#f3f4f6', 
                                color: '#4b5563', 
                                borderRadius: '6px', 
                                border: 'none', 
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            style={{ 
                                padding: '10px 20px', 
                                background: isEdit ? '#3b82f6' : '#10b981', 
                                color: 'white', 
                                borderRadius: '6px', 
                                border: 'none', 
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : (isEdit ? 'Lưu Thay Đổi' : 'Thêm Mới')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}