import React, {createContext, useState, useEffect, useContext} from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    // User state stores the comprehensive user object { userData, accessToken, refreshToken }
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const loadUserFromStorage = () => {
            const currentUser = authService.getCurrentUser(); // Gets full user object
            if (currentUser) {
                setUser(currentUser);
            }
            setIsAuthReady(true);
        };
        loadUserFromStorage();
    }, []);

    const login = async (usernameOrEmail, password) => {
        const responseData = await authService.login(usernameOrEmail, password); // Returns full response with user and tokens
        // authService.login already stores user in localStorage
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        return responseData;
    };

    const logout = async () => {
        try {
            await authService.logout(); // authService.logout handles token retrieval/clearing
        } catch (error) {
            console.error('Logout failed on backend:', error);
        } finally {
            setUser(null); // Clear user state
        }
    };

    const register = async (username, email, password, password2, role, firstName, lastName) => {
        const response = await authService.register(
            username, email, password, password2, role, firstName, lastName
        );
        return response.data;
    };

    const getAuthHeaders = () => {
        const currentUser = authService.getCurrentUser(); // Get full user object from localStorage
        if (currentUser && currentUser.accessToken) {
            return { Authorization: `Bearer ${currentUser.accessToken}` };
        }
        return {};
    };

    // Derived states for convenience
    const isAuthenticated = !!user;
    const isManager = user && user.userData && user.userData.role === 'manager'; // Access role from userData
    const currentUserName = user && user.userData ? (user.userData.first_name
        || user.userData.username) : null;
    const currentUserRole = user && user.userData ? user.userData.role : null;


    const value = {
        user, // The full user object from localStorage
        isAuthenticated,
        isManager,
        currentUserName,
        currentUserRole,
        login,
        logout,
        register,
        isAuthReady,
        getAuthHeaders,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};