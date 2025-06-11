import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';

const StoreList = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isAuthenticated, isAuthReady, getAuthHeaders} = useAuth(); // Get getAuthHeaders

    useEffect(() => {
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

        fetchStores();
    }, [isAuthenticated, isAuthReady, getAuthHeaders]); // Add getAuthHeaders to dependencies

    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading stores...</div>;
    }

    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Our Stores</h2>
            {stores.length === 0 ? (
                <p>No stores found.</p>
            ) : (
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {stores.map(store => (
                        <li key={store.id} style={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            marginBottom: '10px',
                            borderRadius: '5px'
                        }}>
                            <h3>{store.name}</h3>
                            <p>Address: {store.address}</p>
                            <p>Contact: {store.contact_person_name} ({store.contact_person_phone})</p>
                            <p>Coordinates: {store.latitude}, {store.longitude}</p>
                            <Link to={`/stores/${store.id}`} style={{textDecoration: 'none', color: '#007bff'}}>View
                                Details</Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StoreList;