import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, ApiError } from '../lib/api/types';
import { ApiError as ApiErrorClass, normalizeError } from '../lib/api/errors';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiActions<T> {
  execute: (...args: any[]) => Promise<any>;
  reset: () => void;
}

export function useApi<T = any>(): UseApiState<T> & UseApiActions<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: any[]) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await (args[0] as () => Promise<any>)();
      if (mountedRef.current) {
        setState({ data: result as T, loading: false, error: null });
      }
      return result;
    } catch (err: any) {
      const error = normalizeError(err);
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: error.message });
      }
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

export function useQuery<T = any>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options?: { enabled?: boolean; onSuccess?: (data: T) => void }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await queryFn();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
        options?.onSuccess?.(result);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: normalizeError(err).message });
      }
    }
  }, deps);

  useEffect(() => {
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

export function useMutation<T = any, Args extends any[] = any[]>(): UseApiState<T> & UseApiActions<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: Args) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await (args[0] as (...a: any[]) => Promise<T>)(...args.slice(1));
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err: any) {
      const error = normalizeError(err);
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: error.message });
      }
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

export function usePolling<T>(
  queryFn: () => Promise<T>,
  intervalMs: number,
  options?: { enabled?: boolean }
) {
  const { data, loading, error, refetch } = useQuery<T>(queryFn, [], {
    enabled: options?.enabled !== false,
  });

  useEffect(() => {
    if (options?.enabled === false) return;
    const id = setInterval(refetch, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, refetch, options?.enabled]);

  return { data, loading, error, refetch };
}

export function useOptimisticUpdate<T>(
  currentData: T | null,
  mutationFn: (data: T) => Promise<any>,
  optimisticData: T
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<any>;
} {
  const [data, setData] = useState<T | null>(optimisticData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    setData(optimisticData);
    setLoading(true);
    setError(null);
    try {
      const result = await (mutationFn as (...a: any[]) => Promise<any>)(...args);
      setLoading(false);
      return result;
      setLoading(false);
      return result;
    } catch (err: any) {
      setData(currentData);
      setError(normalizeError(err).message);
      setLoading(false);
      throw err;
    }
  }, [currentData, mutationFn, optimisticData]);

  return { data, loading, error, execute };
}
