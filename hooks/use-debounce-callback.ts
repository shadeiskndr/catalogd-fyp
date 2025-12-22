"use client";

import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef } from "react";

type DebounceOptions = {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
};

export type DebouncedCallback<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function useDebounceCallback<Args extends unknown[]>(
  func: (...args: Args) => unknown,
  delay = 500,
  options?: DebounceOptions
): DebouncedCallback<Args> {
  const funcRef = useRef(func);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debounced = useMemo(() => {
    const instance = debounce(
      (...args: Args) => {
        funcRef.current(...args);
      },
      delay,
      options
    );

    const wrapped = ((...args: Args) => {
      instance(...args);
    }) as DebouncedCallback<Args>;

    wrapped.cancel = () => {
      instance.cancel();
    };
    wrapped.flush = () => {
      instance.flush();
    };

    return wrapped;
  }, [delay, options]);

  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
