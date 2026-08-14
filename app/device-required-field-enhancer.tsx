"use client";

import { useEffect } from "react";
import { REQUIRED_HA_DEVICE_FIELDS } from "./device-required-fields.mjs";

function inputForRequiredField(field: { key: string; label: string }) {
  if (field.key === "entityId") return document.querySelector<HTMLInputElement>("#ha-entity-id");

  const label = Array.from(document.querySelectorAll<HTMLLabelElement>(".inspector label"))
    .find((candidate) => candidate.textContent?.trim().startsWith(field.label));
  return label?.querySelector<HTMLInputElement>("input") || null;
}

function syncRequiredFields() {
  for (const field of REQUIRED_HA_DEVICE_FIELDS) {
    const input = inputForRequiredField(field);
    if (!input) continue;

    if (field.key === "title") input.id = "ha-title";
    input.required = true;
    input.dataset.requiredHaField = field.key;

    const missing = !input.value.trim();
    const hasOtherValidationError = input.getAttribute("aria-invalid") === "true" && !missing;
    input.classList.toggle("invalid", missing || hasOtherValidationError);
    input.setAttribute("aria-invalid", String(missing || hasOtherValidationError));
  }
}

export default function DeviceRequiredFieldEnhancer() {
  useEffect(() => {
    syncRequiredFields();

    const observer = new MutationObserver(syncRequiredFields);
    observer.observe(document.body, { childList: true, subtree: true });

    const onInput = () => syncRequiredFields();
    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest("button");
      if (button?.textContent?.trim() !== "Configure this device") return;
      window.setTimeout(() => {
        syncRequiredFields();
        document.querySelector<HTMLInputElement>("#ha-title")?.focus();
      }, 0);
    };

    document.addEventListener("input", onInput, true);
    document.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
