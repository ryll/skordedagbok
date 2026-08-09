"use client";

import { useEffect, useRef, useState } from "react";

const ISO_DATE_PATTERN = "[0-9]{4}-[0-9]{2}-[0-9]{2}";

export function isIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

type IsoDateFieldProps = {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export default function IsoDateField({ id, name, label, defaultValue = "", value: controlledValue, onValueChange }: IsoDateFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const textInput = useRef<HTMLInputElement>(null);
  const nativePicker = useRef<HTMLInputElement>(null);
  const pickerLabel = `Öppna kalender för ${label.toLocaleLowerCase("sv-SE")}`;

  useEffect(() => {
    const valid = value === "" || isIsoDate(value);
    textInput.current?.setCustomValidity(valid ? "" : "Ange ett giltigt datum i formatet YYYY-MM-DD.");
  }, [value]);

  function updateValue(nextValue: string) {
    if (controlledValue === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  function openPicker() {
    const picker = nativePicker.current;
    if (!picker) return;

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
    } else {
      picker.focus();
      picker.click();
    }
  }

  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="iso-date-control">
      <input
        ref={textInput}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        data-form-type="other"
        pattern={ISO_DATE_PATTERN}
        placeholder="YYYY-MM-DD"
        title="Datum i formatet YYYY-MM-DD"
        value={value}
        onChange={(event) => updateValue(event.target.value)}
      />
      <button className="iso-date-picker-button" type="button" aria-label={pickerLabel} title={pickerLabel} onClick={openPicker}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4M16 2v4M3 10h18" />
          <rect x="3" y="4" width="18" height="17" rx="2" />
        </svg>
      </button>
      <input
        ref={nativePicker}
        className="native-date-picker"
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        data-form-type="other"
        value={isIsoDate(value) ? value : ""}
        onChange={(event) => updateValue(event.target.value)}
      />
    </div>
  </div>;
}
