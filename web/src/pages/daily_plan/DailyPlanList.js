import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import {format} from 'date-fns';

const DailyPlanList = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isAuthenticated, isAuthReady, currentUserRole, getAuthHeaders} = useAuth();

    const fetchPlans = async () => {
        if (!isAuthReady) return;
        if (!isAuthenticated) {
            setError('You must be logged in to view daily plans.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            // Backend handles filtering plans by merchandiser role
            const response = await axios.get('/api/auth/daily_plans/', {headers: getAuthHeaders()});
            setPlans(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching daily plans:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Authentication required or not authorized.');
            } else {
                setError(err.response?.data?.detail || 'Failed to fetch daily plans.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [isAuthenticated, isAuthReady, getAuthHeaders]);


    const handleDeletePlan = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this daily plan? This action cannot be undone.')) {
            return;
        }
        try {
            await axios.delete(`/api/auth/daily_plans/${planId}/delete/`, {headers: getAuthHeaders()});
            alert('Daily Plan deleted successfully!');
            await fetchPlans(); // Re-fetch plans to update the list
        } catch (err) {
            console.error('Error deleting daily plan:', err);
            alert(err.response?.data?.detail || 'Failed to delete daily plan. You might not have permissions.');
        }
    };


    if (loading && !isAuthReady) return <div>Initializing authentication...</div>;
    if (loading) return <div>Loading daily plans...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

    return (
        <div>
            <h2>{currentUserRole === 'manager' ? 'All Daily Plans' : 'Your Daily Plans'}</h2>
            {currentUserRole === 'manager' && (<Link to="/daily_plans/create" style={{
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '5px',
                marginBottom: '20px',
                display: 'inline-block'
            }}>
                + Create New Daily Plan
            </Link>)}
            {plans.length === 0 ? (
                <p>No daily plans found.</p>
            ) : (
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {plans.map(plan => (
                        <li key={plan.id} style={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            marginBottom: '10px',
                            borderRadius: '5px'
                        }}>
                            <h3>Plan
                                #{plan.id} for {plan.merchandiser_username} on {format(new Date(plan.plan_date), 'dd MMM yyyy')}</h3>
                            <p>Notes: {plan.notes || 'N/A'}</p>
                            <p>Stores in plan: {plan.stores ? plan.stores.length : 0}</p>
                            <div style={{marginTop: '10px'}}>
                                <Link to={`/daily_plans/${plan.id}`}
                                      style={{textDecoration: 'none', color: '#007bff', marginRight: '10px'}}>View
                                    Details</Link>
                                {currentUserRole === 'manager' && ( // Only managers can edit/delete plans
                                    <>
                                        <Link to={`/daily_plans/${plan.id}/edit`} style={{
                                            textDecoration: 'none',
                                            color: '#ffc107',
                                            marginRight: '10px'
                                        }}>Edit</Link>
                                        <button onClick={() => handleDeletePlan(plan.id)} style={{
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

export default DailyPlanList;