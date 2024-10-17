

import { useEffect, type Dispatch, type SetStateAction } from "react";

export type UseFetchOptions = {
  immediate: boolean;
};

export type UseFetchReturn<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
  url: string;
  load: () => Promise<void>;
  updateUrl: Dispatch<SetStateAction<string>>;
  updateOptions: Dispatch<SetStateAction<UseFetchOptions>>;
  updateRequestOptions: Dispatch<SetStateAction<RequestInit | undefined>>;
};

export default function useFetch<T>(
  initialUrl: string,
  initialRequestOptions?: RequestInit,
  initialOptions?: UseFetchOptions,
): UseFetchReturn<T> {

  useEffect(() => {
    fetch(initialUrl)
  }, [initialUrl])
  
  return {
    url: "",
    loading: false,
    error: null,
    data: null,
    load: async () => {},
    updateUrl: () => {},
    updateOptions: () => {},
    updateRequestOptions: () => {},
  };
}
