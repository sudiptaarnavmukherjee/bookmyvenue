import { describe, it, expect } from 'vitest';
import {
  createVenueSchema,
  createCatererSchema,
  createBookingSchema,
  signUpSchema,
  signInSchema,
  createReviewSchema,
  formatZodErrors,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('signUpSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '9876543210',
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const weakPassword = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
      };

      const result = signUpSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone number', () => {
      const invalidPhone = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '12345', // Too short
      };

      const result = signUpSchema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should validate correct signin data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'anypassword',
      };

      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'john@example.com',
        password: '',
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createVenueSchema', () => {
    it('should validate correct venue data', () => {
      const validVenue = {
        name: 'Grand Palace',
        description: 'A beautiful wedding venue with stunning views and excellent service.',
        city: 'Hyderabad',
        area: 'Banjara Hills',
        address: '123 Wedding Lane, Banjara Hills, Hyderabad',
        pincode: '500034',
        priceMode: 'EXACT' as const,
        exactPrice: 500000,
        minGuests: 100,
        maxGuests: 500,
        images: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
        amenities: 'WiFi,Parking,AC',
      };

      const result = createVenueSchema.safeParse(validVenue);
      expect(result.success).toBe(true);
    });

    it('should reject invalid pincode', () => {
      const invalidVenue = {
        name: 'Grand Palace',
        description: 'A beautiful wedding venue with stunning views.',
        city: 'Hyderabad',
        address: '123 Wedding Lane',
        pincode: '12345', // Invalid - should be 6 digits
        priceMode: 'EXACT' as const,
        minGuests: 100,
        maxGuests: 500,
        images: 'https://example.com/image.jpg',
      };

      const result = createVenueSchema.safeParse(invalidVenue);
      expect(result.success).toBe(false);
    });

    it('should reject too short description', () => {
      const invalidVenue = {
        name: 'Grand Palace',
        description: 'Too short',
        city: 'Hyderabad',
        address: '123 Wedding Lane',
        pincode: '500034',
        priceMode: 'EXACT' as const,
        minGuests: 100,
        maxGuests: 500,
        images: 'https://example.com/image.jpg',
      };

      const result = createVenueSchema.safeParse(invalidVenue);
      expect(result.success).toBe(false);
    });
  });

  describe('createCatererSchema', () => {
    it('should validate correct caterer data', () => {
      const validCaterer = {
        name: 'Royal Caterers',
        description: 'Premium catering services for weddings and events.',
        city: 'Hyderabad',
        address: '456 Food Street, Hyderabad',
        phone: '9876543210',
        minPlatePrice: 500,
        isPureVeg: true,
        images: 'https://example.com/food.jpg',
      };

      const result = createCatererSchema.safeParse(validCaterer);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidCaterer = {
        name: 'Royal Caterers',
        description: 'Premium catering services for weddings.',
        city: 'Hyderabad',
        address: '456 Food Street',
        phone: '1234567890', // Invalid - doesn't start with 6-9
        minPlatePrice: 500,
        images: 'https://example.com/food.jpg',
      };

      const result = createCatererSchema.safeParse(invalidCaterer);
      expect(result.success).toBe(false);
    });
  });

  describe('createBookingSchema', () => {
    it('should validate venue booking', () => {
      const validBooking = {
        type: 'VENUE' as const,
        venueId: 'clxxxxx123456789',
        eventDate: '2026-03-15',
        guestCount: 200,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '9876543210',
      };

      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('should validate catering booking', () => {
      const validBooking = {
        type: 'CATERING' as const,
        catererId: 'clxxxxx123456789',
        eventDate: '2026-03-15',
        guestCount: 200,
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
      };

      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('should reject venue booking without venueId', () => {
      const invalidBooking = {
        type: 'VENUE' as const,
        // Missing venueId
        eventDate: '2026-03-15',
        guestCount: 200,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      };

      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidBooking = {
        type: 'VENUE' as const,
        venueId: 'clxxxxx123456789',
        eventDate: '15-03-2026', // Wrong format
        guestCount: 200,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      };

      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });
  });

  describe('createReviewSchema', () => {
    it('should validate correct review data', () => {
      const validReview = {
        rating: 5,
        comment: 'Excellent venue! We had an amazing experience.',
        venueId: 'clxxxxx123456789',
        bookingId: 'clbooking123456',
      };

      const result = createReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('should reject rating out of range', () => {
      const invalidReview = {
        rating: 6, // Max is 5
        comment: 'Great venue!',
        venueId: 'clxxxxx123456789',
        bookingId: 'clbooking123456',
      };

      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });

    it('should reject review without venue or caterer', () => {
      const invalidReview = {
        rating: 5,
        comment: 'Great experience!',
        // Missing both venueId and catererId
        bookingId: 'clbooking123456',
      };

      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });
  });

  describe('formatZodErrors', () => {
    it('should format errors correctly', () => {
      const result = signUpSchema.safeParse({
        name: '',
        email: 'invalid',
        password: 'weak',
      });

      if (!result.success) {
        const formatted = formatZodErrors(result.error);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      }
    });
  });
});
