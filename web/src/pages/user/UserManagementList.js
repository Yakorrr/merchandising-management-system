import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const UserManagementList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isAuthReady, isAuthenticated, isManager, getAuthHeaders} = useAuth();

    const fetchUsers = async () => {
        if (!isAuthReady) {
            return;
        }
        if (!isAuthenticated || !isManager) {
            setError('You are not authorized to view user management.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get('/api/auth/users/', {headers: getAuthHeaders()});
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Authentication required or not authorized.');
            } else {
                setError(err.response?.data?.detail || 'Failed to fetch users.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [isAuthReady, isAuthenticated, isManager, getAuthHeaders]);


    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await axios.delete(`/api/auth/users/${userId}/delete/`, {headers: getAuthHeaders()});
            alert(`User "${username}" deleted successfully!`);
            fetchUsers(); // Re-fetch users to update the list
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(err.response?.data?.detail || 'Failed to delete user. You might not have permissions.');
        }
    };


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading users...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>User Management</h2>
            <Link to="/users/create" style={{
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: '5px',
                marginBottom: '20px',
                display: 'inline-block'
            }}>
                + Add New User
            </Link>
            {users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {users.map(user => (
                        <li key={user.id} style={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            marginBottom: '10px',
                            borderRadius: '5px'
                        }}>
                            <h3>{user.username} ({user.role})</h3>
                            <p>Email: {user.email}</p>
                            <p>Name: {user.first_name} {user.last_name}</p>
                            <p>Joined: {new Date(user.date_joined).toLocaleDateString()}</p>
                            <div style={{marginTop: '10px'}}>
                                <Link to={`/users/${user.id}`}
                                      style={{textDecoration: 'none', color: '#007bff', marginRight: '10px'}}>View
                                    Details</Link>
                                <Link to={`/users/${user.id}/edit`} style={{
                                    textDecoration: 'none',
                                    color: '#ffc107',
                                    marginRight: '10px'
                                }}>Edit</Link>
                                <button onClick={() => handleDeleteUser(user.id, user.username)} style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}>Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserManagementList;