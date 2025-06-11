import React, {createContext, useState, useEffect, useContext} from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);

    useEffect(() => {
        const userData = authService.getCurrentUserData();
        const userTokens = authService.getCurrentUserTokens();
        if (userData && userTokens) {
            setUser(userData);
            setTokens(userTokens);
        }
    }, []);

    const login = async (usernameOrEmail, password) => {
        const responseData = await authService.login(usernameOrEmail, password); // This contains user data and tokens
        if (responseData.user && responseData.access && responseData.refresh) {
            setUser(responseData.user); // Store only user data
            setTokens([responseData.access, responseData.refresh]); // Store tokens array
        } else {
            setUser(null);
            setTokens(null);
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_tokens');
        }
        return responseData;
    };

    const logout = async () => {
        const currentTokens = authService.getCurrentUserTokens();
        if (currentTokens && currentTokens[1]) {
            try {
                await authService.logout(currentTokens[1]);
            } catch (error) {
                console.error('Logout failed on backend:', error);
            }
        }
        setUser(null);
        setTokens(null);
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_tokens');
    };

    const register = async (username, email, password, password2, role, firstName, lastName) => {
        const response =
            await authService.register(username, email, password, password2, role, firstName, lastName);
        return response.data;
    };

    const value = {user, tokens, login, logout, register};

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};