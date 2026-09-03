import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export interface DashboardSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DashboardSelectProps {
  value: string;
  options: DashboardSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

function DashboardSelect({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  invalid = false,
  className,
  buttonClassName,
  ariaLabel,
}: DashboardSelectProps) {
  const selectId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const enabledOptions = options.filter((option) => !option.disabled);
  const canOpen = !disabled && enabledOptions.length > 0;

  const openMenu = () => {
    if (!canOpen) {
      return;
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const moveActiveOption = (direction: 1 | -1) => {
    if (!options.length) {
      return;
    }

    let nextIndex = activeIndex;

    for (let attempt = 0; attempt < options.length; attempt += 1) {
      nextIndex = (nextIndex + direction + options.length) % options.length;

      if (!options[nextIndex].disabled) {
        setActiveIndex(nextIndex);
        return;
      }
    }
  };

  const selectOption = (option: DashboardSelectOption) => {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-controls={`${selectId}-listbox`}
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!isOpen) {
              openMenu();
              return;
            }
            moveActiveOption(1);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
              openMenu();
              return;
            }
            moveActiveOption(-1);
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isOpen) {
              openMenu();
              return;
            }

            const option = options[activeIndex];
            if (option) {
              selectOption(option);
            }
          }

          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={clsx(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-900 outline-none transition",
          "focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          invalid
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-slate-200 focus:border-sky-400 focus:ring-sky-100",
          isOpen && !invalid && "border-sky-400 bg-white ring-4 ring-sky-100",
          buttonClassName,
        )}
      >
        <span
          className={clsx(
            "min-w-0 truncate",
            !selectedOption && "text-slate-400",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 text-slate-400 transition",
            isOpen && "rotate-180 text-sky-500",
          )}
        />
      </button>

      {isOpen ? (
        <div
          id={`${selectId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_45px_rgba(15,23,42,0.16)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={clsx(
                  "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                  option.disabled
                    ? "cursor-not-allowed text-slate-300"
                    : isSelected
                      ? "bg-slate-950 text-white"
                      : isActive
                        ? "bg-sky-50 text-sky-800"
                        : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default DashboardSelect;
