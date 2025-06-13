import React, {useState, useEffect, useCallback} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import {ACTION_TYPES} from '../../common/constants';

const LogList = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempFilterUserId, setTempFilterUserId] = useState('');
    const [tempFilterAction, setTempFilterAction] = useState('');
    const [users, setUsers] = useState([]);
    const {isAuthReady, isAuthenticated, isManager, getAuthHeaders} = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => { // Read filters from URL on mount/URL change
        const searchParams = new URLSearchParams(location.search);
        setTempFilterUserId(searchParams.get('user_id') || '');
        setTempFilterAction(searchParams.get('action') || '');
    }, [location.search]);

    const fetchLogs = useCallback(async () => { // Fetch logs based on URL search params
        if (!isAuthReady) return;
        if (!isAuthenticated || !isManager) {
            setError('You are not authorized to view logs.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`/api/auth/logs/${location.search}`, {headers: getAuthHeaders()}); // Fetch logs from API
            setLogs(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError(err.response?.data?.detail || 'Failed to fetch logs.');
        } finally {
            setLoading(false);
        }
    }, [isAuthReady, isAuthenticated, isManager, getAuthHeaders, location.search]);

    const fetchUsersForFilter = useCallback(async () => { // Fetch users for filter dropdown
        if (!isAuthReady || !isAuthenticated || !isManager) return;
        try {
            const response = await axios.get('/api/auth/users/', {headers: getAuthHeaders()});
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users for filter:', err);
        }
    }, [isAuthReady, isAuthenticated, isManager, getAuthHeaders]);

    useEffect(() => {
        fetchLogs(); // Fetch logs when component mounts or URL search params change
    }, [fetchLogs]);

    useEffect(() => {
        fetchUsersForFilter(); // Fetch user list once
    }, [fetchUsersForFilter]);

    const handleFilterChange = (e) => { // Handle temporary filter input changes
        const {name, value} = e.target;
        if (name === 'user_id') setTempFilterUserId(value);
        else if (name === 'action') setTempFilterAction(value);
    };

    const handleFilterSubmit = (e) => { // Handle filter form submission
        e.preventDefault();
        const newSearchParams = new URLSearchParams();
        if (tempFilterUserId) newSearchParams.append('user_id', tempFilterUserId);
        if (tempFilterAction) newSearchParams.append('action', tempFilterAction);
        navigate({search: newSearchParams.toString()}); // Update URL, which triggers fetchLogs
    };

    const handleExportJson = () => { // Handle JSON export
        if (logs.length === 0) {
            alert('No logs to export.');
            return;
        }
        const jsonString = JSON.stringify(logs, null, 4); // Stringify logs with 4-space indentation
        const now = new Date();
        const filename = `logs_export_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}.json`;

        const blob = new Blob([jsonString], {type: 'application/json;charset=utf-8;'}); // Create Blob for JSON file
        const link = document.createElement('a'); // Create download link
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob); // Create object URL
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    if (loading && !isAuthReady) return <div>Initializing authentication...</div>;
    if (loading) return <div>Loading logs...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

    return (
        <div>
            <h2>System Logs</h2>
            <form onSubmit={handleFilterSubmit} style={{
                marginBottom: '20px',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9'
            }}>
                <h3>Filters:</h3>
                <div style={{display: 'flex', gap: '15px', marginBottom: '10px'}}>
                    <div>
                        <label htmlFor="filterUserId" style={{marginRight: '5px'}}>User:</label>
                        <select id="filterUserId" name="user_id" value={tempFilterUserId}
                                onChange={handleFilterChange} style={{padding: '5px'}}>
                            <option value="">All Users</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filterAction" style={{marginRight: '5px'}}>Action:</label>
                        <select id="filterAction" name="action" value={tempFilterAction}
                                onChange={handleFilterChange} style={{padding: '5px'}}>
                            {ACTION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button type="submit" style={{
                    padding: '8px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '10px'
                }}>
                    Apply Filters
                </button>
                <button type="button" onClick={handleExportJson} style={{
                    padding: '8px 15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}>
                    Export to JSON
                </button>
            </form>

            {logs.length === 0 ? (
                <p>No logs found matching your criteria.</p>
            ) : (
                <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
                    <thead>
                    <tr style={{backgroundColor: '#f2f2f2'}}>
                        <th style={tableHeaderStyle}>ID</th>
                        <th style={tableHeaderStyle}>User</th>
                        <th style={tableHeaderStyle}>Action</th>
                        <th style={tableHeaderStyle}>Timestamp</th>
                        <th style={tableHeaderStyle}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td style={tableCellStyle}>{log.id}</td>
                            <td style={tableCellStyle}>{log.username || 'N/A'}</td>
                            <td style={tableCellStyle}>{ACTION_TYPES.find(type => type.value === log.action)?.label || log.action}</td>
                            <td style={tableCellStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                            <td style={tableCellStyle}><Link to={`/logs/${log.id}${location.search}`} style={{
                                textDecoration: 'none',
                                color: '#007bff'
                            }}>View</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const tableHeaderStyle = {padding: '10px', borderBottom: '1px solid #ddd'};
const tableCellStyle = {
    padding: '10px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    fontSize: '0.9em',
    verticalAlign: 'center'
};

export default LogList;