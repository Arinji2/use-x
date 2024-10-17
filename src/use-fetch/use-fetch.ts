import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";

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

const ERROR_MESSAGES = {
  empty_url: "Empty URL",
  network_error: "Network Error",
  json_parse: "Invalid JSON",
  httpErrors: {
    404: "Not Found",
  },
} as const;

type HttpErrorCode = keyof typeof ERROR_MESSAGES.httpErrors;

export default function useFetch<T>(
  initialUrl: string,
  initialRequestOptions?: RequestInit,
  initialOptions?: UseFetchOptions,
): UseFetchReturn<T> {
  const [isLoading, setIsLoading] = useState(false);

  const [jsonData, setJsonData] = useState<T | null>(null);
  const [errorString, setErrorString] = useState<string | null>(null);
  const hasBeenCalledRef = useRef(false);

  const PreChecks = useCallback(() => {
    if (hasBeenCalledRef.current)
      return false;
    if (initialOptions && !initialOptions.immediate)
      return false;
    if (initialUrl.length === 0) {
      setErrorString(ERROR_MESSAGES.empty_url);
      return false;
    }

    return true;
  }, [initialOptions, initialUrl]);

  useEffect(() => {
    const isValidated = PreChecks();
    if (!isValidated)
      return;

    setIsLoading(true);
    hasBeenCalledRef.current = true;
    (async () => {
      try {
        const response = await fetch(initialUrl);
        try {
          const json = await response.json();
          setJsonData(json);
        }
        catch {
          setErrorString(ERROR_MESSAGES.json_parse);
        }
        if (response.status && response.status !== 200) {
          if (isHttpErrorCode(response.status)) {
            setErrorString(ERROR_MESSAGES.httpErrors[response.status]);
          }
          else {
            throw new Error(`HTTP ERROR NOT INDEXED. CODE: ${response.status}`);
          }
        }
      }
      catch {
        setErrorString(ERROR_MESSAGES.network_error);
      }
    })().finally(() => {
      setIsLoading(false);
    });
  }, [initialOptions, initialUrl, PreChecks]);

  return {
    url: "",
    loading: isLoading,
    error: errorString,
    data: jsonData,
    load: async () => {},
    updateUrl: () => {},
    updateOptions: () => {},
    updateRequestOptions: () => {},
  };
}

function isHttpErrorCode(code: number): code is HttpErrorCode {
  return code in ERROR_MESSAGES.httpErrors;
}
