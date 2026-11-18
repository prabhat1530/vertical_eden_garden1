import { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export interface RatingSummary {
    averageRating: number;
    count: number;
}

export type RatingSummaryMap = Record<string, RatingSummary>;

// Fetched once per page load and shared by every component that asks
// (Home and Services both show cards), so it is one request, not one per card.
let summaryPromise: Promise<RatingSummaryMap> | null = null;

const loadSummary = (): Promise<RatingSummaryMap> => {
    if (!summaryPromise) {
        summaryPromise = fetch(`${API_URL}/reviews/summary`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => (data && data.success ? data.services : {}))
            .catch(() => {
                summaryPromise = null; // allow a retry on the next mount
                return {};
            });
    }
    return summaryPromise;
};

// Ratings are a nice-to-have: on any error the cards simply show no badge.
export const useRatingSummary = (): RatingSummaryMap => {
    const [summary, setSummary] = useState<RatingSummaryMap>({});

    useEffect(() => {
        let active = true;
        loadSummary().then((data) => { if (active) setSummary(data); });
        return () => { active = false; };
    }, []);

    return summary;
};
