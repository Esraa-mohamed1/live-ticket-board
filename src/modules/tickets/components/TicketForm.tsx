"use client";

import { useState } from "react";
import { createTicketSchema } from "@/modules/tickets/schemas";
import { mapZodError } from "@/lib/errors/map-zod-error";
import { useCreateTicket } from "@/modules/tickets/hooks/useCreateTicket";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { TICKET_PRIORITIES } from "@/modules/tickets/constants";
import type { TicketFormProps } from "@/modules/tickets/interfaces";

export function TicketForm({ customerId, onTicketCreated }: TicketFormProps) {
  const { submit, pending } = useCreateTicket();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    if (customerId) {
      fd.set("customerId", customerId);
    }

    const parsed = createTicketSchema.safeParse({
      title: fd.get("title"),
      description: fd.get("description"),
      priority: fd.get("priority"),
      idempotencyKey: "00000000-0000-0000-0000-000000000000",
    });

    if (!parsed.success) {
      setErrors(mapZodError(parsed.error));
      return;
    }

    const result = await submit(fd);
    if (!result.ok) {
      setServerError(result.error.message);
      if (result.error.fields) setErrors(result.error.fields);
      return;
    }

    (e.target as HTMLFormElement).reset();
    setSuccess(true);
    if (onTicketCreated) onTicketCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="ticket-form" noValidate>
      <Input
        id="ticket-title"
        name="title"
        type="text"
        label="Title"
        placeholder="Brief summary (3–120 chars)"
        errors={errors["title"]}
      />
      <div className="form-field">
        <label htmlFor="ticket-description" className="form-label">
          Description
        </label>
        <textarea
          id="ticket-description"
          name="description"
          className={`form-textarea${errors["description"] ? " form-input-error" : ""}`}
          placeholder="Detailed description (10–2000 chars)"
          rows={4}
        />
        {errors["description"]?.map((e) => (
          <p key={e} className="field-error">
            {e}
          </p>
        ))}
      </div>
      <Select
        id="ticket-priority"
        name="priority"
        label="Priority"
        defaultValue="medium"
        options={TICKET_PRIORITIES.map((p) => ({
          value: p,
          label: p.charAt(0).toUpperCase() + p.slice(1),
        }))}
        errors={errors["priority"]}
      />
      {serverError && <p className="form-error">{serverError}</p>}
      {success && (
        <p className="form-success">Ticket submitted successfully.</p>
      )}
      <Button type="submit" disabled={pending} id="create-ticket-submit">
        {pending ? "Submitting…" : "Submit ticket"}
      </Button>
    </form>
  );
}
