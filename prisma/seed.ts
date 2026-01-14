import { PrismaClient, PriceMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shubhspace.com' },
    update: {},
    create: {
      email: 'admin@shubhspace.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create venue owner
  const venueOwnerPassword = await bcrypt.hash('owner123', 12);
  const venueOwner = await prisma.user.upsert({
    where: { email: 'venue@shubhspace.com' },
    update: {},
    create: {
      email: 'venue@shubhspace.com',
      name: 'Venue Owner',
      password: venueOwnerPassword,
      role: 'VENUE_OWNER',
      phone: '+91 98765 43210',
      emailVerified: new Date(),
      kycVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Venue owner created:', venueOwner.email);

  // Create catering owner
  const cateringOwnerPassword = await bcrypt.hash('caterer123', 12);
  const cateringOwner = await prisma.user.upsert({
    where: { email: 'caterer@shubhspace.com' },
    update: {},
    create: {
      email: 'caterer@shubhspace.com',
      name: 'Catering Owner',
      password: cateringOwnerPassword,
      role: 'CATERING_OWNER',
      phone: '+91 98765 43211',
      emailVerified: new Date(),
      kycVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Catering owner created:', cateringOwner.email);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
      phone: '+91 98765 43212',
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log('✅ Regular user created:', regularUser.email);

  // Create sample venues
  const venues = [
    {
      name: 'The Grand Palace',
      slug: 'the-grand-palace-mumbai',
      description: 'Luxurious banquet hall with royal architecture and world-class amenities. Perfect for grand weddings and celebrations.',
      city: 'Mumbai',
      area: 'Andheri West',
      address: '123, J.P. Road, Andheri West, Mumbai',
      pincode: '400058',
      priceMode: PriceMode.EXACT,
      exactPrice: 250000,
      minGuests: 100,
      maxGuests: 1000,
      images: 'https://images.unsplash.com/photo-1519167758481-83f29da8ae39,https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
      videos: '',
      offlineBookings: '',
      coverImage: 'https://images.unsplash.com/photo-1519167758481-83f29da8ae39',
      amenities: ['Parking', 'AC', 'Wifi', 'Projector', 'Sound System'],
      venueType: 'Banquet Hall',
      isVerified: true,
      verifiedAt: new Date(),
      ownerId: venueOwner.id,
    },
    {
      name: 'Sunset Lawn',
      slug: 'sunset-lawn-delhi',
      description: 'Beautiful open-air lawn with stunning sunset views. Ideal for outdoor ceremonies and cocktail parties.',
      city: 'Delhi',
      area: 'Hauz Khas',
      address: '456, Hauz Khas Village, New Delhi',
      pincode: '110016',
      priceMode: PriceMode.ESTIMATED,
      estimatedMinPrice: 150000,
      estimatedMaxPrice: 300000,
      minGuests: 200,
      maxGuests: 800,
      images: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3,https://images.unsplash.com/photo-1478146896981-b80fe463b330',
      videos: '',
      offlineBookings: '',
      coverImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
      amenities: ['Parking', 'Catering', 'Decoration', 'Outdoor'],
      venueType: 'Lawn',
      isVerified: true,
      verifiedAt: new Date(),
      ownerId: venueOwner.id,
    },
  ];

  for (const venue of venues) {
    await prisma.venue.upsert({
      where: { slug: venue.slug },
      update: {},
      create: venue,
    });
  }
  console.log(`✅ Created ${venues.length} venues`);

  // Create sample caterers
  const caterers = [
    {
      name: 'Spice Symphony Caterers',
      slug: 'spice-symphony-mumbai',
      description: 'Premium multi-cuisine catering with authentic flavors. Specializing in Indian, Chinese, and Continental cuisines.',
      city: 'Mumbai',
      address: '789, Linking Road, Bandra West, Mumbai',
      phone: '+91 98765 43213',
      minPlatePrice: 500,
      rating: 4.5,
      totalReviews: 150,
      isPureVeg: false,
      isMultiCuisine: true,
      cuisines: ['North Indian', 'South Indian', 'Chinese', 'Continental'],
      images: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1,https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
      coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
      isVerified: true,
      isActive: true,
      ownerId: cateringOwner.id,
    },
    {
      name: 'Pure Veg Delights',
      slug: 'pure-veg-delights-delhi',
      description: 'Authentic vegetarian catering with Jain food options. Traditional recipes passed down through generations.',
      city: 'Delhi',
      address: '321, Chandni Chowk, Old Delhi',
      phone: '+91 98765 43214',
      minPlatePrice: 400,
      rating: 4.7,
      totalReviews: 200,
      isPureVeg: true,
      isMultiCuisine: false,
      cuisines: ['North Indian', 'Gujarati', 'Rajasthani', 'Jain'],
      images: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445,https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      coverImage: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
      isVerified: true,
      isActive: true,
      ownerId: cateringOwner.id,
    },
  ];

  for (const caterer of caterers) {
    const createdCaterer = await prisma.caterer.upsert({
      where: { slug: caterer.slug },
      update: {},
      create: caterer,
    });

    // Add packages for each caterer
    const packages = [
      {
        tier: 'SILVER',
        name: 'Silver Package',
        description: 'Basic package with essential items',
        pricePerPlate: caterer.minPlatePrice,
        itemCount: 25,
        items: {
          Welcome: ['Juice', 'Soft Drinks'],
          Starters: ['Paneer Tikka', 'Spring Rolls', 'Papads'],
          MainCourse: ['Dal', 'Paneer Curry', 'Mix Veg', 'Rice', 'Roti'],
          Dessert: ['Gulab Jamun', 'Ice Cream'],
        },
        catererId: createdCaterer.id,
      },
      {
        tier: 'GOLD',
        name: 'Gold Package',
        description: 'Premium package with variety',
        pricePerPlate: caterer.minPlatePrice + 200,
        itemCount: 35,
        items: {
          Welcome: ['Juice', 'Soft Drinks', 'Mocktails'],
          Starters: ['Paneer Tikka', 'Spring Rolls', 'Corn', 'Papads', 'Soup'],
          MainCourse: ['Dal', 'Paneer Curry', 'Mix Veg', 'Dum Biryani', 'Rice', 'Roti', 'Naan'],
          Dessert: ['Gulab Jamun', 'Rasmalai', 'Ice Cream'],
          LiveCounter: ['Chaat Counter'],
        },
        catererId: createdCaterer.id,
      },
      {
        tier: 'PLATINUM',
        name: 'Platinum Package',
        description: 'Luxury package with premium items',
        pricePerPlate: caterer.minPlatePrice + 400,
        itemCount: 50,
        items: {
          Welcome: ['Juice', 'Soft Drinks', 'Mocktails', 'Welcome Drinks'],
          Starters: ['Paneer Tikka', 'Malai Chaap', 'Spring Rolls', 'Corn', 'Papads', 'Soup', 'Salad'],
          MainCourse: ['Dal Makhani', 'Paneer Butter Masala', 'Mix Veg', 'Veg Kofta', 'Dum Biryani', 'Rice', 'Roti', 'Naan', 'Kulcha'],
          Dessert: ['Gulab Jamun', 'Rasmalai', 'Moong Dal Halwa', 'Ice Cream', 'Fruit Custard'],
          LiveCounter: ['Chaat Counter', 'Pasta Counter', 'Dosa Counter'],
        },
        catererId: createdCaterer.id,
      },
    ];

    for (const pkg of packages) {
      await prisma.menuPackage.upsert({
        where: {
          catererId_tier: {
            catererId: createdCaterer.id,
            tier: pkg.tier,
          },
        },
        update: {},
        create: pkg,
      });
    }
  }
  console.log(`✅ Created ${caterers.length} caterers with packages`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Test Accounts:');
  console.log('Admin: admin@shubhspace.com / admin123');
  console.log('Venue Owner: venue@shubhspace.com / owner123');
  console.log('Catering Owner: caterer@shubhspace.com / caterer123');
  console.log('User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
