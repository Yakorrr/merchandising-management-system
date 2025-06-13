import React, {useState, useEffect} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom'; // Import useLocation
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import {ACTION_TYPES} from "../../common/constants";

const LogDetail = () => {
    const {id} = useParams();
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); // Get current URL location to pass search params
    const {isAuthReady, isAuthenticated, isManager, getAuthHeaders} = useAuth();

    const formatLogDetails = (details, indent = 0) => { // Format log details for display with indentation
        if (details === null || typeof details !== 'object') return String(details);
        const indentStr = ' '.repeat(indent * 4);

        if (Array.isArray(details)) {
            return details.map((item) => {
                return `${indentStr}  - ${formatLogDetails(item, indent + 1)}`;
            }).join('\n');
        }

        return Object.entries(details)
            .map(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                let formattedValue;
                if (typeof value === 'object' && value !== null) formattedValue = `\n${formatLogDetails(value, indent + 1)}`;
                else formattedValue = String(value);
                return `${indentStr}${formattedKey}: ${formattedValue}`;
            })
            .join('\n');
    };

    useEffect(() => {
        const fetchLog = async () => {
            if (!isAuthReady) return;
            if (!isAuthenticated || !isManager) {
                setError('You are not authorized to view log details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/logs/${id}/`, {headers: getAuthHeaders()});
                setLog(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching log details:', err);
                setError(err.response?.data?.detail || 'Failed to fetch log details.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/logs');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLog();
    }, [id, isAuthReady, isAuthenticated, isManager, getAuthHeaders, navigate]);


    if (loading && !isAuthReady) return <div>Initializing authentication...</div>;
    if (loading) return <div>Loading log details...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;
    if (!log) return <div>Log entry not found.</div>;

    return (
        <div>
            <h2>Log Entry #{log.id} Details</h2>
            <p><strong>User:</strong> {log.username || 'N/A'} (ID: {log.user || 'N/A'})</p>
            <p><strong>Action:</strong> {ACTION_TYPES.find(type => type.value === log.action)?.label || log.action}
            </p> {/* Use actionTypes for consistent display */}
            <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
            <p><strong>Details:</strong></p>
            <pre style={{
                backgroundColor: '#f0f0f0',
                padding: '10px',
                borderRadius: '5px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
            }}>
                {formatLogDetails(log.details)}
            </pre>
            <button onClick={() => navigate(`/logs${location.search}`)} style={{
                marginTop: '20px',
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
            }}>
                Back to Logs
            </button>
        </div>
    );
};

export default LogDetail;