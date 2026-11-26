import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Accessible styled dropdown (ARIA listbox). Renders a hidden input with `name`
 * so it submits in a <form> exactly like a native <select>.
 * options: [{ value, label, description?, disabled? }]
 */
export default function Select({ name, value, onChange, options, ariaLabel, ariaLabelledBy }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const list = useRef(null);
  const id = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function show() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  function step(from, direction) {
    for (let i = 1; i <= options.length; i += 1) {
      const next = (from + direction * i + options.length) % options.length;
      if (!options[next].disabled) return next;
    }
    return from;
  }

  function onKeyDown(event) {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      show();
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => step(i, 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => step(i, -1)); }
    else if (event.key === 'Home') { event.preventDefault(); setActive(step(-1, 1)); }
    else if (event.key === 'End') { event.preventDefault(); setActive(step(options.length, -1)); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
    else if (event.key === 'Escape' || event.key === 'Tab') setOpen(false);
  }

  return (
    <div className={`ui-select${open ? ' is-open' : ''}`} ref={root}>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      <button
        type="button"
        className="ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span className="ui-select-value">{selected?.label}</span>
        <ChevronDown size={16} className="ui-select-chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="ui-select-menu" role="listbox" id={id} ref={list} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-${index}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              className={`ui-select-option${index === active ? ' is-active' : ''}`}
              onPointerEnter={() => !option.disabled && setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              <span className="ui-select-text">
                <span>{option.label}</span>
                {option.description && <small>{option.description}</small>}
              </span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
