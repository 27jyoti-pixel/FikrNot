import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../api/axiosClient";

export default function useLoad(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loader();
      setState({ loading: false, error: "", data });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: errorMessage(error),
      }));
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load,
    setData: (nextData) =>
      setState((current) => ({
        ...current,
        data:
          typeof nextData === "function" ? nextData(current.data) : nextData,
      })),
  };
}
