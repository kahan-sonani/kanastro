import { useCallback, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export function SelectControl({
  value,
  onChange,
  options,
  label,
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  // Native dialogs live in the browser top layer. Portal into the dialog so its controls remain interactive.
  const triggerRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) setContainer(node.closest("dialog"));
  }, []);
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        ref={triggerRef}
        className={`select-trigger ${className}`}
        aria-label={label}
      >
        <Select.Value />
        <Select.Icon className="select-chevron">
          <ChevronDown size={15} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container ?? undefined}>
        <Select.Content
          className="select-content"
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          align="start"
        >
          <Select.ScrollUpButton className="select-scroll">
            <ChevronUp size={15} />
          </Select.ScrollUpButton>
          <Select.Viewport className="select-viewport">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                textValue={option.label}
                className="select-option"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="select-check">
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="select-scroll">
            <ChevronDown size={15} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
