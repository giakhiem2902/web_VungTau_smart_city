import React, { useEffect, useState, useCallback } from 'react'; // ✅ THÊM useCallback
import { getUsers } from '../services/api.js';
import Panel from '../components/Panel.jsx';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // FIX: Wrap với useCallback
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data?.users || res.data || []); // Handle cả 2 response structure
      setError('');
    } catch (err) {
      setError('Lỗi khi tải dữ liệu Users');
      console.error(err);
    }
    setLoading(false);
  }, []); // Empty dependency

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Panel>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2>Danh sách Users</h2>
        <button className="btn" onClick={loadUsers} 
        style={{
              background: '#6b7280',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
        >🔄 Làm mới</button>
      </div>
      <input
        type="text"
        placeholder="Tìm kiếm email hoặc tên..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: 6, border: '1px solid #ccc' }}
      />
      {loading ? <p style={{ color: '#6b7280' }}>Đang tải dữ liệu...</p> :
        error ? <p style={{ color: 'red' }}>{error}</p> :
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>SĐT</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.fullName || '-'}</td>
                    <td>{u.phoneNumber || '-'}</td>
                    <td>{new Date(u.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </Panel>
  );
}
