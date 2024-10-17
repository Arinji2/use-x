import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [jsonData, setJsonData] = useState<T | null>(null);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      const response = await fetch(initialUrl);
      const json = await response.json();
      setJsonData(json);
    })().then(() => {
      setIsLoading(false);
    });
  }, [initialUrl]);

  return {
    url: "",
    loading: isLoading,
    error: null,
    data: jsonData,
    load: async () => {},
    updateUrl: () => {},
    updateOptions: () => {},
    updateRequestOptions: () => {},
  };
}
