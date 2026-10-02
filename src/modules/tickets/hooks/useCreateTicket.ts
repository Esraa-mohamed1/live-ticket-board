"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { createTicketAction } from "@/modules/tickets/actions";
import type { UseCreateTicketReturn } from "@/modules/tickets/interfaces";

export function useCreateTicket(): UseCreateTicketReturn {
  const [pending, setPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => uuidv4());

  const submit = async (formData: FormData) => {
    formData.set("idempotencyKey", idempotencyKey);
    setPending(true);
    const result = await createTicketAction(formData);
    setPending(false);

    if (result.ok) {
      setIdempotencyKey(uuidv4());
    }

    return result;
  };

  return { submit, pending };
}
