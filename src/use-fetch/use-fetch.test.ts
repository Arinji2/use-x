// remove .skip from a test to run it

import type { Mock } from "vitest";
import type { UseFetchOptions, UseFetchReturn } from "./use-fetch";
import { act, renderHook, waitFor } from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";
import useFetch from "./use-fetch";

const mocks = {
  get fetch(): Mock {
    return globalThis.fetch as Mock;
  },
  set fetch(value) {
    globalThis.fetch = value;
  },
};

mocks.fetch = vi.fn();

describe("useFetch", () => {
  const url = "https://example.com/api/data";
  const data = { message: "Hello world!" };
  type Data = typeof data;

  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
    });
  });

  describe("initial Fetch", () => {
    it("should fetch on mount by default", async () => {
      renderHook(() => useFetch<Data>(url));
      expect(mocks.fetch).toHaveBeenCalled();
    });

    it("should set loading when fetching data", async () => {
      const { result } = renderHook(() => useFetch<Data>(url));

      expect(result.current.loading).toBe(true);
      expect(mocks.fetch).toHaveBeenCalled();
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("should set data after fetch", async () => {
      const { result } = renderHook(() => useFetch<Data>(url));

      expect(result.current.loading).toBe(true);
      expect(mocks.fetch).toHaveBeenCalled();

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(data);
    });

    it("should not fetch on mount if immediate false", async () => {
      const { result } = renderHook(() => useFetch<Data>(url, undefined, {
        immediate: false,
      }));

      expect(result.current.loading).toBe(false);
      expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it("should not re-run if new options passed in directly", () => {
      const initialProps = {
        url,
        requestOptions: {},
        options: { immediate: true },
      };
      const { rerender } = renderHook<
        UseFetchReturn<Data>,
        { url: string; requestOptions: RequestInit; options: UseFetchOptions }
      >(
        ({ url, requestOptions, options }) =>
          useFetch<Data>(url, requestOptions, options),
        {
          initialProps,
        },
      );

      expect(mocks.fetch).toHaveBeenCalled();
      // render again, but with a new object / url
      rerender({ url: "https://example.com/api/data/updated-url", requestOptions: {}, options: { immediate: true } });
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });

    it("should set error if url empty", async () => {
      const { result } = renderHook(() => useFetch<Data>(""));

      await act(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Empty URL");
        expect(result.current.data).toBeNull();
      });
    });
  });

  describe("error Handling", () => {
    it("should handle network errors correctly", async () => {
      mocks.fetch.mockRejectedValue(new Error("Network Error"));

      const { result } = renderHook(() => useFetch<Data>(url));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Network Error");
      expect(result.current.data).toBeNull();
    });

    it("should handle JSON parse errors correctly", async () => {
      mocks.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      const { result } = renderHook(() => useFetch<Data>(url));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Invalid JSON");
      expect(result.current.data).toBeNull();
    });

    it("should handle http errors correctly", async () => {
      mocks.fetch.mockResolvedValue({
        ok: false,
        statusText: "Not Found",
        status: 404,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      const { result } = renderHook(() => useFetch<Data>(url));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Not Found");
      expect(result.current.data).toBeNull();
    });
  });

  describe("update Functions", () => {
    it("should re-fetch if url is updated", async () => {
      const { result } = renderHook(() => useFetch<Data>(url));
      await waitFor(() => !result.current.loading);
      expect(result.current.data).toEqual(data);
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: "New data!" }),
      });
      act(() => result.current.updateUrl("https://example.com/api/other-data"));
      await waitFor(() => !result.current.loading);
      expect(mocks.fetch).toHaveBeenCalled();
      expect(result.current.data).toEqual({ message: "New data!" });
    });

    it("should re-fetch if request options are updated", async () => {
      const { result } = renderHook(() => useFetch<Data>(url));
      await waitFor(() => !result.current.loading);
      expect(result.current.data).toEqual(data);
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: "New data!" }),
      });
      act(() => result.current.updateRequestOptions({
        headers: {
          Authorization: "Bearer test-token",
        },
      }));
      await waitFor(() => !result.current.loading);
      expect(mocks.fetch).toHaveBeenCalled();
      expect(result.current.data).toEqual({ message: "New data!" });
    });

    it("should re-fetch if options are updated", async () => {
      const { result } = renderHook(() =>
        useFetch<Data>(url, {}, { immediate: false }),
      );
      expect(result.current.loading).toEqual(false);
      expect(mocks.fetch).not.toHaveBeenCalled();
      act(() => result.current.updateOptions({ immediate: true }));
      await waitFor(() => !result.current.loading);
      expect(mocks.fetch).toHaveBeenCalled();
      expect(result.current.data).toEqual(data);
    });

    it.skip("should re-fetch if load function is called", async () => {
      const { result } = renderHook(() => useFetch<Data>(url));
      await waitFor(() => !result.current.loading);
      expect(result.current.data).toEqual(data);
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: "New data!" }),
      });
      await act(() => result.current.load());
      await waitFor(() => !result.current.loading);
      expect(mocks.fetch).toHaveBeenCalled();
      expect(result.current.data).toEqual({ message: "New data!" });
    });
  });

  describe("multiple requests", () => {
    it.skip("should clear data and not set error when aborted", async () => {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      mocks.fetch.mockRejectedValue(abortError);

      const { result } = renderHook(() => useFetch<Data>(url));

      expect(mocks.fetch).toHaveBeenCalled();
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(null);
    });

    it.skip("should clear existing data if load function is called", async () => {
      const { result } = renderHook(() => useFetch<Data>(url));
      await waitFor(() => !result.current.loading);
      expect(result.current.data).toEqual(data);
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockReturnValue(new Promise(resolve => setImmediate(() => resolve({ message: "New data 2!" })))),
      });
      await act(async () => {
        result.current.load();
        setImmediate(() => {
          expect(result.current.data).toBeNull();
        });
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mocks.fetch).toHaveBeenCalled();
      expect(result.current.data).toEqual({ message: "New data 2!" });
    });

    it.skip("should clear existing error if load function is called", async () => {
      mocks.fetch.mockRejectedValue(new Error("Network Error"));
      const { result } = renderHook(() => useFetch<Data>(url));
      await waitFor(() => !result.current.loading);
      expect(result.current.data).toEqual(null);
      expect(result.current.error).toEqual("Network Error");
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockReturnValue(new Promise(resolve => setImmediate(() => resolve({ message: "New data!" })))),
      });
      await act(async () => {
        result.current.load();
        setImmediate(() => {
          expect(result.current.error).toBeNull();
        });
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mocks.fetch).toHaveBeenCalled();
      expect(result.current.data).toEqual({ message: "New data!" });
    });

    it.skip("should abort previous fetch if load is called while fetching", async () => {
      const fetchMocks = {
        first: {
          url: "http://abort-test.com/first",
          data,
        },
        second: {
          url: "http://abort-test.com/second",
          data: {
            message: "Updated value! You should see this instead...",
          },
        },
      };

      mocks.fetch.mockImplementation((url: string, options: RequestInit) => {
        return new Promise((resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener("abort", () => {
              const abortError = new Error("Request aborted");
              abortError.name = "AbortError";
              reject(abortError);
            });
          }
          if (url === fetchMocks.first.url) {
            // First will resolve after second...
            setTimeout(() => {
              resolve({ ok: true, json: vi.fn().mockResolvedValue(fetchMocks.first.data) });
            }, 500);
          }
          else {
            resolve({ ok: true, json: vi.fn().mockResolvedValue(fetchMocks.second.data) });
          }
        });
      });

      const { result } = renderHook(() => useFetch<Data>(fetchMocks.first.url));

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.updateUrl(fetchMocks.second.url);
      });

      // wait long enough to make sure first request had enough time to resolve
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mocks.fetch).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual(fetchMocks.second.data);
    });
  });

  describe("cleanup", () => {
    it.skip("should abort a request in progress if unmounted", async () => {
      let aborted = false;
      const json = vi.fn().mockResolvedValue(data);
      mocks.fetch.mockImplementation((_url: string, options: RequestInit) => {
        return new Promise((resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener("abort", () => {
              const abortError = new Error("Request aborted");
              abortError.name = "AbortError";
              reject(abortError);
              aborted = true;
            });
          }
          setTimeout(() => {
            resolve({ ok: true, json });
          }, 100);
        });
      });

      const { result, unmount } = renderHook(() => useFetch<Data>(url));

      expect(result.current.loading).toBe(true);
      unmount();
      expect(aborted).toBe(true);
      expect(json).not.toHaveBeenCalled();
    });
  });
});
