import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps extends RouteProps {
    component: React.ComponentType<any>;
    adminOnly?: boolean;
}

// One place that decides who may see a page.
// It waits for the session to be restored (refresh cookie) before deciding,
// so reloading a protected page no longer bounces a logged-in user away.
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, adminOnly = false, ...rest }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    return (
        <Route
            {...rest}
            render={(props) => {
                if (isLoading) return <LoadingSpinner />;

                if (!isAuthenticated) {
                    const target = props.location.pathname + props.location.search;
                    return <Redirect to={`/login?redirect=${encodeURIComponent(target)}`} />;
                }

                if (adminOnly && !isAdmin) return <Redirect to="/" />;

                return <Component {...props} />;
            }}
        />
    );
};

export default ProtectedRoute;
