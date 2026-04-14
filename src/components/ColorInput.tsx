"use client";

import { useState } from "react";

interface Props {
  name: string;
  defaultValue?: string;
}

export default function ColorInput({ name, defaultValue = "#c0c1ff" }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-surface-container-lowest"
        aria-label={`${name} color picker`}
      />
      <input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        pattern="#[0-9a-fA-F]{6}"
        className="block px-3 py-2 font-mono text-xs bg-surface-container-lowest border-0 rounded-lg text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
        style={{ maxWidth: "120px" }}
      />
    </div>
  );
}
