"use client";

import { useCallback, useState } from "react";

export function usePageNumber(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  const nextPage = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPage((current) => Math.max(current - 1, 1));
  }, []);

  return { page, nextPage, previousPage };
}
