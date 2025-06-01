import { validation, baseSchemas } from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('required', () => {
    it('should validate required fields', () => {
      const schema = validation.required(baseSchemas.safeString);

      expect(() => schema.parse('')).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(schema.parse('valid')).toBe('valid');
    });
  });

  describe('length', () => {
    it('should validate string length', () => {
      const schema = validation.length(baseSchemas.safeString, 2, 5);

      expect(() => schema.parse('a')).toThrow();
      expect(() => schema.parse('abcdef')).toThrow();
      expect(schema.parse('abc')).toBe('abc');
    });
  });

  describe('number', () => {
    it('should validate number range', () => {
      const schema = validation.number(1, 10);

      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(11)).toThrow();
      expect(schema.parse(5)).toBe(5);
    });
  });

  describe('array', () => {
    it('should validate array length', () => {
      const schema = validation.array(baseSchemas.safeString, 1, 3);

      expect(() => schema.parse([])).toThrow();
      expect(() => schema.parse(['a', 'b', 'c', 'd'])).toThrow();
      expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
    });
  });

  describe('nullableString', () => {
    it('should handle empty strings as null', () => {
      const schema = validation.nullableString();

      expect(schema.parse('')).toBeNull();
      expect(schema.parse('value')).toBe('value');
    });
  });

  describe('errorMap', () => {
    it('should format error messages', () => {
      const schema = baseSchemas.email;
      const result = schema.safeParse('invalid-email');

      if (!result.success) {
        const error = validation.errorMap()(result.error);
        expect(error.message).toBeDefined();
        expect(error.errors).toBeInstanceOf(Array);
      }
    });
  });
});
