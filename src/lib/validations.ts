import { z } from "zod";

// ==================== VENUE SCHEMAS ====================

export const createVenueSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  city: z.string().min(2).max(50),
  area: z.string().min(2).max(50).optional(),
  address: z.string().min(10).max(500),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Pricing
  priceMode: z.enum(["EXACT", "ESTIMATED", "STARTING_FROM"]),
  exactPrice: z.number().positive().optional(),
  estimatedMinPrice: z.number().positive().optional(),
  estimatedMaxPrice: z.number().positive().optional(),
  primeDayPrice: z.number().positive().optional(),
  nonPrimeDayPrice: z.number().positive().optional(),
  primeDays: z.string().optional(),
  
  // Capacity
  minGuests: z.number().int().positive().max(10000),
  maxGuests: z.number().int().positive().max(10000),
  
  // Media
  images: z.string().min(1, "At least one image required"),
  coverImage: z.string().url().optional(),
  videos: z.string().optional(),
  
  // Features
  amenities: z.string().optional(),
  venueType: z.string().optional(),
  
  // Contact
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number").optional(),
  contactName: z.string().max(100).optional(),
});

export const updateVenueSchema = createVenueSchema.partial();

export const venueQuerySchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  maxCapacity: z.coerce.number().int().positive().optional(),
  amenities: z.string().optional(),
  venueType: z.string().optional(),
  sortBy: z.enum(["area", "popular", "price", "newest"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ==================== CATERER SCHEMAS ====================

export const createCatererSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(20).max(2000),
  city: z.string().min(2).max(50),
  area: z.string().min(2).max(50).optional(),
  address: z.string().min(10).max(500),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  
  // Pricing
  minPlatePrice: z.number().positive(),
  silverPrice: z.number().positive().optional(),
  goldPrice: z.number().positive().optional(),
  platinumPrice: z.number().positive().optional(),
  
  // Features
  isPureVeg: z.boolean().optional().default(false),
  isMultiCuisine: z.boolean().optional().default(true),
  cuisines: z.string().optional(),
  minGuests: z.number().int().positive().optional(),
  
  // Media
  images: z.string().min(1),
  coverImage: z.string().url().optional(),
  
  // Contact
  contactNumber: z.string().regex(/^[6-9]\d{9}$/).optional(),
  contactName: z.string().max(100).optional(),
});

export const updateCatererSchema = createCatererSchema.partial();

export const catererQuerySchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isPureVeg: z.coerce.boolean().optional(),
  cuisines: z.string().optional(),
  sortBy: z.enum(["area", "popular", "price", "newest"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ==================== BOOKING SCHEMAS ====================

export const createBookingSchema = z.object({
  type: z.enum(["VENUE", "CATERING"]),
  venueId: z.string().cuid().optional(),
  catererId: z.string().cuid().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  guestCount: z.number().int().positive().max(10000),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  specialRequests: z.string().max(1000).optional(),
  selectedPackage: z.string().optional(),
  totalAmount: z.number().positive().optional(),
}).refine(
  (data) => (data.type === "VENUE" && data.venueId) || (data.type === "CATERING" && data.catererId),
  { message: "venueId required for VENUE type, catererId required for CATERING type" }
);

export const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  guestCount: z.number().int().positive().max(10000).optional(),
  specialRequests: z.string().max(1000).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ==================== AUTH SCHEMAS ====================

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number").optional(),
  role: z.enum(["USER", "VENUE_OWNER", "CATERING_OWNER"]).optional().default("USER"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ==================== AREA SCHEMAS ====================

export const createAreaSchema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
  priority: z.number().int().min(0).max(1000).optional().default(0),
  isPopular: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateAreaSchema = createAreaSchema.partial();

// ==================== REVIEW SCHEMAS ====================

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  venueId: z.string().cuid().optional(),
  catererId: z.string().cuid().optional(),
  bookingId: z.string().cuid(),
}).refine(
  (data) => data.venueId || data.catererId,
  { message: "Either venueId or catererId is required" }
);

// ==================== CONTACT/INQUIRY SCHEMAS ====================

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  message: z.string().min(10).max(2000),
  subject: z.string().max(200).optional(),
});

// ==================== UTILITY TYPES ====================

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type VenueQueryInput = z.infer<typeof venueQuerySchema>;

export type CreateCatererInput = z.infer<typeof createCatererSchema>;
export type UpdateCatererInput = z.infer<typeof updateCatererSchema>;
export type CatererQueryInput = z.infer<typeof catererQuerySchema>;

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

// ==================== VALIDATION HELPER ====================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function formatZodErrors(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
}
