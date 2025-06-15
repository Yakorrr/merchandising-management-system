import React, {useState, useEffect, useCallback} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import {format, parseISO} from 'date-fns';

const MetricsDashboard = () => {
    const [metrics, setMetrics] = useState([]);
    const [savedMetrics, setSavedMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();

    // Active filter states, which trigger fetchMetrics
    const initialSearchParams = new URLSearchParams(location.search);
    const [activeStartDate, setActiveStartDate] = useState(initialSearchParams.get('start_date') || '2025-06-01');
    const [activeEndDate, setActiveEndDate] = useState(initialSearchParams.get('end_date') || format(new Date(), 'yyyy-MM-dd'));

    // Temporary states for input fields (controlled by UI, not directly triggering fetch)
    const [startDate, setStartDate] = useState(activeStartDate);
    const [endDate, setEndDate] = useState(activeEndDate);
    const {isAuthReady, isAuthenticated, isManager, getAuthHeaders} = useAuth();

    const fetchMetrics = useCallback(async () => {
        if (!isAuthReady) return;
        if (!isAuthenticated || !isManager) {
            setError('You are not authorized to view metrics.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);

            const response = await axios.get(
                `/api/auth/metrics/calculate/`,
                {
                    params: {
                        start_date: activeStartDate,
                        end_date: activeEndDate
                    },
                    headers: getAuthHeaders()
                }
            );

            setMetrics(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching metrics:', err);
            setError(err.response?.data?.detail || 'Failed to fetch metrics.');
        } finally {
            setLoading(false);
        }
    }, [isAuthReady, isAuthenticated, isManager, getAuthHeaders, activeStartDate, activeEndDate]);

    const fetchSavedMetrics = useCallback(async () => { // Fetch pre-calculated (saved) metrics
        if (!isAuthReady) return;
        if (!isAuthenticated || !isManager) return; // Permissions already checked by fetchMetrics
        try {
            const response = await axios.get('/api/auth/metrics/pre_calculated/', {headers: getAuthHeaders()});
            setSavedMetrics(response.data);
        } catch (err) {
            console.error('Error fetching saved metrics:', err);
            // Optionally set error specific to saved metrics
        }
    }, [isAuthReady, isAuthenticated, isManager, getAuthHeaders]);

    useEffect(() => {
        fetchMetrics(); // Initial fetch and re-fetch on filter change
        fetchSavedMetrics(); // Fetch saved metrics on mount
    }, [fetchMetrics, fetchSavedMetrics]); // Depend on memoized functions

    // Update filters when active filters change (e.g., when navigating to page with URL params)
    useEffect(() => {
        setStartDate(activeStartDate);
        setEndDate(activeEndDate);
    }, [activeStartDate, activeEndDate]);

    const handleFilterChange = (e) => {
        const {name, value} = e.target;
        if (name === 'start_date') setStartDate(value);
        else if (name === 'end_date') setEndDate(value);
    };

    const handleSubmitFilters = (e) => {
        e.preventDefault(); // Prevent full page reload

        // Update active filter states, which will trigger fetchMetrics
        setActiveStartDate(startDate);
        setActiveEndDate(endDate);

        // Trigger refetch by updating URL search params
        const newSearchParams = new URLSearchParams();
        if (startDate) newSearchParams.append('start_date', startDate);
        if (endDate) newSearchParams.append('end_date', endDate);
        navigate({search: newSearchParams.toString()});
    };

    // This endpoint will be used for saving (POST) pre-calculated metrics.
    const handleSaveMetrics = async () => {
        if (!window.confirm(`Save metrics up to ${endDate}? This action will overwrite existing metrics for that date.`)) return;
        try {
            await axios.post(
                `/api/auth/metrics/save/`,
                {
                    target_date: activeEndDate,
                },
                {
                    headers: getAuthHeaders()
                }
            );
            alert(`Metrics saved successfully for date ${endDate}!`);
            fetchSavedMetrics();
        } catch (err) {
            console.error('Error saving metrics:', err);
            alert(err.response?.data?.detail || 'Failed to save metrics.');
        }
    };


    if (loading && !isAuthReady) return <div>Initializing authentication...</div>;
    if (loading) return <div>Loading metrics...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

    return (
        <div>
            <h2>Store Metrics Dashboard</h2>
            <form onSubmit={handleSubmitFilters} style={{
                marginBottom: '20px',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9'
            }}>
                <h3>Filter by Date Range:</h3>
                <div style={{display: 'flex', gap: '15px', marginBottom: '10px'}}>
                    <div>
                        <label htmlFor="start_date" style={{marginRight: '5px'}}>Start Date:</label>
                        <input type="date" id="start_date" name="start_date" value={startDate}
                               onChange={handleFilterChange} style={{padding: '5px'}}/>
                    </div>
                    <div>
                        <label htmlFor="end_date" style={{marginRight: '5px'}}>End Date:</label>
                        <input type="date" id="end_date" name="end_date" value={endDate}
                               onChange={handleFilterChange} style={{padding: '5px'}}/>
                    </div>
                </div>
                <button type="submit" style={{
                    padding: '8px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '10px'
                }}>
                    Apply Filters
                </button>
                <button type="button" onClick={handleSaveMetrics} style={{
                    padding: '8px 15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}>
                    Save Metrics
                </button>
            </form>

            <h3>Calculated Metrics for Current Filter:</h3>
            {metrics.length === 0 ? (
                <p>No metrics found for the selected period.</p>
            ) : (
                <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
                    <thead>
                    <tr style={{backgroundColor: '#f2f2f2'}}>
                        <th style={tableHeaderStyle}>Store ID</th>
                        <th style={tableHeaderStyle}>Store Name</th>
                        <th style={tableHeaderStyle}>Total Orders</th>
                        <th style={tableHeaderStyle}>Total Qty Ordered</th>
                        <th style={tableHeaderStyle}>Avg Order Amount</th>
                        <th style={tableHeaderStyle}>Start Date</th>
                        <th style={tableHeaderStyle}>End Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {metrics.map(metric => (
                        <tr key={metric.store_id}>
                            <td style={tableCellStyle}>{metric.store_id}</td>
                            <td style={tableCellStyle}>{metric["store_name"]}</td>
                            <td style={tableCellStyle}>{metric["total_orders_count"]}</td>
                            <td style={tableCellStyle}>{metric["total_quantity_ordered"]}</td>
                            <td style={tableCellStyle}>${parseFloat(metric["average_order_amount"]).toFixed(2)}</td>
                            <td style={tableCellStyle}>
                                {
                                    format(parseISO(activeStartDate ? activeStartDate : '2025-06-01'),
                                        'dd MMM yyyy')
                                }
                            </td>
                            <td style={tableCellStyle}>
                                {
                                    format(parseISO(activeEndDate ? activeEndDate :
                                            '2025-06-14'),
                                        'dd MMM yyyy')
                                }
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <h3 style={{marginTop: '30px'}}>Pre-Calculated (Saved) Metrics:</h3>
            {savedMetrics.length === 0 ? (
                <p>No pre-calculated metrics saved yet.</p>
            ) : (
                <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd'}}>
                    <thead>
                    <tr style={{backgroundColor: '#f2f2f2'}}>
                        <th style={tableHeaderStyle}>Metric ID</th>
                        <th style={tableHeaderStyle}>Store Name</th>
                        <th style={tableHeaderStyle}>Date Recorded</th>
                        <th style={tableHeaderStyle}>Total Orders</th>
                        <th style={tableHeaderStyle}>Avg Order Amount</th>
                        <th style={tableHeaderStyle}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {savedMetrics.map(metric => (
                        <tr key={metric.id}>
                            <td style={tableCellStyle}>{metric.id}</td>
                            <td style={tableCellStyle}>{metric.store_name}</td>
                            <td style={tableCellStyle}>{format(parseISO(metric.date), 'dd MMM yyyy')}</td>
                            <td style={tableCellStyle}>{metric.total_orders_count}</td>
                            <td style={tableCellStyle}>${parseFloat(metric.average_order_amount).toFixed(2)}</td>
                            <td style={tableCellStyle}>
                                <Link to={`/metrics/${metric.id}`} style={{textDecoration: 'none', color: '#007bff'}}>View
                                    Details</Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const tableHeaderStyle = {padding: '10px', borderBottom: '1px solid #ddd'};
const tableCellStyle = {
    padding: '10px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    fontSize: '0.9em',
    verticalAlign: 'center'
};

export default MetricsDashboard;