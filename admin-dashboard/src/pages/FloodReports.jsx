import React, { useEffect, useState, useCallback } from 'react';
import { getFloodReports, reviewFloodReport, analyzeFloodImageAI } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function FloodReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  //AI analysis states  
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  //modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(''); // Trạng thái ĐANG CẬP NHẬT
  const [waterLevel, setWaterLevel] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFloodReports(status);
      setReports(res.data || []);
      setError('');
    } catch (err) {
      setError('Lỗi tải báo cáo');
      console.error(err);
    }
    setLoading(false);
  }, [status]);

  const openReviewModal = (report, newStatus) => {
    console.log('📋 Opening modal for report:', report);
    console.log('🖼️ Original imageUrl:', report.imageUrl);

    // Transform URL nếu chưa được transform
    const transformedReport = {
      ...report,
      imageUrl: report.imageUrl?.replace('http://10.0.2.2:5000', 'http://localhost:5000')
    };

    console.log('🔄 Transformed imageUrl:', transformedReport.imageUrl);

    setSelectedReport(transformedReport);
    
    // SỬA: Đặt reviewStatus là trạng thái mới HOẶC trạng thái hiện tại (khi nhấn Chi tiết)
    setReviewStatus(newStatus); 
    
    // Cập nhật waterLevel ban đầu từ báo cáo
    setWaterLevel(report.waterLevel || '');
    setAdminNote(report.adminNote || '');
    setAiResult(null); // Reset kết quả AI khi mở modal mới
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    try {
      // THAY ĐỔI: Kiểm tra mức độ ngập chỉ khi reviewStatus là Approved
      if (reviewStatus === 'Approved' && !waterLevel) {
        alert('Vui lòng chọn mức độ ngập trước khi duyệt!');
        return;
      }
      // Không bắt buộc adminNote, nhưng nếu là Rejected thì nên có

      await reviewFloodReport(
        selectedReport.id,
        reviewStatus,
        // Gửi waterLevel nếu reviewStatus là Approved, ngược lại là null
        reviewStatus === 'Approved' ? waterLevel : null, 
        adminNote
      );

      alert('Cập nhật thành công!');
      setShowModal(false);
      loadReports();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
      console.error(err);
    }
  };

  const handleAIAnalyze = async () => {
    if (!selectedReport?.imageUrl) {
      alert('Báo cáo không có hình ảnh để phân tích!');
      return;
    }

    setAiAnalyzing(true);
    setAiResult(null);

    try {
      const res = await analyzeFloodImageAI(selectedReport.id);
      const analysis = res.data.data.aiAnalysis;

      setAiResult(analysis);

      // Auto-fill mức độ ngập và ghi chú
      setWaterLevel(analysis.waterLevel);
      setAdminNote(
        `🤖 AI Phân tích:\n\n` +
        `📊 Độ sâu ước tính: ${analysis.estimatedDepth}\n` +
        `🎯 Độ tin cậy: ${analysis.confidence}\n\n` +
        `📝 Chi tiết:\n${analysis.analysis}\n\n` +
        `💡 Khuyến nghị:\n${analysis.recommendations}`
      );

      alert('✅ AI đã phân tích xong! Vui lòng kiểm tra và xác nhận.');
    } catch (err) {
      alert(`❌ Lỗi phân tích AI: ${err.response?.data?.message || err.message}`);
      console.error(err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Hàm tiện ích để lấy tiêu đề modal/nút
  const getActionTitle = (currentStatus, targetStatus) => {
    if (currentStatus === 'Pending') {
        return targetStatus === 'Approved' ? '✅ Duyệt báo cáo' : '❌ Từ chối báo cáo';
    }
    return '🔄 Cập nhật/Xem chi tiết báo cáo';
  };

  return (
    <>
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2>Quản lý báo cáo ngập lụt</h2>
          <button className="btn" onClick={loadReports} 
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
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
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
                  <th>Địa chỉ</th>
                  <th>Mức độ ngập</th>
                  <th>Trạng thái</th>
                  <th>Người báo</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.title}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.address || '-'}
                    </td>
                    <td>
                      <StatusBadge status={r.waterLevel || 'Unknown'} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td>{r.user?.fullName || r.user?.username || '-'}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>

                    {/* Action buttons */}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {r.status === 'Pending' && (
                          <>
                            <button
                              className="btn"
                              onClick={() => openReviewModal(r, 'Approved')}
                              style={{
                                background: '#10b981',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ✅ Duyệt
                            </button>
                            <button
                              className="btn"
                              onClick={() => openReviewModal(r, 'Rejected')}
                              style={{
                                background: '#ef4444',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ❌ Từ chối
                            </button>
                          </>
                        )}

                        {(r.status === 'Approved' || r.status === 'Rejected') && (
                          <button
                            className="btn"
                            onClick={() => openReviewModal(r, r.status)}
                            style={{
                              background: '#6b7280',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500'
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

      {/* Modal review */}
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
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* SỬA: Tiêu đề modal */}
            <h3 style={{ marginBottom: '16px', color: '#111827' }}>
              {getActionTitle(selectedReport?.status, reviewStatus)}
            </h3>

            {/* AI Analyze Section */}
            {selectedReport?.imageUrl && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                border: '2px solid #5a67d8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>🤖</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '600' }}>
                      AI Phân tích Hình ảnh
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#e0e7ff', fontSize: '13px' }}>
                      Sử dụng GPT-4 Vision để phân tích mức độ ngập tự động
                    </p>
                  </div>
                  <button
                    className="btn"
                    onClick={handleAIAnalyze}
                    disabled={aiAnalyzing}
                    style={{
                      background: aiAnalyzing ? '#9ca3af' : 'white',
                      color: '#667eea',
                      padding: '10px 20px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: aiAnalyzing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {aiAnalyzing ? '⏳ Đang phân tích...' : '🚀 Phân tích ngay'}
                  </button>
                </div>

                {/* Hiển thị kết quả AI */}
                {aiResult && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '2px solid #a5b4fc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>✨</span>
                      <strong style={{ color: '#4c51bf', fontSize: '15px' }}>Kết quả phân tích:</strong>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#374151', fontSize: '13px' }}>Mức độ:</strong>
                        <StatusBadge status={aiResult.waterLevel} size="sm" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#374151', fontSize: '13px' }}>Độ sâu:</strong>
                        <span style={{
                          padding: '4px 10px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          📏 {aiResult.estimatedDepth}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#374151', fontSize: '13px' }}>Độ tin cậy:</strong>
                        <span style={{
                          padding: '4px 10px',
                          background: aiResult.confidence === 'high' ? '#d1fae5' :
                            aiResult.confidence === 'medium' ? '#fef3c7' : '#fee2e2',
                          color: aiResult.confidence === 'high' ? '#065f46' :
                            aiResult.confidence === 'medium' ? '#92400e' : '#991b1b',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {aiResult.confidence === 'high' && '🎯 Cao'}
                          {aiResult.confidence === 'medium' && '⚠️ Trung bình'}
                          {aiResult.confidence === 'low' && '❓ Thấp'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}>
                      <strong>📝 Chi tiết:</strong>
                      <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                        {aiResult.analysis}
                      </p>
                    </div>

                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: '#eff6ff',
                      borderRadius: '6px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe'
                    }}>
                      <strong>💡 Khuyến nghị:</strong>
                      <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                        {aiResult.recommendations}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Thông tin chi tiết báo cáo */}
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              background: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>ID:</strong>{' '}
                <span style={{ color: '#6b7280' }}>{selectedReport?.id}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>Tiêu đề:</strong>{' '}
                <span style={{ color: '#111827' }}>{selectedReport?.title}</span>
              </div>
              
              {/* Hiển thị địa chỉ trong modal */}
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>📍 Địa chỉ:</strong>
                <p style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  color: '#111827',
                  lineHeight: '1.6',
                  border: '1px solid #e5e7eb'
                }}>
                  {selectedReport?.address || 'Không có thông tin địa chỉ'}
                </p>
              </div>
              
              {/* Tọa độ */}
              {selectedReport?.latitude && selectedReport?.longitude && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#374151' }}>🗺️ Tọa độ:</strong>{' '}
                  <span style={{
                    fontFamily: 'monospace',
                    color: '#6b7280',
                    fontSize: '13px'
                  }}>
                    {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                  </span>
                  <a
                    href={`http://google.com/maps/search/?api=1&query=${selectedReport.latitude},${selectedReport.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: '8px',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: '12px'
                    }}
                  >
                    🔗 Xem trên Google Maps
                  </a>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#374151' }}>Mô tả:</strong>
                <p style={{
                  whiteSpace: 'pre-wrap',
                  marginTop: '8px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  color: '#111827',
                  lineHeight: '1.6'
                }}>
                  {selectedReport?.description}
                </p>
              </div>
              
              {/* Hiển thị ảnh nếu có */}
              {selectedReport?.imageUrl && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#374151' }}>📷 Ảnh hiện trường:</strong>
                  <div style={{
                    position: 'relative',
                    marginTop: '8px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    minHeight: '200px'
                  }}>
                    {/* Loading placeholder */}
                    <div
                      id={`image-loading-${selectedReport.id}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f9fafb',
                        color: '#6b7280',
                        fontSize: '14px',
                        zIndex: 10
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                        <div>Đang tải ảnh...</div>
                      </div>
                    </div>

                    {/* Image */}
                    <img
                      src={selectedReport.imageUrl}
                      alt="Ảnh ngập lụt"
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        display: 'block',
                        position: 'relative',
                        zIndex: 20
                      }}
                      onLoad={() => {
                        console.log('✅ Ảnh load thành công:', selectedReport.imageUrl);

                        // XÓA loading overlay khi ảnh load xong
                        const loadingDiv = document.getElementById(`image-loading-${selectedReport.id}`);
                        if (loadingDiv) {
                          loadingDiv.remove();
                        }
                      }}
                      onError={(e) => {
                        console.error('❌ Lỗi load ảnh:', selectedReport.imageUrl);

                        // XÓA loading overlay
                        const loadingDiv = document.getElementById(`image-loading-${selectedReport.id}`);
                        if (loadingDiv) {
                          loadingDiv.remove();
                        }

                        // Hide broken image
                        e.target.style.display = 'none';

                        // Create error message
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = `
                          padding: 40px 20px;
                          text-align: center;
                          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                          border: 2px dashed #ef4444;
                          border-radius: 8px;
                          color: #991b1b;
                        `;

                        errorDiv.innerHTML = `
                          <div style="font-size: 64px; margin-bottom: 16px;">🖼️</div>
                          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                            ❌ Không thể tải ảnh
                          </div>
                          <div style="font-size: 12px; color: #7f1d1d; margin-bottom: 16px;">
                            Backend chưa chạy hoặc ảnh không tồn tại
                          </div>
                          <div style="
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-family: monospace;
                            font-size: 11px;
                            color: #6b7280;
                            word-break: break-all;
                            margin-bottom: 16px;
                          ">
                            ${selectedReport.imageUrl}
                          </div>
                          <a 
                            href="${selectedReport.imageUrl}" 
                            target="_blank"
                            rel="noopener noreferrer"
                            style="
                              display: inline-block;
                              padding: 8px 16px;
                              background: #ef4444;
                              color: white;
                              border-radius: 6px;
                              text-decoration: none;
                              font-size: 13px;
                              font-weight: 600;
                            "
                          >
                            🔗 Thử mở ảnh trong tab mới
                          </a>
                        `;

                        e.target.parentElement.appendChild(errorDiv);
                      }}
                    />
                  </div>

                  {/* Image URL info */}
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    🔗 {selectedReport.imageUrl}
                  </div>
                </div>
              )}
              <div>
                <strong style={{ color: '#374151' }}>Người báo:</strong>{' '}
                <span style={{ color: '#6b7280' }}>
                  {selectedReport?.user?.fullName || selectedReport?.user?.email || 'Ẩn danh'}
                </span>
              </div>
            </div>

            {/* THÊM: Dropdown chọn lại trạng thái khi đã duyệt/từ chối */}
            {(selectedReport?.status === 'Approved' || selectedReport?.status === 'Rejected') && (
              <div style={{ marginTop: '20px' }}>
                <label>
                  <strong style={{ color: '#374151' }}>Chỉnh sửa Trạng thái:</strong>
                  <select
                    value={reviewStatus}
                    onChange={(e) => {
                      setReviewStatus(e.target.value);
                      // Nếu chuyển sang Rejected/Pending, reset WaterLevel
                      if (e.target.value !== 'Approved') {
                        setWaterLevel('');
                      } else {
                        // Nếu chuyển sang Approved, giữ lại WaterLevel cũ nếu có
                        setWaterLevel(selectedReport?.waterLevel || '');
                      }
                    }}
                    style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
                  >
                    <option value="Pending">Chờ duyệt</option>
                    <option value="Approved">Đã duyệt</option>
                    <option value="Rejected">Từ chối</option>
                  </select>
                </label>
              </div>
            )}

            {/* Form Duyệt (Áp dụng cho cả Pending và Re-approve) */}
            {reviewStatus === 'Approved' && (
              <div style={{ marginTop: '16px' }}>
                <label>
                  <strong style={{ color: '#374151' }}>Mức độ ngập: <span style={{ color: '#ef4444' }}>*</span></strong>
                  <select
                    value={waterLevel}
                    onChange={(e) => setWaterLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ccc'
                    }}
                    required
                  >
                    <option value="">-- Chọn mức độ ngập --</option>
                    <option value="Low">🟢 Thấp (Low) - Dưới 20cm</option>
                    <option value="Medium">🟡 Trung bình (Medium) - 20-40cm</option>
                    <option value="High">🔴 Cao (High) - Trên 40cm</option>
                    <option value="Dangerous">🟣 Nguy hiểm (Dangerous) - Trên 60cm</option>
                  </select>
                </label>
              </div>
            )}

            {/* Ghi chú admin (Luôn hiển thị cho mọi trạng thái khi ở modal) */}
            <div style={{ marginTop: '16px' }}>
              <label>
                <strong style={{ color: '#374151' }}>Ghi chú admin:</strong>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú (tùy chọn)..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </label>
            </div>

            {/* Action buttons */}
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                className="btn"
                onClick={() => setShowModal(false)}
                style={{ background: '#6b7280', padding: '10px 20px' }}
              >
                Hủy
              </button>
              
              {/* Nút Xác nhận/Cập nhật - Luôn hiển thị khi ở trong modal */}
              <button
                className="btn"
                onClick={handleSubmitReview}
                disabled={reviewStatus === 'Approved' && !waterLevel}
                style={{
                  // ✅ SỬA: Màu nút dựa trên trạng thái reviewStatus (mới)
                  background: reviewStatus === 'Approved' ? '#10b981' : 
                    reviewStatus === 'Rejected' ? '#ef4444' : '#3b82f6', // Pending, default
                  padding: '10px 20px',
                  opacity: reviewStatus === 'Approved' && !waterLevel ? 0.5 : 1,
                  cursor: reviewStatus === 'Approved' && !waterLevel ? 'not-allowed' : 'pointer'
                }}
              >
                {reviewStatus === 'Approved' ? '✅ Xác nhận Duyệt' : 
                  reviewStatus === 'Rejected' ? '❌ Xác nhận Từ chối' : '🔄 Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}