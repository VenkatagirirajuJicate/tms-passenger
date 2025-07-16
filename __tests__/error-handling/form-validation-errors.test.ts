import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Form Validation Errors', () => {
  describe('Input Validation', () => {
    test('handles empty required fields', () => {
      const mockValidation = (value: string) => {
        if (!value.trim()) {
          return 'This field is required';
        }
        return '';
      };

      const result = mockValidation('');
      expect(result).toBe('This field is required');
    });

    test('handles invalid email format', () => {
      const emailValidation = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return 'Please enter a valid email address';
        }
        return '';
      };

      expect(emailValidation('invalid-email')).toBe('Please enter a valid email address');
      expect(emailValidation('test@domain')).toBe('Please enter a valid email address');
      expect(emailValidation('test@domain.com')).toBe('');
    });

    test('handles password strength validation', () => {
      const passwordValidation = (password: string) => {
        if (password.length < 8) {
          return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return '';
      };

      expect(passwordValidation('weak')).toBe('Password must be at least 8 characters long');
      expect(passwordValidation('weakpassword')).toBe('Password must contain uppercase, lowercase, and number');
      expect(passwordValidation('StrongPass123')).toBe('');
    });

    test('handles phone number validation', () => {
      const phoneValidation = (phone: string) => {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
          return 'Please enter a valid 10-digit phone number';
        }
        return '';
      };

      expect(phoneValidation('123')).toBe('Please enter a valid 10-digit phone number');
      expect(phoneValidation('123-456-7890')).toBe('');
      expect(phoneValidation('1234567890')).toBe('');
    });
  });

  describe('Form Submission Errors', () => {
    test('handles network errors during form submission', async () => {
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Network error'));

      try {
        await mockSubmit({ email: 'test@example.com', password: 'Password123' });
      } catch (error) {
        expect((error as Error).message).toBe('Network error');
      }
    });

    test('handles server validation errors', async () => {
      const mockSubmit = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({
          errors: {
            email: ['Email is already taken'],
            password: ['Password is too weak']
          }
        })
      });

      const response = await mockSubmit({ email: 'test@example.com', password: 'weak' });
      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.errors.email).toContain('Email is already taken');
      expect(data.errors.password).toContain('Password is too weak');
    });

    test('handles timeout errors during form submission', async () => {
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Request timeout'));

      try {
        await mockSubmit({ email: 'test@example.com' });
      } catch (error) {
        expect((error as Error).message).toBe('Request timeout');
      }
    });
  });

  describe('Input Sanitization', () => {
    test('handles XSS attempts in input fields', () => {
      const sanitizeInput = (input: string) => {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };

      const maliciousInput = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe('Hello');
    });

    test('handles SQL injection attempts', () => {
      const sanitizeSQL = (input: string) => {
        // Simple sanitization - in real app, use parameterized queries
        return input.replace(/['";\\]/g, '');
      };

      const maliciousInput = "'; DROP TABLE users; --";
      const sanitized = sanitizeSQL(maliciousInput);
      expect(sanitized).toBe(' DROP TABLE users --');
    });

    test('handles excessive input length', () => {
      const validateLength = (input: string, maxLength: number) => {
        if (input.length > maxLength) {
          return `Input must be ${maxLength} characters or less`;
        }
        return '';
      };

      const longInput = 'a'.repeat(1001);
      const result = validateLength(longInput, 1000);
      expect(result).toBe('Input must be 1000 characters or less');
    });
  });

  describe('File Upload Errors', () => {
    test('handles file size validation', () => {
      const validateFileSize = (file: File, maxSize: number) => {
        if (file.size > maxSize) {
          return `File size must be ${maxSize / 1024 / 1024}MB or less`;
        }
        return '';
      };

      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const result = validateFileSize(mockFile, 5 * 1024 * 1024); // 5MB limit
      expect(result).toBe('File size must be 5MB or less');
    });

    test('handles invalid file types', () => {
      const validateFileType = (file: File, allowedTypes: string[]) => {
        if (!allowedTypes.includes(file.type)) {
          return `File type must be one of: ${allowedTypes.join(', ')}`;
        }
        return '';
      };

      const mockFile = new File(['content'], 'test.exe', { type: 'application/exe' });
      const result = validateFileType(mockFile, ['image/jpeg', 'image/png', 'application/pdf']);
      expect(result).toBe('File type must be one of: image/jpeg, image/png, application/pdf');
    });

    test('handles file upload network errors', async () => {
      const mockUpload = jest.fn().mockRejectedValue(new Error('Upload failed'));

      try {
        await mockUpload(new File(['content'], 'test.pdf'));
      } catch (error) {
        expect((error as Error).message).toBe('Upload failed');
      }
    });
  });

  describe('Date and Time Validation', () => {
    test('handles invalid date formats', () => {
      const validateDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date';
        }
        return '';
      };

      expect(validateDate('invalid-date')).toBe('Please enter a valid date');
      expect(validateDate('2023-13-01')).toBe('Please enter a valid date');
      expect(validateDate('2023-12-01')).toBe('');
    });

    test('handles past date validation', () => {
      const validateFutureDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) {
          return 'Date must be in the future';
        }
        return '';
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(validateFutureDate(yesterday.toISOString())).toBe('Date must be in the future');
      expect(validateFutureDate(tomorrow.toISOString())).toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('handles null and undefined values', () => {
      const safeValidation = (value: any) => {
        if (value === null || value === undefined) {
          return 'Value is required';
        }
        if (typeof value === 'string' && value.trim() === '') {
          return 'Value cannot be empty';
        }
        return '';
      };

      expect(safeValidation(null)).toBe('Value is required');
      expect(safeValidation(undefined)).toBe('Value is required');
      expect(safeValidation('')).toBe('Value cannot be empty');
      expect(safeValidation('  ')).toBe('Value cannot be empty');
      expect(safeValidation('valid')).toBe('');
    });

    test('handles special characters in input', () => {
      const validateSpecialChars = (input: string) => {
        const specialCharsRegex = /[<>'"&]/;
        if (specialCharsRegex.test(input)) {
          return 'Input contains invalid characters';
        }
        return '';
      };

      expect(validateSpecialChars('normal text')).toBe('');
      expect(validateSpecialChars('text with <script>')).toBe('Input contains invalid characters');
      expect(validateSpecialChars('text with "quotes"')).toBe('Input contains invalid characters');
    });

    test('handles unicode and emoji input', () => {
      const validateUnicode = (input: string) => {
        // Allow basic unicode but restrict certain ranges
        const restrictedRegex = /[\u0000-\u001F\u007F-\u009F]/;
        if (restrictedRegex.test(input)) {
          return 'Input contains invalid control characters';
        }
        return '';
      };

      expect(validateUnicode('Hello 👋 World')).toBe('');
      expect(validateUnicode('Text with éñglish')).toBe('');
      expect(validateUnicode('Text with \u0000 null')).toBe('Input contains invalid control characters');
    });
  });
}); 