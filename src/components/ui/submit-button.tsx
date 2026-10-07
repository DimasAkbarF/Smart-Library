"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Tombol submit yang terkunci saat form diproses (anti double-submit, EC-05). */
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          Memproses…
        </>
      ) : (
        children
      )}
    </Button>
  );
}
