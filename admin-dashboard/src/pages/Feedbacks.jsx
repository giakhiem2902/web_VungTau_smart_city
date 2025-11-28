import React, { useEffect, useState, useCallback } from 'react';
import { getFeedbacks, reviewFeedback } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(''); // Trạng thái ĐANG CẬP NHẬT
  const [adminResponse, setAdminResponse] = useState('');

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFeedbacks(status);
      setFeedbacks(res.data || []);
      setError('');
    } catch (err) {
      setError('Lỗi tải Feedbacks');
      console.error(err);
    }
    setLoading(false);
  }, [status]);

  // Điều chỉnh hàm openReviewModal:
  // - Nếu trạng thái là Pending/Processing: đặt reviewStatus là trạng thái TIẾP THEO (Processing/Resolved)
  // - Nếu trạng thái là Resolved/Rejected (nút Chi tiết): đặt reviewStatus là trạng thái HIỆN TẠI, và cho phép thay đổi trong Modal.
  const openReviewModal = (feedback, newStatus) => {
    setSelectedFeedback(feedback);
    // Khi nhấn Chi tiết, đặt trạng thái cập nhật mặc định là trạng thái hiện tại của feedback
    // newStatus sẽ là 'Processing', 'Resolved', 'Rejected', hoặc f.status khi nhấn 'Chi tiết'
    setReviewStatus(newStatus); 
    setAdminResponse(feedback.adminResponse || '');
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    if (!adminResponse.trim()) {
      alert('Vui lòng nhập phản hồi của admin.');
      return;
    }
    try {
      await reviewFeedback(
        selectedFeedback.id,
        reviewStatus, // Gửi trạng thái mới (được chọn trong modal)
        adminResponse
      );

      alert('Cập nhật thành công!');
      setShowModal(false);
      loadFeedbacks();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
      console.error(err);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFeedbacks]);

  // Hàm tiện ích để lấy tiêu đề modal/nút
  const getActionTitle = (status) => {
    switch (status) {
      case 'Processing':
        return 'Xác nhận tiếp nhận';
      case 'Resolved':
        return 'Xác nhận giải quyết';
      case 'Rejected':
        return 'Xác nhận từ chối';
      case 'Pending':
        return 'Xác nhận chuyển sang Chờ xử lý';
      default:
        return 'Cập nhật trạng thái';
    }
  };

  return (
    <>
      <Panel>
        {/* ... (Phần hiển thị danh sách feedback không thay đổi) ... */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2>Danh sách Feedback</h2>
          <button className="btn"  onClick={loadFeedbacks} 
          style={{
              background: '#6b7280',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🔄 Làm mới</button>
        </div>

        <label>
          Lọc trạng thái:
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
          >
            <option value="">Tất cả</option>
            <option value="Pending">Chờ xử lý</option>
            <option value="Processing">Đang xử lý</option>
            <option value="Resolved">Đã giải quyết</option>
            <option value="Rejected">Từ chối</option>
          </select>
        </label>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Đang tải...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề</th>
                  <th>Mô tả</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Người gửi</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id}</td>
                    <td>{f.title}</td>
                    <td>{f.description?.substring(0, 50)}...</td>
                    <td>{f.category || '-'}</td>
                    <td>
                      <StatusBadge status={f.status} size="sm" />
                    </td>
                    <td>{f.user?.fullName || f.user?.username || '-'}</td>
                    <td>{new Date(f.createdAt).toLocaleDateString('vi-VN')}</td>

                    {/* THÊM: Action buttons */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {f.status === 'Pending' && (
                          <>
                            <button
                              className="btn"
                              onClick={() => openReviewModal(f, 'Processing')}
                              style={{
                                background: '#3b82f6',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              🔄 Tiếp nhận
                            </button>
                            <button
                              className="btn"
                              onClick={() => openReviewModal(f, 'Rejected')}
                              style={{
                                background: '#ef4444',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ❌ Từ chối
                            </button>
                          </>
                        )}

                        {f.status === 'Processing' && (
                          <button
                            className="btn"
                            onClick={() => openReviewModal(f, 'Resolved')}
                            style={{
                              background: '#10b981',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ✅ Giải quyết
                          </button>
                        )}

                        {(f.status === 'Resolved' || f.status === 'Rejected') && (
                          <button
                            className="btn"
                            onClick={() => openReviewModal(f, f.status)} // Giữ trạng thái hiện tại
                            style={{
                              background: '#6b7280',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            👁️ Chi tiết
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modal xử lý feedback */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '500px',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <h3 style={{ marginBottom: '16px', color: '#111827' }}>
              {getActionTitle(reviewStatus)} phản ánh
            </h3>

            {/* Thông tin feedback */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>ID:</strong>{' '}
                <span style={{ color: '#6b7280' }}>{selectedFeedback?.id}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>Tiêu đề:</strong>{' '}
                <span style={{ color: '#111827' }}>{selectedFeedback?.title}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>Danh mục:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {selectedFeedback?.category}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>Nội dung:</strong>
                <p style={{
                  whiteSpace: 'pre-wrap',
                  marginTop: '8px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  color: '#111827',
                  lineHeight: '1.6'
                }}>
                  {selectedFeedback?.description}
                </p>
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Người gửi:</strong>{' '}
                <span style={{ color: '#6b7280' }}>
                  {selectedFeedback?.user?.fullName || selectedFeedback?.user?.email}
                </span>
              </div>
            </div>

            {/* Thêm lựa chọn trạng thái khi xem chi tiết */}
            <div style={{ marginTop: '20px' }}>
              <label>
                <strong style={{ color: '#374151' }}>Chỉnh sửa Trạng thái:</strong>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Pending">Chờ xử lý</option>
                  <option value="Processing">Đang xử lý</option>
                  <option value="Resolved">Đã giải quyết</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </label>
            </div>

            {/* Phản hồi admin */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                <strong style={{ color: '#374151' }}>
                  Phản hồi của admin: <span style={{ color: '#ef4444' }}>*</span>
                </strong>
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder={
                  reviewStatus === 'Processing'
                    ? 'VD: Chúng tôi đã ghi nhận phản ánh và sẽ xử lý trong 7 ngày tới. Cảm ơn bạn!'
                    : reviewStatus === 'Resolved'
                      ? 'VD: Vấn đề đã được khắc phục. Cảm ơn bạn đã góp ý!'
                      : 'VD: Phản ánh không hợp lệ vì...'
                }
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
                required
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                💡 {reviewStatus === 'Pending' && 'Ghi rõ lý do cần chuyển lại trạng thái Chờ xử lý.'}
                {reviewStatus === 'Processing' && 'Thông báo cho người dùng rằng bạn đang xử lý'}
                {reviewStatus === 'Resolved' && 'Giải thích cách bạn đã giải quyết vấn đề'}
                {reviewStatus === 'Rejected' && 'Nêu rõ lý do từ chối'}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                className="btn"
                onClick={() => setShowModal(false)}
                style={{
                  background: '#6b7280',
                  padding: '10px 20px',
                  fontWeight: '500'
                }}
              >
                Hủy
              </button>
              <button
                className="btn"
                onClick={handleSubmitReview}
                disabled={!adminResponse.trim()}
                style={{
                  background: reviewStatus === 'Processing' ? '#3b82f6' :
                    reviewStatus === 'Resolved' ? '#10b981' : reviewStatus === 'Rejected' ? '#ef4444' : '#6b7280',
                  padding: '10px 20px',
                  fontWeight: '500',
                  opacity: !adminResponse.trim() ? 0.5 : 1,
                  cursor: !adminResponse.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {getActionTitle(reviewStatus)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}