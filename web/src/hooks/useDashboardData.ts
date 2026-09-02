import { useEffect, useState } from 'react';
import { fetchDashboardData, type DashboardApiData } from '../lib/dashboardApi';

interface DashboardDataState {
  data: DashboardApiData | null;
  loading: boolean;
  error: string | null;
}

/** Loads real data from the shared Apps Script backend once on mount. Consumers should
 *  fall back to mock series while loading or on error (e.g. token missing, network down). */
export function useDashboardData(): DashboardDataState {
  const [state, setState] = useState<DashboardDataState>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
