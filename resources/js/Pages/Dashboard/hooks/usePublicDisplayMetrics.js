import { useEffect, useMemo, useState } from "react";
import { getAgeInDays, REFRESH_INTERVAL, withBarWidths } from "../utils/publicDisplay";

export const usePublicDisplayMetrics = ({ stats, oldestOpenTicket, topAreas, topActivities }) => {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const clockTimer = window.setInterval(() => setNow(new Date()), 1000);
        const refreshTimer = window.setInterval(() => window.location.reload(), REFRESH_INTERVAL);

        return () => {
            window.clearInterval(clockTimer);
            window.clearInterval(refreshTimer);
        };
    }, []);

    const completionPct = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;
    const oldestTicketAge = oldestOpenTicket ? getAgeInDays(oldestOpenTicket.created_at) : 0;
    const topArea = topAreas[0]?.name ?? "N/A";
    const avgTicketsPerArea = stats.activeAreas > 0 ? (stats.total / stats.activeAreas).toFixed(1) : "0.0";

    const areaBars = useMemo(() => withBarWidths(topAreas), [topAreas]);

    const activityBars = useMemo(() => {
        return withBarWidths(topActivities).map((item) => ({
            ...item,
            percentage: Math.round((item.total / Math.max(stats.total, 1)) * 100),
        }));
    }, [topActivities, stats.total]);

    return {
        now,
        completionPct,
        oldestTicketAge,
        topArea,
        avgTicketsPerArea,
        areaBars,
        activityBars,
    };
};
