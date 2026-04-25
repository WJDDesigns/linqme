"use client";

import { useEffect } from "react";

/**
 * Shows a browser-native "unsaved changes" warning when the user tries
 * to navigate away or close the tab while `isDirty` is true.
 *
 * Usage:
 *   const [name, setName] = useState(initialName);
 *   useUnsavedChanges(name !== initialName);
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore custom messages; returning a truthy value triggers the dialog
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
