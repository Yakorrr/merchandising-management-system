import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const OrderDetail = () => {
    const {id} = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {isAuthenticated, isAuthReady, getAuthHeaders} = useAuth();

    useEffect(() => {
        const fetchOrder = async () => {
            if (!isAuthReady) {
                return;
            }
            if (!isAuthenticated) {
                setError('You must be logged in to view order details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/orders/${id}/`, {headers: getAuthHeaders()});
                setOrder(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError(err.response?.data?.detail || 'Failed to fetch order details.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/orders');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, isAuthenticated, isAuthReady, getAuthHeaders, navigate]);


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading order details...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }
    if (!order) {
        return <div>Order not found.</div>;
    }

    return (
        <div>
            <h2>Order #{order.id} Details</h2>
            <p><strong>Store:</strong> {order.store_name}</p>
            <p><strong>Merchandiser:</strong> {order.merchandiser_username}</p>
            <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Total Amount:</strong> ${order.total_amount || 'N/A'}</p>

            <h3>Items:</h3>
            {order.items.length === 0 ? (
                <p>No items in this order.</p>
            ) : (
                <ul style={{listStyleType: 'disc', paddingLeft: '20px'}}>
                    {order.items.map(item => (
                        <li key={item.id}>
                            {item.product_name}: {item.quantity} pcs * ${item.price_per_unit} =
                            ${item.quantity * item.price_per_unit}
                        </li>
                    ))}
                </ul>
            )}

            <p><strong>Created At:</strong> {new Date(order.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(order.updated_at).toLocaleString()}</p>
            <button onClick={() => navigate('/orders')}>Back to Orders</button>
        </div>
    );
};

export default OrderDetail;