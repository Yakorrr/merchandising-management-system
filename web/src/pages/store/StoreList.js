import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const StoreList = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isAuthenticated, isAuthReady, currentUserRole, getAuthHeaders} = useAuth(); // Get currentUserRole

    const fetchStores = async () => {
        if (!isAuthReady) {
            return;
        }
        if (!isAuthenticated) {
            setError('You must be logged in to view stores.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get('/api/auth/stores/', {headers: getAuthHeaders()});
            setStores(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching stores:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Authentication required or not authorized.');
            } else {
                setError(err.response?.data?.detail || 'Failed to fetch stores.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [isAuthenticated, isAuthReady, getAuthHeaders]);


    const handleDeleteStore = async (storeId) => {
        if (!window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
            return; // User cancelled
        }
        try {
            await axios.delete(`/api/auth/stores/${storeId}/delete/`, {headers: getAuthHeaders()});
            alert('Store deleted successfully!');
            // Re-fetch stores to update the list
            fetchStores();
        } catch (err) {
            console.error('Error deleting store:', err);
            alert(err.response?.data?.detail || 'Failed to delete store. You might not have permissions.');
        }
    };


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading stores...</div>;
    }

    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    return (<div>
            <h2>Our Stores</h2>
            {currentUserRole === 'manager' && (<Link to="/stores/create" style={{
                    textDecoration: 'none',
                    padding: '8px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    display: 'inline-block'
                }}>
                    + Add New Store
                </Link>)}
            {stores.length === 0 ? (<p>No stores found.</p>) : (<ul style={{listStyleType: 'none', padding: 0}}>
                    {stores.map(store => (<li key={store.id} style={{
                            border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '5px'
                        }}>
                            <h3>{store.name}</h3>
                            <p>Address: {store.address}</p>
                            <p>Contact: {store.contact_person_name} ({store.contact_person_phone})</p>
                            <p>Coordinates: {store.latitude}, {store.longitude}</p>
                            <div style={{marginTop: '10px'}}>
                                <Link to={`/stores/${store.id}`}
                                      style={{textDecoration: 'none', color: '#007bff', marginRight: '10px'}}>View
                                    Details</Link>
                                {currentUserRole === 'manager' && (<>
                                        <Link to={`/stores/${store.id}/edit`} style={{
                                            textDecoration: 'none', color: '#ffc107', marginRight: '10px'
                                        }}>Edit</Link>
                                        <button onClick={() => handleDeleteStore(store.id)} style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}>Delete
                                        </button>
                                    </>)}
                            </div>
                        </li>))}
                </ul>)}
        </div>);
};

export default StoreList;