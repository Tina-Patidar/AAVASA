import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

/**
 * Small data-loading hook: { data, loading, error, reload }.
 * `fetcher` is re-run whenever a value in `deps` changes. Stale responses are ignored.
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const counter = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(() => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    run()
      .then((data) => id === counter.current && setState({ data, loading: false, error: '' }))
      .catch((err) => id === counter.current && setState({ data: null, loading: false, error: getErrorMessage(err) }));
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
