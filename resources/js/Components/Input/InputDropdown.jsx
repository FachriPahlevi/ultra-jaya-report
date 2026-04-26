import { useEffect, useRef, useState } from "react";
import { HiMiniChevronDown } from "react-icons/hi2";

export default function InputDropdown({
    id,
    label,
    itemList = [],
    required = false,
    defaultValue = "",
    placeholder = "Select an option",
    setObjectGroup,
    setObject,
    object,
    disabled = false,
    componentId,
    defaultOpen = false,
    iconSrc,
    error,
}) {
    const [value, setValue] = useState(object ? object.value : defaultValue);
    const [text, setText] = useState("");
    const [showDropdown, setShowDropdown] = useState(defaultOpen);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const option = itemList.find((item) => item.value === value);
        setText(option?.label || "");
    }, [value, itemList]);

    useEffect(() => {
        if (object) {
            setValue(object.value);
            setText(object.label);
        }
    }, [object]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const handleSelectClick = () => {
        if (!disabled) {
            setShowDropdown(!showDropdown);
        }
    };

    const handleOptionClick = (item) => {
        setValue(item.value);
        setText(item.label);
        setShowDropdown(false);
        
        if (setObjectGroup) {
            setObjectGroup((prev) => ({
                ...prev,
                [id]: item.value,
            }));
        }
        
        if (setObject) {
            setObject({ label: item.label, value: item.value });
        }
    };

    const displayText = object ? object.label : text;
    const displayValue = object ? object.value : value;

    return (
        <div className="w-full relative">
            <label className="text-[13px] font-semibold text-foreground mb-1.5 block">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            
            <input 
                id={componentId || id} 
                className="sr-only" 
                value={displayText} 
                required={required} 
                onChange={() => {}} 
            />
            
            <div className="relative">
                {iconSrc && (
                    <img 
                        src={iconSrc} 
                        alt="icon" 
                        className="absolute w-5 h-5 top-1/2 -translate-y-1/2 left-3 z-10" 
                    />
                )}
                
                <input
                    type="text"
                    value={displayText}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly
                    onClick={handleSelectClick}
                    className={`w-full px-3 py-2.5 border rounded-lg text-[13.5px] outline-none transition-all cursor-pointer ${
                        iconSrc ? "pl-9" : ""
                    } ${
                        disabled 
                            ? "text-muted-foreground cursor-default border-border bg-muted" 
                            : "text-foreground border-border bg-background focus:border-primary hover:border-primary/50"
                    } ${error ? "border-destructive focus:border-destructive" : ""}`}
                />
                
                <button
                    type="button"
                    onClick={handleSelectClick}
                    disabled={disabled}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        disabled ? "hidden" : "cursor-pointer"
                    }`}
                >
                    <HiMiniChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                            showDropdown ? "rotate-180" : ""
                        } ${
                            displayText ? "text-foreground" : "text-muted-foreground"
                        }`}
                    />
                </button>
            </div>
            
            {showDropdown && (
                <div 
                    ref={dropdownRef} 
                    className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden"
                >
                    <div className="max-h-[200px] overflow-y-auto">
                        {itemList.length === 0 ? (
                            <div className="px-3 py-2 text-[13px] text-muted-foreground text-center">
                                No options available
                            </div>
                        ) : (
                            itemList.map((item, index) => {
                                const isSelected = displayValue === item.value;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleOptionClick(item)}
                                        className={`w-full text-left px-3 py-2 text-[13.5px] transition-all duration-75 ${
                                            isSelected
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-foreground hover:bg-primary hover:text-white"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
            
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}