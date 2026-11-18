import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import './SlotSelect.css';

// ─────────────────────────────────────────────
// SlotSelect — time-slot dropdown backed by live availability.
// Fetches /bookings/slots?date=… whenever the date changes and disables
// windows that are already booked. Change `refreshKey` to force a re-fetch
// (e.g. after the server reports a slot was just taken).
// ─────────────────────────────────────────────

interface SlotInfo {
    time: string;
    available: boolean;
}

interface SlotSelectProps {
    id: string;
    date: string;
    value: string;
    onChange: (time: string) => void;
    refreshKey?: number;
}

const SlotSelect: React.FC<SlotSelectProps> = ({ id, date, value, onChange, refreshKey = 0 }) => {
    const [slots, setSlots] = useState<SlotInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        if (!date) {
            setSlots([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setLoadError('');

        apiFetch(`/bookings/slots?date=${date}`)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                if (data.success) {
                    setSlots(data.slots);
                    // Clear a selection that has just become unavailable.
                    const picked = data.slots.find((s: SlotInfo) => s.time === value);
                    if (picked && !picked.available) onChange('');
                } else {
                    setLoadError(data.error || 'Could not load time slots.');
                }
            })
            .catch(() => { if (!cancelled) setLoadError('Could not load time slots.'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, refreshKey]);

    const allBooked = slots.length > 0 && slots.every((s) => !s.available);

    return (
        <>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={!date || loading}
            >
                <option value="">
                    {!date ? 'Pick a date first' : loading ? 'Checking availability…' : 'Select a time slot'}
                </option>
                {slots.map((s) => (
                    <option key={s.time} value={s.time} disabled={!s.available}>
                        {s.time}{s.available ? '' : ' — Booked'}
                    </option>
                ))}
            </select>
            {loadError && <small className="slot-select-note slot-select-error">{loadError}</small>}
            {allBooked && <small className="slot-select-note">All slots on this date are booked. Please try another date.</small>}
        </>
    );
};

export default SlotSelect;
