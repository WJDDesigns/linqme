"use client";

import { useEffect, useRef } from "react";

interface Props {
  action: (formData: FormData) => Promise<void>;
  partnerId: string;
  subdomain: string;
  formSlug?: string;
}

/**
 * Auto-submits the start form on mount so the client skips the
 * start page and goes straight to the form fields.
 */
export default function AutoSubmitForm({ action, partnerId, subdomain, formSlug }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={action} className="hidden">
      <input type="hidden" name="partner_id" value={partnerId} />
      <input type="hidden" name="subdomain" value={subdomain} />
      {formSlug && <input type="hidden" name="form_slug" value={formSlug} />}
    </form>
  );
}
