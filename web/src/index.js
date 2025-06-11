import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import {AuthProvider} from './context/AuthContext';
import './common/axios_interceptor';
import {BrowserRouter as Router} from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <AuthProvider>
                <App/>
            </AuthProvider>
        </Router>
    </React.StrictMode>
);