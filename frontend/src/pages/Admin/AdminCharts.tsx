import React from 'react';
import './AdminCharts.css';

// Chart data from GET /api/admin/stats (computed by MongoDB aggregations).
export interface ChartData {
    monthly: { month: string; bookings: number; revenue: number }[];
    byService: { service: string; count: number }[];
    byStatus: { status: string; count: number }[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (key: string) => {
    const [year, month] = key.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`;
};
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Bar { label: string; value: number; display: string }

// Vertical bars on one shared baseline (one measure per chart, never two axes).
// Each bar is focusable and shows its exact value on hover or keyboard focus.
const ColumnChart: React.FC<{ title: string; bars: Bar[] }> = ({ title, bars }) => {
    const max = Math.max(...bars.map((b) => b.value), 1);
    return (
        <figure className="chart-card">
            <figcaption className="chart-title">{title}</figcaption>
            <div className="column-chart">
                {bars.map((b) => (
                    <div
                        key={b.label}
                        className="column-slot"
                        tabIndex={0}
                        aria-label={`${b.label}: ${b.display}`}
                    >
                        <span className="chart-tooltip" role="tooltip">{b.display}</span>
                        <div className="column-bar" style={{ height: `${(b.value / max) * 100}%` }} />
                    </div>
                ))}
            </div>
            <div className="column-labels" aria-hidden="true">
                {bars.map((b) => <span key={b.label}>{b.label}</span>)}
            </div>
        </figure>
    );
};

// Horizontal bars for categories; the label and value are printed as text,
// so the chart reads like a table and never relies on colour.
const BarList: React.FC<{ title: string; bars: Bar[]; empty: string }> = ({ title, bars, empty }) => {
    const max = Math.max(...bars.map((b) => b.value), 1);
    return (
        <figure className="chart-card">
            <figcaption className="chart-title">{title}</figcaption>
            {bars.length === 0 ? (
                <p className="chart-empty">{empty}</p>
            ) : (
                <ul className="bar-list">
                    {bars.map((b) => (
                        <li key={b.label}>
                            <span className="bar-list-label" title={b.label}>{b.label}</span>
                            <span className="bar-list-track">
                                <span className="bar-list-bar" style={{ width: `${(b.value / max) * 100}%` }} />
                            </span>
                            <span className="bar-list-value">{b.display}</span>
                        </li>
                    ))}
                </ul>
            )}
        </figure>
    );
};

const AdminCharts: React.FC<{ charts: ChartData }> = ({ charts }) => (
    <div className="charts-grid">
        <ColumnChart
            title="Revenue per month (paid bookings)"
            bars={charts.monthly.map((m) => ({ label: monthLabel(m.month), value: m.revenue, display: rupees(m.revenue) }))}
        />
        <ColumnChart
            title="Bookings per month"
            bars={charts.monthly.map((m) => ({ label: monthLabel(m.month), value: m.bookings, display: String(m.bookings) }))}
        />
        <BarList
            title="Bookings by service"
            empty="No bookings yet."
            bars={charts.byService.map((s) => ({ label: s.service, value: s.count, display: String(s.count) }))}
        />
        <BarList
            title="Bookings by status"
            empty="No bookings yet."
            bars={charts.byStatus.map((s) => ({ label: capitalize(s.status), value: s.count, display: String(s.count) }))}
        />
    </div>
);

export default AdminCharts;
