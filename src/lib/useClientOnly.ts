"use client"

import { useState, useEffect } from "react";

export default function useClientOnly() {
  const [effected, setEffected] = useState(false);

  useEffect(() => {
    setEffected(true);
  }, []);

  return effected;
}
