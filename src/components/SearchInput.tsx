import { useRef } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  label = "Search profiles",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="search-field">
      <Search className="search-icon" size={17} aria-hidden="true" />
      <input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={`${label}…`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            onChange("");
          }
        }}
      />
      {value && (
        <button
          className="search-clear"
          type="button"
          aria-label="Clear search"
          title="Clear search"
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
