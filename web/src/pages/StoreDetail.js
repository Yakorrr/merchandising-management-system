import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';

const StoreDetail = () => {
    const {id} = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {isAuthenticated, isAuthReady, getAuthHeaders} = useAuth();

    useEffect(() => {
        const fetchStore = async () => {
            if (!isAuthReady) {
                return;
            }
            if (!isAuthenticated) {
                setError('You must be logged in to view store details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/stores/${id}/`,
                    {headers: getAuthHeaders()});
                setStore(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching store details:', err);
                if (err.response?.status === 401) {
                    setError('Authentication required.');
                } else if (err.response?.status === 403) {
                    setError('Authentication status: not authorized.');
                } else {
                    setError(err.response?.data?.detail || 'Failed to fetch store details.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStore();
    }, [id, isAuthenticated, isAuthReady, navigate, getAuthHeaders]);

    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading store details...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }
    if (!store) {
        return <div>Store not found.</div>;
    }

    return (
        <div>
            <h2>{store.name} Details</h2>
            <p><strong>Address:</strong> {store.address}</p>
            <p><strong>Contact Person:</strong> {store.contact_person_name}</p>
            <p><strong>Contact Phone:</strong> {store.contact_person_phone}</p>
            <p><strong>Latitude:</strong> {store.latitude}</p>
            <p><strong>Longitude:</strong> {store.longitude}</p>
            <p><strong>Created At:</strong> {new Date(store.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(store.updated_at).toLocaleString()}</p>
            <button onClick={() => navigate('/stores')}>Back to Stores</button>
        </div>
    );
};

export default StoreDetail;