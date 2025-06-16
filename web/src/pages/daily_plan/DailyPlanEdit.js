import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import DailyPlanForm from '../../components/DailyPlanForm';

const DailyPlanEdit = () => {
    const {id} = useParams();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/daily_plans/${id}/`, {headers: getAuthHeaders()});
                setPlan(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching daily plan for edit:', err);
                setError(err.response?.data?.detail || 'Failed to load daily plan for editing.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/daily_plans');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [id, getAuthHeaders, navigate]);


    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            // PATCH request to update daily plan
            await axios.patch(`/api/auth/daily_plans/${id}/update/`, formData, {headers: getAuthHeaders()});
            setMessage('Daily Plan updated successfully!');
            alert('Daily Plan updated successfully!');
            navigate('/daily_plans'); // Redirect to daily plans list
        } catch (err) {
            console.error('Error updating daily plan:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to update daily plan.';
            setMessage(errorMessages);
        }
    };

    if (loading) {
        return <div>Loading daily plan data for editing...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }
    if (!plan) {
        return <div>Daily Plan not found for editing.</div>;
    }

    return (
        <div>
            <h2>Edit Daily Plan: #{plan.id}</h2>
            <DailyPlanForm initialData={plan} onSubmit={handleSubmit} isEditMode={true}
                           submitButtonText="Update Daily Plan"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default DailyPlanEdit;