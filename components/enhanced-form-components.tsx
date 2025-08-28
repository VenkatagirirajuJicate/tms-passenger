'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LucideIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Search,
  X,
  ChevronDown,
  Calendar,
  Clock
} from 'lucide-react';

// Enhanced Input Component with Real-time Validation
interface EnhancedInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  disabled?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  required?: boolean;
  autoComplete?: string;
  onValidate?: (value: string) => string | undefined;
  className?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  type = 'text',
  disabled = false,
  error,
  success,
  hint,
  icon: Icon,
  iconPosition = 'left',
  required = false,
  autoComplete,
  onValidate,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string>();

  const isPassword = type === 'password';
  const currentError = error || localError;
  const hasError = Boolean(currentError);
  const hasSuccess = Boolean(success) && !hasError;

  useEffect(() => {
    if (onValidate && value && touched) {
      const validationError = onValidate(value);
      setLocalError(validationError);
    }
  }, [value, onValidate, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    
    if (onValidate && touched) {
      const validationError = onValidate(newValue);
      setLocalError(validationError);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    
    if (onValidate && value) {
      const validationError = onValidate(value);
      setLocalError(validationError);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${focused ? 'text-green-500' : 'text-gray-400'} transition-colors`} />
          </div>
        )}
        
        {/* Input Field */}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`
            form-input
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${hasError ? 'form-input-error' : ''}
            ${hasSuccess ? 'border-green-500 focus:border-green-600' : ''}
            ${focused ? 'ring-2' : ''}
            transition-all duration-200
          `.trim()}
        />
        
        {/* Right Icon or Password Toggle */}
        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
          {Icon && iconPosition === 'right' && (
            <Icon className={`h-5 w-5 ${focused ? 'text-green-500' : 'text-gray-400'} transition-colors`} />
          )}
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          
          {/* Status Icon */}
          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {hasSuccess && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
      </div>
      
      {/* Messages */}
      <AnimatePresence>
        {currentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="form-error"
          >
            <AlertCircle className="w-4 h-4" />
            {currentError}
          </motion.div>
        )}
        
        {success && !hasError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-green-600 text-xs flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            {success}
          </motion.div>
        )}
        
        {hint && !hasError && !success && (
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <Info className="w-4 h-4" />
            {hint}
          </p>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Select Component with Search
interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface EnhancedSelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  searchable?: boolean;
  className?: string;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  required = false,
  searchable = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative space-y-2 ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            form-input
            flex items-center justify-between
            ${error ? 'form-input-error' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `.trim()}
        >
          <div className="flex items-center space-x-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="w-4 h-4 text-gray-500" />
            )}
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
            >
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-gray-50 transition-colors
                        ${value === option.value ? 'bg-green-50 text-green-700' : 'text-gray-900'}
                      `}
                    >
                      {option.icon && (
                        <option.icon className="w-4 h-4" />
                      )}
                      <span>{option.label}</span>
                      {value === option.value && (
                        <CheckCircle className="w-4 h-4 ml-auto text-green-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No options found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="form-error"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
};

// Enhanced TextArea Component
interface EnhancedTextAreaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  onValidate?: (value: string) => string | undefined;
  className?: string;
}

export const EnhancedTextArea: React.FC<EnhancedTextAreaProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  disabled = false,
  error,
  success,
  hint,
  required = false,
  rows = 4,
  maxLength,
  onValidate,
  className = ''
}) => {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string>();

  const currentError = error || localError;
  const hasError = Boolean(currentError);
  const hasSuccess = Boolean(success) && !hasError;
  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isOverLimit = maxLength && characterCount > maxLength;

  useEffect(() => {
    if (onValidate && value && touched) {
      const validationError = onValidate(value);
      setLocalError(validationError);
    }
  }, [value, onValidate, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange?.(newValue);
    
    if (onValidate && touched) {
      const validationError = onValidate(newValue);
      setLocalError(validationError);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    
    if (onValidate && value) {
      const validationError = onValidate(value);
      setLocalError(validationError);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {maxLength && (
            <span className={`text-xs ${
              isOverLimit ? 'text-red-500' : 
              isNearLimit ? 'text-amber-500' : 
              'text-gray-500'
            }`}>
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      <textarea
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`
          form-input
          resize-vertical
          ${hasError ? 'form-input-error' : ''}
          ${hasSuccess ? 'border-green-500 focus:border-green-600' : ''}
          ${focused ? 'ring-2' : ''}
          transition-all duration-200
        `.trim()}
      />
      
      {/* Messages */}
      <AnimatePresence>
        {currentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="form-error"
          >
            <AlertCircle className="w-4 h-4" />
            {currentError}
          </motion.div>
        )}
        
        {success && !hasError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-green-600 text-xs flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            {success}
          </motion.div>
        )}
        
        {hint && !hasError && !success && (
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <Info className="w-4 h-4" />
            {hint}
          </p>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Date Input Component
interface EnhancedDateInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

export const EnhancedDateInput: React.FC<EnhancedDateInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  required = false,
  minDate,
  maxDate,
  className = ''
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${focused ? 'text-green-500' : 'text-gray-400'} transition-colors`} />
        
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          required={required}
          min={minDate}
          max={maxDate}
          className={`
            form-input pl-10
            ${error ? 'form-input-error' : ''}
            ${focused ? 'ring-2' : ''}
            transition-all duration-200
          `.trim()}
        />
      </div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="form-error"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
};

// Form Validation Helpers
export const validators = {
  required: (value: string) => {
    return value.trim() ? undefined : 'This field is required';
  },
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? undefined : 'Please enter a valid email address';
  },
  
  minLength: (min: number) => (value: string) => {
    return value.length >= min ? undefined : `Must be at least ${min} characters`;
  },
  
  maxLength: (max: number) => (value: string) => {
    return value.length <= max ? undefined : `Must be no more than ${max} characters`;
  },
  
  phone: (value: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(value) ? undefined : 'Please enter a valid 10-digit mobile number';
  },
  
  password: (value: string) => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(value)) return 'Password must contain at least one number';
    return undefined;
  },
  
  confirmPassword: (originalPassword: string) => (value: string) => {
    return value === originalPassword ? undefined : 'Passwords do not match';
  }
};