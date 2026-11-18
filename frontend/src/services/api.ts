// ─────────────────────────────────────────────
// apiFetch — a thin wrapper around fetch for authenticated calls.
// • attaches the access token from localStorage
// • always sends cookies (needed for the refresh token)
// • on a 401, silently calls /auth/refresh ONCE, stores the new access token,
//   and retries the original request
// New code should use this instead of calling fetch directly.
// ─────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || '/api';

const getToken = () => localStorage.getItem('veg_token');

let refreshPromise: Promise<string | null> | null = null;

// Coalesce concurrent refreshes so we only hit /auth/refresh once.
async function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && data.success && data.token) {
                    localStorage.setItem('veg_token', data.token);
                    if (data.user) localStorage.setItem('veg_user', JSON.stringify(data.user));
                    return data.token as string;
                }
                return null;
            })
            .catch(() => null)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${API_URL}${path}`;

    const buildHeaders = (token: string | null): HeadersInit => ({
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    let res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: buildHeaders(getToken()),
    });

    // Access token likely expired — refresh once and retry.
    if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            res = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: buildHeaders(newToken),
            });
        }
    }

    return res;
}

export { API_URL, refreshAccessToken };
