"use client";

import { captureReturnToFromLocation } from "@/lib/auth/return-to";
import { useEffect } from "react";

/** Persist `?returnTo=` from the URL on first paint (login / join entry). */
export function ReturnToCapture() {
  useEffect(() => {
    captureReturnToFromLocation();
  }, []);
  return null;
}
