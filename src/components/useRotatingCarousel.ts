"use client";

import { useCallback, useEffect, useState } from "react";

export function useRotatingCarousel(count: number, rotateMs: number) {
  const [index, setIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    setIndex((i) => (count > 0 ? i % count : 0));
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), rotateMs);
    return () => window.clearInterval(id);
  }, [count, rotateMs, epoch]);

  const bumpAuto = useCallback(() => setEpoch((e) => e + 1), []);

  const select = useCallback(
    (i: number) => {
      if (count <= 0) return;
      setIndex(((i % count) + count) % count);
      bumpAuto();
    },
    [bumpAuto, count],
  );

  const next = useCallback(() => select(index + 1), [index, select]);
  const prev = useCallback(() => select(index - 1), [index, select]);

  return {
    index,
    select,
    next,
    prev,
    canNavigate: count > 1,
  };
}