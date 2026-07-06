import { useCallback, useEffect, useRef, useState } from "react";

export interface UsePollingOptions {
  interval?: number;
  /** Active/désactive le polling au départ (défaut: true) */
  enabled?: boolean;
  /** Lance un appel immédiat au montage (défaut: true) */
  immediate?: boolean;
  /** Met en pause quand l'onglet n'est pas visible (défaut: true) */
  pauseOnHidden?: boolean;
}

export interface UsePollingResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  isPolling: boolean;
  start: () => void;
  stop: () => void;
  refetch: () => void;
}

/**
 * Hook de polling générique pour React, typé.
 *
 * @param fetchFn Fonction (async) qui récupère les données, ex: () => fetch(url).then(r => r.json())
 * @param options Options de configuration du polling
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {},
): UsePollingResult<T> {
  const {
    interval = 5000,
    enabled = true,
    immediate = true,
    pauseOnHidden = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(enabled);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchFnRef = useRef(fetchFn);
  const isPollingRef = useRef(isPolling);

  // Garde toujours la dernière version de fetchFn sans redéclencher l'effet
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    isPollingRef.current = isPolling;
  }, [isPolling]);

  const clearPollingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleNext = useCallback(() => {
    clearPollingTimeout();
    if (isPollingRef.current) {
      timeoutRef.current = setTimeout(executeFetch, interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval]);

  const executeFetch = useCallback(async () => {
    // Si l'onglet est caché et qu'on doit pauser, on reprogramme sans appeler
    if (pauseOnHidden && typeof document !== "undefined" && document.hidden) {
      scheduleNext();
      return;
    }

    setLoading(true);
    try {
      const result = await fetchFnRef.current();
      setData(result);
      console.log("Polling result:", result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error("Polling error:", err);
    } finally {
      setLoading(false);
      scheduleNext();
      console.log("Next polling scheduled in", interval, "ms");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseOnHidden, scheduleNext]);

  const start = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stop = useCallback(() => {
    setIsPolling(false);
    clearPollingTimeout();
  }, []);

  const refetch = useCallback(() => {
    clearPollingTimeout();
    executeFetch();
  }, [executeFetch]);

  useEffect(() => {
    if (isPolling) {
      if (immediate) {
        executeFetch();
      } else {
        scheduleNext();
      }
    } else {
      clearPollingTimeout();
    }

    return () => clearPollingTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPolling, interval]);

  return { data, error, loading, isPolling, start, stop, refetch };
}
