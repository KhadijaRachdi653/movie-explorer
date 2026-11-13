"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "./api";

// Charge une ressource de l'API ; url = null pour ne rien charger
export function useApiData<T>(url: string | null) {
  const [state, setState] = useState<{ data: T | null; error: ApiClientError | null; loading: boolean }>({
    data: null,
    error: null,
    loading: url !== null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (url === null) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<T>(url);
        if (!cancelled) setState({ data, error: null, loading: false });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, error: err instanceof ApiClientError ? err : new ApiClientError(0, "Erreur inconnue."), loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
