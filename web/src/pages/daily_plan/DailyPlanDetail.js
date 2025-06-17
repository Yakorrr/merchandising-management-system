import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import {format, parseISO} from 'date-fns'; // Import parseISO for parsing backend dates


const DailyPlanDetail = () => {
    const {id} = useParams();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {isAuthenticated, isAuthReady, getAuthHeaders} = useAuth();

    useEffect(() => {
        const fetchPlan = async () => {
            if (!isAuthReady) return;
            if (!isAuthenticated) {
                setError('You must be logged in to view daily plan details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/daily_plans/${id}/`, {headers: getAuthHeaders()});
                setPlan(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching daily plan details:', err);
                setError(err.response?.data?.detail || 'Failed to fetch daily plan details.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/daily_plans');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [id, isAuthenticated, isAuthReady, getAuthHeaders, navigate]);


    if (loading && !isAuthReady) return <div>Initializing authentication...</div>;
    if (loading) return <div>Loading daily plan details...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;
    if (!plan) return <div>Daily Plan not found.</div>;

    const tableHeaderStyle = {padding: '10px', borderBottom: '1px solid #ddd'};
    const tableCellStyle = {
        padding: '10px',
        borderBottom: '1px solid #eee',
        textAlign: 'center',
        fontSize: '0.9em',
        verticalAlign: 'center'
    };

    return (
        <div>
            <h2>Daily Plan #{plan.id} Details</h2>
            <p><strong>Merchandiser:</strong> {plan.merchandiser_username}</p>
            <p><strong>Plan Date:</strong> {format(parseISO(plan.plan_date), 'dd MMM yyyy')}
            </p>
            <p><strong>Notes:</strong> {plan.notes || 'N/A'}</p>

            <h3>Store Visits:</h3>
            {plan.stores.length === 0 ? (
                <p>No store visits in this plan.</p>
            ) : (
                <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
                    <thead>
                    <tr style={{backgroundColor: '#f2f2f2'}}>
                        <th style={tableHeaderStyle}>Order</th>
                        <th style={tableHeaderStyle}>Store Name</th>
                        <th style={tableHeaderStyle}>Address</th>
                        <th style={tableHeaderStyle}>Coordinates</th>
                        <th style={tableHeaderStyle}>Status</th>
                        <th style={tableHeaderStyle}>Visited At</th>
                    </tr>
                    </thead>
                    <tbody>
                    {plan.stores.map(visit => (
                        <tr key={visit.id}>
                            <td style={tableCellStyle}>{visit.visit_order}</td>
                            <td style={tableCellStyle}>{visit.store_name}</td>
                            <td style={tableCellStyle}>{visit.store_details.address}</td>
                            <td style={tableCellStyle}>
                                {visit.store_details && visit.store_details.latitude && visit.store_details.longitude
                                    ? `Lat: ${visit.store_details.latitude}, Lon: ${visit.store_details.longitude}`
                                    : 'N/A'}
                            </td>
                            <td style={tableCellStyle}>{visit.completed ? 'COMPLETED' : 'PENDING'}</td>
                            <td style={tableCellStyle}>
                                {visit.visited_at ? format(parseISO(visit.visited_at), 'dd MMM yyyy HH:mm') : 'N/A'}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <p><strong>Created At:</strong> {new Date(plan.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(plan.updated_at).toLocaleString()}</p>
            <button onClick={() => navigate('/daily_plans')} style={{
                marginTop: '20px',
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
            }}>
                Back to Daily Plans
            </button>
        </div>
    );
};

export default DailyPlanDetail;