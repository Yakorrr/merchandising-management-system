import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const MetricsDetail = () => {
    const {id} = useParams(); // ID of the specific StoreMetrics entry
    const [metric, setMetric] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {isAuthReady, isAuthenticated, isManager, getAuthHeaders} = useAuth();

    useEffect(() => {
        const fetchMetric = async () => {
            if (!isAuthReady) return;
            if (!isAuthenticated || !isManager) {
                setError('You are not authorized to view metric details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // Fetch pre-calculated metrics detail
                const response = await axios.get(`/api/auth/metrics/pre_calculated/${id}/`, {headers: getAuthHeaders()});
                setMetric(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching metric details:', err);
                setError(err.response?.data?.detail || 'Failed to fetch metric details.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/metrics');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMetric();
    }, [id, isAuthReady, isAuthenticated, isManager, getAuthHeaders, navigate]);


    if (loading && !isAuthReady) return <div>Initializing authentication...</div>;
    if (loading) return <div>Loading metric details...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;
    if (!metric) return <div>Metric entry not found.</div>;

    return (
        <div>
            <h2>Metrics for {metric.store_name} on {metric.date}</h2>
            <p><strong>Total Orders Count:</strong> {metric.total_orders_count}</p>
            <p><strong>Total Quantity Ordered:</strong> {metric.total_quantity_ordered}</p>
            <p><strong>Average Order Amount:</strong> ${parseFloat(metric.average_order_amount).toFixed(2)}</p>
            <p><strong>Created At:</strong> {new Date(metric.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(metric.updated_at).toLocaleString()}</p>
            <button onClick={() => navigate('/metrics')} style={{
                marginTop: '20px',
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
            }}>
                Back to Metrics
            </button>
        </div>
    );
};

export default MetricsDetail;