"use client";

import { useEffect, useRef } from "react";

export function useUnmount(fn: () => void): void {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(
    () => () => {
      fnRef.current();
    },
    []
  );
}
