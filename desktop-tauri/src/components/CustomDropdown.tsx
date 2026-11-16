import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  subtext?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'neutral';
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  width?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  className = '',
  width = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      className={`custom-dropdown-container ${className}`}
      ref={containerRef}
      style={{ width }}
    >
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="trigger-content">
          {selectedOption?.icon && (
            <span className="trigger-icon">{selectedOption.icon}</span>
          )}
          <span className="trigger-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className={`dropdown-badge ${selectedOption.badgeType || 'neutral'}`}>
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown size={13} className={`trigger-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu animate-dropdown-entrance">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`dropdown-menu-item ${isSelected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
              >
                <div className="item-main">
                  {option.icon && <span className="item-icon">{option.icon}</span>}
                  <div className="item-text-stack">
                    <div className="item-label-row">
                      <span className="item-label">{option.label}</span>
                      {option.badge && (
                        <span className={`dropdown-badge ${option.badgeType || 'neutral'}`}>
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.subtext && (
                      <span className="item-subtext">{option.subtext}</span>
                    )}
                  </div>
                </div>

                {isSelected && <Check size={13} className="item-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};