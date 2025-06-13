import React from 'react';
import {Routes, Route, Link, useNavigate, Navigate} from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';

import Dashboard from './pages/Dashboard';
import MapView from './pages/map/MapView';
import Welcome from './pages/Welcome';
import StoreList from './pages/store/StoreList';
import StoreDetail from './pages/store/StoreDetail';
import StoreCreate from './pages/store/StoreCreate';
import StoreEdit from './pages/store/StoreEdit';

import UserManagementList from './pages/user/UserManagementList';
import UserManagementCreate from './pages/user/UserManagementCreate';
import UserManagementEdit from './pages/user/UserManagementEdit';
import UserManagementDetail from './pages/user/UserManagementDetail';

import {useAuth} from './context/AuthContext';

// PrivateRoute component
const PrivateRoute = ({children, allowedRoles}) => {
    const {isAuthenticated, user, isAuthReady} = useAuth();
    // Show loading while authentication state is being determined
    if (!isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (!isAuthenticated) { // If not authenticated after ready, redirect to welcome/login
        return <Navigate to="/welcome" replace/>;
    }
    // Check if user object exists and has the 'role' property directly
    if (allowedRoles && (!user || !allowedRoles.includes(user.userData.role))) { // Access role from userData
        return <Navigate to="/dashboard" replace/>;
    }
    return children;
};

function App() {
    const {isAuthenticated, currentUserName, currentUserRole, logout, isAuthReady} = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/welcome');
        } catch (error) {
            console.error('Logout failed:', error);
            alert(error.response?.data?.detail || 'Logout failed. Please try again.');
        }
    };

    return (
        <div className="App">
            <nav style={{
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #ddd'
            }}>
                <Link to="/welcome" style={{marginRight: '15px'}}>Welcome</Link>
                {isAuthenticated && (
                    <>
                        <Link to="/dashboard" style={{marginRight: '15px'}}>Dashboard</Link>
                        {currentUserRole === 'manager' && (
                            <>
                                <Link to="/users" style={{marginRight: '15px', color: 'purple'}}>Users</Link>
                            </>
                        )}
                        <Link to="/stores" style={{marginRight: '15px'}}>Stores</Link>
                        <Link to="/map" style={{marginRight: '15px'}}>Map</Link>
                    </>
                )}

                <div style={{float: 'right'}}>
                    {isAuthenticated ? (
                        <span style={{marginRight: '10px'}}>
                            Welcome, {currentUserName} ({currentUserRole})!
                            <button onClick={handleLogout}
                                    style={{marginLeft: '10px', padding: '5px 10px'}}>Logout</button>
                        </span>
                    ) : (
                        <>
                            <Link to="/login" style={{marginRight: '15px'}}>Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </nav>

            <div style={{padding: '20px'}}>
                <Routes>
                    <Route path="/welcome" element={<Welcome/>}/>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard/>
                        </PrivateRoute>
                    }/>

                    {/* Manager-only routes for User Management */}
                    <Route path="/users" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <UserManagementList/>
                        </PrivateRoute>
                    }/>
                    <Route path="/users/create" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <UserManagementCreate/>
                        </PrivateRoute>
                    }/>
                    <Route path="/users/:id" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <UserManagementDetail/>
                        </PrivateRoute>
                    }/>
                    <Route path="/users/:id/edit" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <UserManagementEdit/>
                        </PrivateRoute>
                    }/>
                    {/* Routes for Store Management */}
                    <Route path="/stores" element={
                        <PrivateRoute>
                            <StoreList/>
                        </PrivateRoute>
                    }/>
                    <Route path="/stores/:id" element={
                        <PrivateRoute>
                            <StoreDetail/>
                        </PrivateRoute>
                    }/>
                    {/* Manager-only routes for Store Management */}
                    <Route path="/stores/create" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <StoreCreate/>
                        </PrivateRoute>
                    }/>
                    <Route path="/stores/:id/edit" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <StoreEdit/>
                        </PrivateRoute>
                    }/>

                    <Route path="/map" element={
                        <PrivateRoute>
                            <MapView/>
                        </PrivateRoute>
                    }/>
                    {/* Default route: wait until auth is ready before redirecting */}
                    <Route path="*" element={
                        !isAuthReady ? (
                            <div>Initializing authentication...</div>
                        ) : (
                            <Navigate to={isAuthenticated ? "/dashboard" : "/welcome"} replace/>
                        )
                    }/>
                </Routes>
            </div>
        </div>
    );
}

export default App;