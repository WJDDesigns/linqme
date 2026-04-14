"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema } from "@/lib/forms";
import FormEditor from "./FormEditor";
import TemplatePicker from "./TemplatePicker";

export default function FormEditorShell({
  initialSchema,
  hasForm,
}: {
  initialSchema: FormSchema | null;
  hasForm: boolean;
}) {
  const router = useRouter();
  const [showTemplates, setShowTemplates] = useState(!hasForm);

  function handleTemplateDone() {
    setShowTemplates(false);
    // Refresh the page to load the new schema from DB
    router.refresh();
  }

  if (showTemplates) {
    return (
      <TemplatePicker
        mode={hasForm ? "modal" : "chooser"}
        onDone={handleTemplateDone}
      />
    );
  }

  if (!initialSchema) {
    // Shouldn't happen if hasForm is true, but safety fallback
    return (
      <TemplatePicker mode="chooser" onDone={handleTemplateDone} />
    );
  }

  return (
    <FormEditor
      initialSchema={initialSchema}
      onOpenTemplates={() => setShowTemplates(true)}
    />
  );
}
