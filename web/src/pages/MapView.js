import React, {useState, useEffect, useRef} from 'react';
import {MapContainer, TileLayer, Marker, Popup, Polyline, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import polyline from '@mapbox/polyline';

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
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const {isAuthenticated, isAuthReady, getAuthHeaders} = useAuth(); // Get getAuthHeaders

    const mapRef = useRef();

    const defaultPosition = [50.4501, 30.5234];
    const [mapCenter, setMapCenter] = useState(defaultPosition);
    const [mapBounds, setMapBounds] = useState(null);

    useEffect(() => {
        const fetchStores = async () => {
            if (!isAuthReady) {
                return;
            }
            if (!isAuthenticated) {
                setError('You must be logged in to view the map.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get('/api/auth/map/stores/', {headers: getAuthHeaders()});
                const fetchedStores = response.data.filter(s => s.latitude && s.longitude);
                setStores(fetchedStores);

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
                console.error('Error fetching stores for map:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setError('Authentication required or not authorized.');
                } else {
                    setError(err.response?.data?.detail || 'Failed to load map data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, [isAuthenticated, isAuthReady, getAuthHeaders]);


    const handleCalculateSampleRoute = async () => {
        if (!isAuthReady || !isAuthenticated) {
            alert("You are not authorized to calculate routes or authentication is not ready.");
            return;
        }
        const relevantStores = stores.slice(0, 3);
        const storeIdsForRoute = relevantStores.map(store => ({store_id: store.id}));

        if (storeIdsForRoute.length < 2) {
            alert('Not enough stores with coordinates to calculate a sample route (min 2).');
            return;
        }

        try {
            setRouteGeometry(null);
            setRouteInfo(null);
            const routeResponse = await axios.post('/api/auth/route/calculate/', {
                points: storeIdsForRoute,
                optimize_order: true
            }, {headers: getAuthHeaders()});
            setRouteGeometry(routeResponse.data.route_geometry);
            setRouteInfo(routeResponse.data);

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

    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading map data...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    const decodedPath = routeGeometry ? polyline.decode(routeGeometry) : [];

    return (
        <div>
            <h2>Store Map View</h2>
            {isAuthenticated && (
                <button onClick={handleCalculateSampleRoute} style={{marginBottom: '10px', padding: '8px 15px'}}>
                    Calculate Sample Optimized Route
                </button>
            )}
            {routeInfo && (
                <div style={{
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid #eee',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <h3>Calculated Route Info:</h3>
                    <p>Total Distance: {routeInfo.total_distance_km} km</p>
                    <p>Total Duration: {routeInfo.total_duration_min} min</p>
                    <p>Optimized Order: {routeInfo.optimized ? 'Yes' : 'No'}</p>
                    {routeInfo.ordered_points && (
                        <ul>
                            {routeInfo.ordered_points.map((point, index) => (
                                <li key={point.store_id || index}>
                                    {index + 1}. {point.store_name} ({point.latitude}, {point.longitude})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
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
                    {stores.map(store => (
                        <Marker key={store.id} position={[parseFloat(store.latitude), parseFloat(store.longitude)]}>
                            <Popup>
                                <strong>{store.name}</strong><br/>
                                {store.address}<br/>
                                Lat: {store.latitude}, Lon: {store.longitude}
                            </Popup>
                        </Marker>
                    ))}
                    {decodedPath.length > 0 && (
                        <Polyline positions={decodedPath} color="blue" weight={5}/>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapView;