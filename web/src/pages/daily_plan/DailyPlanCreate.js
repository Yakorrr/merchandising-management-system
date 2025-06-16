import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import DailyPlanForm from '../../components/DailyPlanForm';

const DailyPlanCreate = () => {
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            await axios.post('/api/auth/daily_plans/create/', formData, {headers: getAuthHeaders()});
            setMessage('Daily Plan created successfully!');
            alert('Daily Plan created successfully!');
            navigate('/daily_plans'); // Redirect to daily plans list
        } catch (err) {
            console.error('Error creating daily plan:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to create daily plan.';
            setMessage(errorMessages);
        }
    };

    return (
        <div>
            <h2>Create New Daily Plan</h2>
            <DailyPlanForm onSubmit={handleSubmit} submitButtonText="Create Daily Plan"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default DailyPlanCreate;