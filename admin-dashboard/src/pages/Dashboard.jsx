import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, getFeedbacks, getFloodReports, getEventBanners } from '../services/api.js';
import Panel from '../components/Panel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

// Helper functions
function formatTimeAgo(dateString) {
  if (!dateString) return 'Không rõ';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

function getStatusColor(status) {
  const colors = {
    'Pending': '#f59e0b',
    'Approved': '#10b981',
    'Rejected': '#ef4444',
    'Processing': '#3b82f6',
    'Resolved': '#10b981'
  };
  return colors[status] || '#6b7280';
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    feedbacks: 0,
    floodReports: 0,
    pendingFloodReports: 0,
    pendingFeedbacks: 0
  });

  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [floodStatus, setFloodStatus] = useState({});
  const [feedbackStatus, setFeedbackStatus] = useState({});
  // STATE MỚI: LƯU 3 EVENT BANNER GẦN NHẤT
  const [recentEventBanners, setRecentEventBanners] = useState([]); 

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes, feedbackRes, floodRes] = await Promise.all([
        getUsers(),
        getEventBanners(),
        getFeedbacks(),
        getFloodReports()
      ]);

      const usersData = usersRes.data?.data?.users || usersRes.data?.users || usersRes.data?.data || usersRes.data || [];
      const usersCount = Array.isArray(usersData) ? usersData.length : 0;

      const eventsData = eventsRes.data?.data || eventsRes.data || [];
      const eventsCount = Array.isArray(eventsData) ? eventsData.length : 0;
      
      // LOGIC LẤY 3 EVENT BANNER GẦN NHẤT
      const latestBanners = [...eventsData]
        .sort((a, b) => (new Date(b.createdAt || b.Id) - new Date(a.createdAt || a.Id)))
        .slice(0, 3);
      
      // BỎ logic eventStatusCount

      const feedbacksData = feedbackRes.data?.data || feedbackRes.data || [];
      const feedbacksCount = Array.isArray(feedbacksData) ? feedbacksData.length : 0;
      const pendingFeedbacks = feedbacksData.filter(f => f.status === 'Pending').length;

      const floodData = floodRes.data?.data || floodRes.data || [];
      const floodReportsCount = Array.isArray(floodData) ? floodData.length : 0;
      const pendingFloodReports = floodData.filter(f => f.status === 'Pending').length;

      const floodStatusCount = {};
      const feedbackStatusCount = {};

      floodData.forEach(f => {
        const s = f.status || 'Unknown';
        floodStatusCount[s] = (floodStatusCount[s] || 0) + 1;
      });

      feedbacksData.forEach(f => {
        const s = f.status || 'Unknown';
        feedbackStatusCount[s] = (feedbackStatusCount[s] || 0) + 1;
      });

      const activities = [];

      const recentFloods = [...floodData]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(f => ({
          type: 'flood',
          icon: '🌊',
          text: `Báo cáo ngập: ${f.title}`,
          subtext: `${f.user?.fullName || f.user?.username || 'Ẩn danh'} - ${f.address || 'Không rõ địa điểm'}`,
          time: formatTimeAgo(f.createdAt),
          status: f.status,
          color: getStatusColor(f.status),
          id: f.id
        }));

      const recentFeedbacks = [...feedbacksData]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(f => ({
          type: 'feedback',
          icon: '💬',
          text: `Feedback: ${f.title}`,
          subtext: `${f.user?.fullName || f.user?.username || 'Ẩn danh'} - ${f.category || 'General'}`,
          time: formatTimeAgo(f.createdAt),
          status: f.status,
          color: getStatusColor(f.status),
          id: f.id
        }));

      const recentUsers = [...usersData]
        .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))
        .slice(0, 3)
        .map(u => ({
          type: 'user',
          icon: '👤',
          text: `User mới: ${u.fullName || u.username}`,
          subtext: u.email,
          time: formatTimeAgo(u.createdAt || u.created_at),
          color: '#3b82f6'
        }));

      activities.push(...recentFloods, ...recentFeedbacks, ...recentUsers);
      activities.sort((a, b) => {
        const timeA = a.time.includes('vừa xong') ? 0 :
          a.time.includes('phút') ? parseInt(a.time) :
            a.time.includes('giờ') ? parseInt(a.time) * 60 : 999;
        const timeB = b.time.includes('vừa xong') ? 0 :
          b.time.includes('phút') ? parseInt(b.time) :
            b.time.includes('giờ') ? parseInt(b.time) * 60 : 999;
        return timeA - timeB;
      });

      setStats({
        users: usersCount,
        events: eventsCount,
        feedbacks: feedbacksCount,
        floodReports: floodReportsCount,
        pendingFloodReports,
        pendingFeedbacks
      });

      setRecentActivities(activities.slice(0, 10));
      setFloodStatus(floodStatusCount);
      setFeedbackStatus(feedbackStatusCount);
      setRecentEventBanners(latestBanners); // Cập nhật state Event Banner gần nhất

    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            📊 Tổng quan
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Dashboard quản trị hệ thống SmartCity
          </p>
        </div>
        <button
          className="btn"
          onClick={loadStats}
          disabled={loading}
          style={{
            background: loading ? '#9ca3af' : '#6b7280',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳' : '🔄'} Làm mới
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '16px' }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Alert notifications */}
          {(stats.pendingFloodReports > 0 || stats.pendingFeedbacks > 0) && (
            <div style={{
              display: 'grid',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {stats.pendingFloodReports > 0 && (
                <AlertBanner
                  icon="🌊"
                  title="Có báo cáo ngập lụt cần duyệt"
                  message={`${stats.pendingFloodReports} báo cáo đang chờ xử lý`}
                  color="#ef4444"
                  bgColor="#fee2e2"
                  onClick={() => onNavigate && onNavigate('floodreports')}
                />
              )}

              {stats.pendingFeedbacks > 0 && (
                <AlertBanner
                  icon="💬"
                  title="Có feedback cần xử lý"
                  message={`${stats.pendingFeedbacks} phản ánh đang chờ xem xét`}
                  color="#f59e0b"
                  bgColor="#fef3c7"
                  onClick={() => onNavigate && onNavigate('feedbacks')}
                />
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '20px',
            marginBottom: '32px',
            maxWidth: '1400px', 
            margin: '0 auto 32px auto' 
          }}>
            <StatCard
              icon="👥"
              label="Tổng Users"
              value={stats.users}
              color="#3b82f6"
              bgColor="#dbeafe"
              onClick={() => onNavigate && onNavigate('users')}
            />
            <StatCard
              icon="📢"
              label="Sự kiện"
              value={stats.events}
              color="#10b981"
              bgColor="#d1fae5"
              onClick={() => onNavigate && onNavigate('events')}
            />
            <StatCard
              icon="💬"
              label="Feedback"
              value={stats.feedbacks}
              subValue={stats.pendingFeedbacks > 0 ? `${stats.pendingFeedbacks} chờ xử lý` : null}
              color="#f59e0b"
              bgColor="#fef3c7"
              onClick={() => onNavigate && onNavigate('feedbacks')}
            />
            <StatCard
              icon="🌊"
              label="Báo cáo ngập"
              value={stats.floodReports}
              subValue={stats.pendingFloodReports > 0 ? `${stats.pendingFloodReports} chờ duyệt` : null}
              color="#ef4444"
              bgColor="#fee2e2"
              onClick={() => onNavigate && onNavigate('floodreports')}
            />
          </div>

          {/* BỐ CỤC 2 CỘT: Recent Activities (1fr) và Group Status (1fr) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px',
            marginBottom: '32px',
            maxWidth: '1400px',
            margin: '0 auto 32px auto'
          }}>
            {/* Recent Activities */}
            <Panel>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '20px',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚡ Hoạt động gần đây
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '4px 8px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '6px'
                }}>
                  {recentActivities.length}
                </span>
              </h2>

              {recentActivities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <p>Chưa có hoạt động nào</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '10px',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {recentActivities.map((activity, idx) => (
                    <ActivityItem key={idx} {...activity} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </Panel>

            {/* ✅ GROUP STATUSES (Flood Report + Event Banner Details) */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px' 
            }}>
                {/* Flood Reports Status */}
                <Panel style={{ flex: 1 }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        marginBottom: '20px',
                        color: '#111827'
                    }}>
                        🌊 Trạng thái báo cáo ngập
                    </h2>
                    {/* ✅ THÊM BIỂU ĐỒ TRÒN Ở ĐÂY */}
                    <div style={{ marginBottom: '20px' }}>
                      <StatusPieChart data={floodStatus} /> 
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px'
                    }}>
                        {Object.entries(floodStatus).map(([status, count]) => (
                            <StatusCard
                                key={status}
                                status={status}
                                count={count}
                                onClick={() => onNavigate && onNavigate('floodreports')}
                            />
                        ))}
                    </div>
                </Panel>

                {/* Feedback Status - Chiếm toàn bộ chiều rộng */}
          <Panel style={{
            maxWidth: '1400px',
            margin: '0 auto 32px auto'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#111827'
            }}>
              💬 Trạng thái Feedback
            </h2>
            {/* SỬ DỤNG BIỂU ĐỒ TRÒN CHO FEEDBACK */}
            <div style={{ marginBottom: '20px' }}>
                <StatusPieChart data={feedbackStatus} /> 
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              {Object.entries(feedbackStatus).map(([status, count]) => (
                <StatusCard
                  key={status}
                  status={status}
                  count={count}
                  onClick={() => onNavigate && onNavigate('feedbacks')}
                />
              ))}
            </div>
          </Panel>
            </div>
          </div>

          <Panel style={{ flex: 1 }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        marginBottom: '20px',
                        color: '#111827'
                    }}>
                        🖼️ 3 Event Banner Gần Nhất
                    </h2>
                    <div style={{
                        display: 'grid',
                        gap: '12px',
                    }}>
                        {recentEventBanners.length > 0 ? (
                            recentEventBanners.map((banner) => (
                                <RecentEventBannerCard
                                    key={banner.Id}
                                    banner={banner}
                                    onClick={() => onNavigate && onNavigate('events')}
                                />
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                Chưa có Event Banner nào.
                            </div>
                        )}
                    </div>
          </Panel>
        </>
      )}
    </div>
  );
}

// --- Component RecentEventBannerCard ---

function RecentEventBannerCard({ banner, onClick }) {
    const id = banner.Id || banner.id;
    const title = banner.Title || banner.title || 'Không có tiêu đề';
    
    const rawImageUrl = banner.ImageUrl || banner.imageUrl;
    
    // CẤU HÌNH CƠ SỞ CHO ẢNH TĨNH
    // Bạn cần thay đổi giá trị này:
    // Ví dụ 1: Nếu backend của bạn là http://localhost:5000 và file ảnh là http://localhost:5000/uploads/event-image/file.jpg
    //          -> BASE_IMAGE_URL = 'http://localhost:5000/uploads/event-image/';
    // Ví dụ 2: Nếu backend và frontend chạy trên cùng một máy chủ và ảnh được phục vụ từ gốc:
    //          -> BASE_IMAGE_URL = '/uploads/event-image/';
    
    // Giả định backend phục vụ ảnh từ gốc URL /uploads/event-image/
    const BASE_IMAGE_URL = '/uploads/event-image/'; 

    // Nối đường dẫn URL: nếu rawImageUrl là 'image1.jpg' -> finalImageUrl là '/uploads/event-image/image1.jpg'
    const finalImageUrl = rawImageUrl ? `${BASE_IMAGE_URL}${rawImageUrl}` : '';
    
    const description = banner.Description || banner.description;

    return (
        <div 
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
            <div style={{ 
                width: '60px', 
                height: '40px', 
                borderRadius: '4px', 
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <img 
                    // SỬ DỤNG finalImageUrl
                    src={finalImageUrl} 
                    alt={title} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                    }}
                    // Cập nhật onError message
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/60x40?text=IMG'; }}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {title}
                </p>
                <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '11px',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {description || `ID: ${id || 'Không rõ'}`}
                </p>
            </div>
        </div>
    );
}

// ... (Code Dashboard, AlertBanner, StatCard, ActivityItem, StatusCard tiếp theo)

// Components (giữ nguyên)
function AlertBanner({ icon, title, message, color, bgColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        background: bgColor,
        border: `2px solid ${color}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        maxWidth: '1400px',
        margin: '0 auto'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: color
        }}>
          {title}
        </p>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: color,
          opacity: 0.8
        }}>
          {message}
        </p>
      </div>
      <div style={{
        fontSize: '20px',
        color: color
      }}>
        →
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color, bgColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {label}
        </p>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '32px',
          fontWeight: '700',
          color: color
        }}>
          {value}
        </p>
        {subValue && (
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#ef4444',
            fontWeight: '500'
          }}>
            ⚠️ {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ type, icon, text, subtext, time, status, color, id, onNavigate }) {
  return (
    <div
      onClick={() => {
        if (type === 'flood') onNavigate && onNavigate('floodreports');
        if (type === 'feedback') onNavigate && onNavigate('feedbacks');
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        borderLeft: `3px solid ${color}`,
        cursor: type !== 'user' ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (type !== 'user') {
          e.currentTarget.style.background = '#f3f4f6';
          e.currentTarget.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f9fafb';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        border: '2px solid #e5e7eb'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          color: '#111827',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {text}
        </p>
        <p style={{
          margin: '2px 0 0 0',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          {subtext}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        {status && (
          <div style={{ marginBottom: '4px' }}>
            <StatusBadge status={status} size="sm" />
          </div>
        )}
        <p style={{
          margin: 0,
          fontSize: '11px',
          color: '#9ca3af',
          fontWeight: '500'
        }}>
          {time}
        </p>
      </div>
    </div>
  );
}

function StatusCard({ status, count, onClick, colorOverride }) {
  const defaultColors = {
    'Pending': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', icon: '⏳' },
    'Approved': { bg: '#d1fae5', text: '#065f46', border: '#10b981', icon: '✅' },
    'Rejected': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444', icon: '❌' },
    'Processing': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6', icon: '🔄' },
    'Resolved': { bg: '#d1fae5', text: '#065f46', border: '#10b981', icon: '✓' }
  };

  const color = colorOverride || defaultColors[status] || { bg: '#f3f4f6', text: '#374151', border: '#9ca3af', icon: '📋' };

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        background: color.bg,
        borderRadius: '8px',
        border: `2px solid ${color.border}`,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${color.border}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>
        {color.icon}
      </div>
      <p style={{
        margin: 0,
        fontSize: '28px',
        fontWeight: '700',
        color: color.text
      }}>
        {count}
      </p>
      <p style={{
        margin: '4px 0 0 0',
        fontSize: '14px',
        color: color.text,
        fontWeight: '500'
      }}>
        {status}
      </p>
    </div>
  );
}
// Hàm helper để lấy màu sắc cho biểu đồ (giữ nguyên logic từ getStatusColor)
function getChartColors(status) {
    const colors = {
        'Pending': '#f59e0b',
        'Approved': '#10b981',
        'Rejected': '#ef4444',
        'Processing': '#3b82f6',
        'Resolved': '#10b981',
        'Unknown': '#6b7280'
    };
    return colors[status] || '#6b7280';
}
// Biểu đồ tròn cho trạng thái báo cáo ngập
function StatusPieChart({ data }) {
    const chartData = Object.entries(data)
        .map(([status, count]) => ({
            name: status,
            value: count,
            color: getChartColors(status),
        }))
        .filter(item => item.value > 0);

    // Nếu không có dữ liệu, không hiển thị biểu đồ
    if (chartData.length === 0) return <div style={{textAlign: 'center', color: '#9ca3af', padding: '20px'}}>Không có dữ liệu trạng thái.</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    style={{fontSize: '12px'}}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value, name, props) => [`${value} báo cáo`, name]} 
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
// Biểu đồ cột cho báo cáo ngập hàng tháng
function MonthlyFloodReportChart({ data }) {
    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        interval={Math.floor(data.length / 5) - 1} 
                        tickFormatter={(tick) => tick}
                        angle={-30} 
                        textAnchor="end"
                        height={50}
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                        stroke="#6b7280"
                        allowDecimals={false}
                        label={{ value: 'Số lượng báo cáo', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4b5563', fontSize: '12px' } }}
                    />
                    <Tooltip 
                        labelFormatter={(label) => `Ngày ${label}`}
                        formatter={(value) => [`${value} báo cáo`, 'Số lượng']}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                    />
                    <Bar 
                        dataKey="reports" 
                        fill="#3b82f6" 
                        name="Số lượng báo cáo"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}