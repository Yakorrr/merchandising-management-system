import React, {useState, useEffect, useRef} from 'react';
import {MapContainer, TileLayer, Marker, Popup, Polyline, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import polyline from '@mapbox/polyline';
import {format, parseISO} from 'date-fns'; // Import parseISO for parsing backend dates

// Default Leaflet icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapRecenter = ({bounds}) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);
    return null;
};


const MapView = () => {
    const [allStores, setAllStores] = useState([]); // This will now just be for general map, not route calculation
    const [dailyPlans, setDailyPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [storesInSelectedPlan, setStoresInSelectedPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [returnToStart, setReturnToStart] = useState(false); // New state for "Return to Start Position" checkbox
    const {isAuthenticated, isAuthReady, getAuthHeaders, isManager, user} = useAuth();

    const mapRef = useRef();

    const defaultPosition = [50.4501, 30.5234];
    const [mapCenter, setMapCenter] = useState(defaultPosition);
    const [mapBounds, setMapBounds] = useState(null);

    // Fetch all stores (for initial general map view)
    useEffect(() => {
        const fetchAllStores = async () => {
            if (!isAuthReady || !isAuthenticated) {
                setError('You must be logged in to view the map.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get('/api/auth/map/stores/', {headers: getAuthHeaders()});
                const fetchedStores = response.data.filter(s => s.latitude && s.longitude);
                setAllStores(fetchedStores);

                if (fetchedStores.length > 0) {
                    const latLngs = fetchedStores.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);
                    setMapCenter([parseFloat(fetchedStores[0].latitude), parseFloat(fetchedStores[0].longitude)]);
                    const bounds = L.latLngBounds(latLngs);
                    setMapBounds(bounds);
                } else {
                    setMapCenter(defaultPosition);
                    setMapBounds(null);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching all stores for map:', err);
                setError(err.response?.data?.detail || 'Failed to load general map data.');
            } finally {
                setLoading(false);
            }
        };

        // Fetch daily plans
        const fetchDailyPlans = async () => {
            if (!isAuthReady || !isAuthenticated) return;
            try {
                const response = await axios.get('/api/auth/daily_plans/', {headers: getAuthHeaders()});
                setDailyPlans(response.data);
            } catch (err) {
                console.error('Error fetching daily plans:', err);
            }
        };

        fetchAllStores();
        fetchDailyPlans();
    }, [isAuthenticated, isAuthReady, getAuthHeaders, user]);


    // Fetch stores for the selected daily plan
    useEffect(() => {
        const fetchStoresForPlan = async () => {
            setRouteGeometry(null); // Clear route when plan selection changes
            setRouteInfo(null);     // Clear route info when plan selection changes

            if (!selectedPlanId) {
                setStoresInSelectedPlan([]);
                if (allStores.length > 0) { // Refit to allStores if no plan selected
                    const latLngs = allStores.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);
                    setMapBounds(L.latLngBounds(latLngs));
                }
                return;
            }
            try {
                const response = await axios.get(`/api/auth/daily_plans/${selectedPlanId}/stores/`, {headers: getAuthHeaders()});
                const fetchedPlanStores = response.data.filter(visit => visit.store_details && visit.store_details.latitude && visit.store_details.longitude);
                setStoresInSelectedPlan(fetchedPlanStores);

                if (fetchedPlanStores.length > 0) {
                    const latLngs = fetchedPlanStores.map(visit => [parseFloat(visit.store_details.latitude), parseFloat(visit.store_details.longitude)]);
                    const bounds = L.latLngBounds(latLngs);
                    setMapBounds(bounds);
                } else {
                    setMapBounds(null); // No bounds if no stores in plan
                }
            } catch (err) {
                console.error('Error fetching stores for selected plan:', err);
                alert(`Failed to load stores for plan: ${err.response?.data?.detail || err.message}`);
                setStoresInSelectedPlan([]);
                setMapBounds(null);
            }
        };
        fetchStoresForPlan();
    }, [selectedPlanId, getAuthHeaders, allStores]);


    const handleCalculateRouteFromPlan = async () => {
        // Condition: Check for at least 2 stores with coordinates in selected plan
        if (!selectedPlanId || storesInSelectedPlan.length < 2) {
            alert('Please select a daily plan with at least two stores (that have coordinates) to calculate a route.');
            return;
        }

        // Prepare points for routing API in visit_order
        // The /trip/ endpoint expects points in ANY order, and it optimizes it.
        // It always returns an ordered list.
        const storeIdsForRoute = storesInSelectedPlan
            .sort((a, b) => a.visit_order - b.visit_order) // Sort by plan order locally
            .map(visit => ({store_id: visit.store})); // Use visit.store (ID) for backend


        try {
            setRouteGeometry(null); // Clear previous route
            setRouteInfo(null);

            // Call route calculation API. Always optimize order (as per new requirement)
            // The OSRM /trip/ endpoint handles optimization and returning the ordered points.
            const routeResponse = await axios.post('/api/auth/route/calculate/', {
                points: storeIdsForRoute,
                optimize_order: returnToStart, // Always request optimized order from backend (Trip API)
                // New: Pass a flag if we want to return to start (for OSRM Trip API)
                roundtrip: returnToStart // OSRM Trip API parameter
            }, {headers: getAuthHeaders()});

            setRouteGeometry(routeResponse.data.route_geometry);
            setRouteInfo(routeResponse.data); // routeInfo will now contain the optimized order from backend

            if (routeResponse.data.route_geometry) {
                const decodedRoute = polyline.decode(routeResponse.data.route_geometry);
                if (decodedRoute.length > 0) {
                    const routeBounds = L.latLngBounds(decodedRoute);
                    setMapBounds(routeBounds);
                }
            }
        } catch (err) {
            console.error('Error calculating route:', err);
            setError(err.response?.data?.detail || 'Route calculation failed.');
            alert(`Route calculation failed: ${err.response?.data?.message || err.response?.data?.detail || err.message}`);
        }
    };


    if (loading && !isAuthReady) return <div>Initializing map data...</div>;
    if (loading) return <div>Loading map data...</div>;
    if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

    const decodedPath = routeGeometry ? polyline.decode(routeGeometry) : [];

    // Determine which set of markers to render
    // If a route has been calculated and contains points, render those (they are already ordered/optimized)
    // Otherwise, if a plan is selected, render stores from that plan.
    // If no plan is selected, render all stores.
    const markersToRender = routeInfo && routeInfo.ordered_points && routeInfo.ordered_points.length > 0
        ? routeInfo.ordered_points.map(p => ({
            id: p.store_id,
            name: p.store_name,
            address: p.store_address,
            latitude: p.latitude,
            longitude: p.longitude,
            store_details: {latitude: p.latitude, longitude: p.longitude, address: p.store_address}
        }))
        : (selectedPlanId === ''
                ? allStores
                : storesInSelectedPlan.map(s => ({
                    id: s.store,
                    name: s.store_name,
                    address: s.store_details.address,
                    latitude: s.store_details.latitude,
                    longitude: s.store_details.longitude,
                    store_details: s.store_details
                }))
        );


    return (
        <div>
            <h2>Route Planner & Map View</h2>

            <div style={{
                marginBottom: '20px',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9'
            }}>
                <h3>Select a Daily Plan:</h3>
                <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    style={{padding: '8px', marginRight: '10px'}}
                >
                    <option value="">-- Select Daily Plan --</option>
                    {/* Removed option to view all stores directly */}
                    {dailyPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                            Plan #{plan.id} {
                                isManager ? `for ${plan.merchandiser_username}` : ''
                            } on {format(parseISO(plan.plan_date), 'dd MMM yyyy')}
                        </option>
                    ))}
                </select>
                <div style={{marginTop: '10px', marginBottom: '10px'}}>
                    <label style={{marginRight: '10px'}}>
                        <input type="checkbox" checked={returnToStart}
                               onChange={(e) => setReturnToStart(e.target.checked)}/>
                        Return to Start Position {/* Changed checkbox text */}
                    </label>
                </div>
                <button
                    onClick={handleCalculateRouteFromPlan}
                    disabled={!selectedPlanId || storesInSelectedPlan.length < 2}
                    style={{
                        padding: '8px 15px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Calculate Route
                </button>
                {/* Warning logic for less than 2 stores in selected plan */}
                {selectedPlanId && selectedPlanId !== '' && storesInSelectedPlan.length < 2 && (
                    <p style={{color: 'orange', marginTop: '5px'}}>Selected plan needs at least 2 stores with
                        coordinates for routing.</p>
                )}
            </div>

            <div style={{
                height: '70vh',
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '5px',
                overflow: 'hidden'
            }}>
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true}
                              style={{height: '100%', width: '100%'}}>
                    <MapRecenter bounds={mapBounds}/>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {markersToRender.map(item => (
                        <Marker
                            key={item.id}
                            position={[
                                parseFloat(item.latitude),
                                parseFloat(item.longitude)
                            ]}
                        >
                            <Popup>
                                <strong>{item.name}</strong><br/>
                                {item.address}<br/>
                                Lat: {item.latitude}, Lon: {item.longitude}
                            </Popup>
                        </Marker>
                    ))}
                    {decodedPath.length > 0 && (
                        <Polyline positions={decodedPath} color="blue" weight={5}/>
                    )}
                </MapContainer>
            </div>

            {routeInfo && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    border: '1px solid #eee',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <h3>Calculated Route Info:</h3>
                    <p>Total Distance: {routeInfo.total_distance_km} km</p>
                    <p>Total Duration: {routeInfo.total_duration_min} min</p>
                    <p>Return to Start: {routeInfo.optimized ? 'Yes' : 'No'}</p> {/* Changed text */}
                    {routeInfo.ordered_points && ( // This block now always displays ordered points from routeInfo
                        <ul>
                            {routeInfo.ordered_points.map((point, index) => (
                                <li key={point.store_id || index}>
                                    <p>{index + 1}. {point.store_name}, {point.store_address}</p>
                                    <p>Latitude: {point.latitude}</p>
                                    <p>Longitude: {point.longitude}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default MapView;