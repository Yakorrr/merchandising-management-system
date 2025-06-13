import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isAuthenticated, isAuthReady, currentUserRole, getAuthHeaders} = useAuth();

    const fetchOrders = async () => {
        if (!isAuthReady) {
            return;
        }
        if (!isAuthenticated) {
            setError('You must be logged in to view orders.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            // Backend handles filtering orders by merchandiser role
            const response = await axios.get('/api/auth/orders/', {headers: getAuthHeaders()});
            setOrders(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Authentication required or not authorized.');
            } else {
                setError(err.response?.data?.detail || 'Failed to fetch orders.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [isAuthenticated, isAuthReady, getAuthHeaders]);


    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return; // User cancelled
        }
        try {
            await axios.delete(`/api/auth/orders/${orderId}/delete/`, {headers: getAuthHeaders()});
            alert('Order deleted successfully!');
            await fetchOrders(); // Re-fetch orders to update the list
        } catch (err) {
            console.error('Error deleting order:', err);
            alert(err.response?.data?.detail || 'Failed to delete order. You might not have permissions.');
        }
    };


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading orders...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    const headingText = currentUserRole === 'manager' ? 'All Orders' : 'Your Orders';

    return (
        <div>
            <h2>{headingText}</h2>
            <Link to="/orders/create" style={{
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '5px',
                marginBottom: '20px',
                display: 'inline-block'
            }}>
                + Create New Order
            </Link>
            {orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {orders.map(order => (
                        <li key={order.id} style={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            marginBottom: '10px',
                            borderRadius: '5px'
                        }}>
                            <h3>Order #{order.id} - {order.store_name}</h3>
                            <p>Date: {new Date(order.order_date).toLocaleDateString()}</p>
                            <p>Status: {order.status}</p>
                            <p>Total: ${order.total_amount || 'N/A'}</p>
                            <div style={{marginTop: '10px'}}>
                                <Link to={`/orders/${order.id}`}
                                      style={{textDecoration: 'none', color: '#007bff', marginRight: '10px'}}>View
                                    Details</Link>
                                {currentUserRole === 'manager' && ( // Only managers can edit/delete orders
                                    <>
                                        <Link to={`/orders/${order.id}/edit`} style={{
                                            textDecoration: 'none',
                                            color: '#ffc107',
                                            marginRight: '10px'
                                        }}>Edit</Link>
                                        <button onClick={() => handleDeleteOrder(order.id)} style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}>Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OrderList;