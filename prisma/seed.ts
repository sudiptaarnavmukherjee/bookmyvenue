import { PrismaClient, PriceMode, PackageTier, MenuVariant } from '@prisma/client';
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
      amenities: 'Parking,AC,Wifi,Projector,Sound System',
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
      amenities: 'Parking,Catering,Decoration,Outdoor',
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
      cuisines: 'North Indian,South Indian,Chinese,Continental',
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
      cuisines: 'North Indian,Gujarati,Rajasthani,Jain',
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
        tier: PackageTier.SILVER,
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
        tier: PackageTier.GOLD,
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
        tier: PackageTier.PLATINUM,
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
      await prisma.menuPackage.create({
        data: pkg,
      });
    }
  }
  console.log(`✅ Created ${caterers.length} caterers with packages`);

  // =====================================================
  // PHASE 10: BENGALI MENU BUILDER SEED DATA
  // =====================================================
  console.log('🍽️ Seeding Bengali menu categories and items...');

  // Clear existing menu data before re-seeding
  await prisma.menuItemTemplate.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.menuPackage.deleteMany({ where: { isTemplate: true } });

  // Create menu categories
  const categoryData = [
    { name: 'Starters / Mukhorochak', sortOrder: 1, icon: '🥗' },
    { name: 'Rice & Pulao', sortOrder: 2, icon: '🍚' },
    { name: 'Breads', sortOrder: 3, icon: '🫓' },
    { name: 'Dal', sortOrder: 4, icon: '🫘' },
    { name: 'Vegetarian Curries', sortOrder: 5, icon: '🥬' },
    { name: 'Fish Dishes', sortOrder: 6, icon: '🐟' },
    { name: 'Meat & Mangsho', sortOrder: 7, icon: '🍖' },
    { name: 'Chutneys & Condiments', sortOrder: 8, icon: '🫙' },
    { name: 'Sweets / Mishti', sortOrder: 9, icon: '🍮' },
    { name: 'Beverages', sortOrder: 10, icon: '🥤' },
    { name: 'Live Counters / Special', sortOrder: 11, icon: '🎪' },
  ];

  const createdCats: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await prisma.menuCategory.create({ data: cat });
    createdCats[cat.name] = c.id;
  }
  console.log(`✅ Created ${categoryData.length} menu categories`);

  // Create Bengali dish templates
  const menuItems = [
    // Starters / Mukhorochak
    { name: 'Alur Chop', isVeg: true, isPopular: true, sortOrder: 1, category: 'Starters / Mukhorochak' },
    { name: 'Beguni', isVeg: true, isPopular: true, sortOrder: 2, category: 'Starters / Mukhorochak' },
    { name: 'Phuluri', isVeg: true, isPopular: true, sortOrder: 3, category: 'Starters / Mukhorochak' },
    { name: 'Dalpuri', isVeg: true, isPopular: false, sortOrder: 4, category: 'Starters / Mukhorochak' },
    { name: 'Nimki', isVeg: true, isPopular: false, sortOrder: 5, category: 'Starters / Mukhorochak' },
    { name: 'Ghugni', isVeg: true, isPopular: true, sortOrder: 6, category: 'Starters / Mukhorochak' },
    { name: 'Veg Spring Roll', isVeg: true, isPopular: false, sortOrder: 7, category: 'Starters / Mukhorochak' },
    { name: 'Paneer Tikka', isVeg: true, isPopular: true, sortOrder: 8, category: 'Starters / Mukhorochak' },
    { name: 'Hara Bhara Kebab', isVeg: true, isPopular: false, sortOrder: 9, category: 'Starters / Mukhorochak' },
    { name: 'Macher Cutlet', isVeg: false, isPopular: true, sortOrder: 10, category: 'Starters / Mukhorochak' },
    { name: 'Kobiraji Cutlet', isVeg: false, isPopular: true, sortOrder: 11, category: 'Starters / Mukhorochak' },
    { name: 'Fish Finger', isVeg: false, isPopular: false, sortOrder: 12, category: 'Starters / Mukhorochak' },
    { name: 'Chicken Pakora', isVeg: false, isPopular: true, sortOrder: 13, category: 'Starters / Mukhorochak' },
    { name: 'Prawn Fritter', isVeg: false, isPopular: true, sortOrder: 14, category: 'Starters / Mukhorochak' },
    { name: 'Chingri Fritter', isVeg: false, isPopular: false, sortOrder: 15, category: 'Starters / Mukhorochak' },
    { name: 'Mutton Seekh Kebab', isVeg: false, isPopular: false, sortOrder: 16, category: 'Starters / Mukhorochak' },
    // Rice & Pulao
    { name: 'Gobindobhog Rice', isVeg: true, isPopular: true, sortOrder: 1, category: 'Rice & Pulao' },
    { name: 'Basanti Pulao', isVeg: true, isPopular: true, sortOrder: 2, category: 'Rice & Pulao' },
    { name: 'Ghee Bhat', isVeg: true, isPopular: false, sortOrder: 3, category: 'Rice & Pulao' },
    { name: 'Mishti Pulao', isVeg: true, isPopular: true, sortOrder: 4, category: 'Rice & Pulao' },
    { name: 'Jeera Rice', isVeg: true, isPopular: false, sortOrder: 5, category: 'Rice & Pulao' },
    { name: 'Peas Pulao', isVeg: true, isPopular: false, sortOrder: 6, category: 'Rice & Pulao' },
    { name: 'Veg Dum Biryani', isVeg: true, isPopular: true, sortOrder: 7, category: 'Rice & Pulao' },
    { name: 'Chicken Dum Biryani', isVeg: false, isPopular: true, sortOrder: 8, category: 'Rice & Pulao' },
    { name: 'Mutton Biryani', isVeg: false, isPopular: true, sortOrder: 9, category: 'Rice & Pulao' },
    // Breads
    { name: 'Luchi', isVeg: true, isPopular: true, sortOrder: 1, category: 'Breads' },
    { name: 'Radhaballavi', isVeg: true, isPopular: true, sortOrder: 2, category: 'Breads' },
    { name: 'Paratha', isVeg: true, isPopular: false, sortOrder: 3, category: 'Breads' },
    { name: 'Tandoori Roti', isVeg: true, isPopular: false, sortOrder: 4, category: 'Breads' },
    { name: 'Naan', isVeg: true, isPopular: true, sortOrder: 5, category: 'Breads' },
    { name: 'Rumali Roti', isVeg: true, isPopular: false, sortOrder: 6, category: 'Breads' },
    { name: 'Kulcha', isVeg: true, isPopular: false, sortOrder: 7, category: 'Breads' },
    // Dal
    { name: 'Musur Dal', isVeg: true, isPopular: true, sortOrder: 1, category: 'Dal' },
    { name: 'Chholar Dal', isVeg: true, isPopular: true, sortOrder: 2, category: 'Dal' },
    { name: 'Moong Dal', isVeg: true, isPopular: true, sortOrder: 3, category: 'Dal' },
    { name: 'Dal Makhani', isVeg: true, isPopular: false, sortOrder: 4, category: 'Dal' },
    { name: 'Biulir Dal', isVeg: true, isPopular: false, sortOrder: 5, category: 'Dal' },
    { name: 'Panchmel Dal', isVeg: true, isPopular: false, sortOrder: 6, category: 'Dal' },
    { name: 'Tadka Dal', isVeg: true, isPopular: false, sortOrder: 7, category: 'Dal' },
    // Vegetarian Curries
    { name: 'Shukto', isVeg: true, isPopular: true, sortOrder: 1, category: 'Vegetarian Curries' },
    { name: 'Aloo Posto', isVeg: true, isPopular: true, sortOrder: 2, category: 'Vegetarian Curries' },
    { name: 'Begun Bhaja', isVeg: true, isPopular: true, sortOrder: 3, category: 'Vegetarian Curries' },
    { name: 'Dum Aloo', isVeg: true, isPopular: true, sortOrder: 4, category: 'Vegetarian Curries' },
    { name: 'Dhokar Dalna', isVeg: true, isPopular: true, sortOrder: 5, category: 'Vegetarian Curries' },
    { name: 'Mochar Ghonto', isVeg: true, isPopular: false, sortOrder: 6, category: 'Vegetarian Curries' },
    { name: 'Echorer Dalna', isVeg: true, isPopular: false, sortOrder: 7, category: 'Vegetarian Curries' },
    { name: 'Paneer Butter Masala', isVeg: true, isPopular: true, sortOrder: 8, category: 'Vegetarian Curries' },
    { name: 'Palak Paneer', isVeg: true, isPopular: true, sortOrder: 9, category: 'Vegetarian Curries' },
    { name: 'Paneer Bhaja', isVeg: true, isPopular: false, sortOrder: 10, category: 'Vegetarian Curries' },
    { name: 'Chhana Dalna', isVeg: true, isPopular: false, sortOrder: 11, category: 'Vegetarian Curries' },
    { name: 'Alur Tarkari', isVeg: true, isPopular: false, sortOrder: 12, category: 'Vegetarian Curries' },
    { name: 'Dharosh Bhaja', isVeg: true, isPopular: false, sortOrder: 13, category: 'Vegetarian Curries' },
    // Fish Dishes
    { name: 'Ilish Bhapa', isVeg: false, isPopular: true, sortOrder: 1, category: 'Fish Dishes' },
    { name: 'Ilish Macher Jhol', isVeg: false, isPopular: true, sortOrder: 2, category: 'Fish Dishes' },
    { name: 'Chingri Malaikari', isVeg: false, isPopular: true, sortOrder: 3, category: 'Fish Dishes' },
    { name: 'Rui Kalia', isVeg: false, isPopular: true, sortOrder: 4, category: 'Fish Dishes' },
    { name: 'Bhetki Paturi', isVeg: false, isPopular: true, sortOrder: 5, category: 'Fish Dishes' },
    { name: 'Doi Maach', isVeg: false, isPopular: false, sortOrder: 6, category: 'Fish Dishes' },
    { name: 'Macher Kalia', isVeg: false, isPopular: false, sortOrder: 7, category: 'Fish Dishes' },
    { name: 'Tangra Macher Jhol', isVeg: false, isPopular: false, sortOrder: 8, category: 'Fish Dishes' },
    { name: 'Parshe Macher Jhal', isVeg: false, isPopular: false, sortOrder: 9, category: 'Fish Dishes' },
    { name: 'Katla Macher Kalia', isVeg: false, isPopular: false, sortOrder: 10, category: 'Fish Dishes' },
    { name: 'Bhetki Fry', isVeg: false, isPopular: false, sortOrder: 11, category: 'Fish Dishes' },
    { name: 'Chingri Bhate', isVeg: false, isPopular: false, sortOrder: 12, category: 'Fish Dishes' },
    // Meat & Mangsho
    { name: 'Kosha Mangsho', isVeg: false, isPopular: true, sortOrder: 1, category: 'Meat & Mangsho' },
    { name: 'Mutton Rezala', isVeg: false, isPopular: true, sortOrder: 2, category: 'Meat & Mangsho' },
    { name: 'Chicken Kosha', isVeg: false, isPopular: true, sortOrder: 3, category: 'Meat & Mangsho' },
    { name: 'Chicken Rezala', isVeg: false, isPopular: false, sortOrder: 4, category: 'Meat & Mangsho' },
    { name: 'Chicken Chaap', isVeg: false, isPopular: true, sortOrder: 5, category: 'Meat & Mangsho' },
    { name: 'Mutton Chaap', isVeg: false, isPopular: false, sortOrder: 6, category: 'Meat & Mangsho' },
    { name: 'Egg Curry', isVeg: false, isPopular: false, sortOrder: 7, category: 'Meat & Mangsho' },
    { name: 'Mangsher Jhol', isVeg: false, isPopular: false, sortOrder: 8, category: 'Meat & Mangsho' },
    { name: 'Chicken Tikka Masala', isVeg: false, isPopular: true, sortOrder: 9, category: 'Meat & Mangsho' },
    { name: 'Lamb Rogan Josh', isVeg: false, isPopular: false, sortOrder: 10, category: 'Meat & Mangsho' },
    // Chutneys & Condiments
    { name: 'Tomato Chutney', isVeg: true, isPopular: true, sortOrder: 1, category: 'Chutneys & Condiments' },
    { name: 'Aam Chutney', isVeg: true, isPopular: true, sortOrder: 2, category: 'Chutneys & Condiments' },
    { name: 'Tetul Chutney', isVeg: true, isPopular: false, sortOrder: 3, category: 'Chutneys & Condiments' },
    { name: 'Kasundi', isVeg: true, isPopular: true, sortOrder: 4, category: 'Chutneys & Condiments' },
    { name: 'Papad', isVeg: true, isPopular: true, sortOrder: 5, category: 'Chutneys & Condiments' },
    { name: 'Raita', isVeg: true, isPopular: false, sortOrder: 6, category: 'Chutneys & Condiments' },
    { name: 'Achar', isVeg: true, isPopular: false, sortOrder: 7, category: 'Chutneys & Condiments' },
    { name: 'Boondi Raita', isVeg: true, isPopular: false, sortOrder: 8, category: 'Chutneys & Condiments' },
    // Sweets / Mishti
    { name: 'Sandesh', isVeg: true, isPopular: true, sortOrder: 1, category: 'Sweets / Mishti' },
    { name: 'Mishti Doi', isVeg: true, isPopular: true, sortOrder: 2, category: 'Sweets / Mishti' },
    { name: 'Rosogolla', isVeg: true, isPopular: true, sortOrder: 3, category: 'Sweets / Mishti' },
    { name: 'Rajbhog', isVeg: true, isPopular: true, sortOrder: 4, category: 'Sweets / Mishti' },
    { name: 'Chomchom', isVeg: true, isPopular: true, sortOrder: 5, category: 'Sweets / Mishti' },
    { name: 'Payesh', isVeg: true, isPopular: true, sortOrder: 6, category: 'Sweets / Mishti' },
    { name: 'Sarbhaja', isVeg: true, isPopular: false, sortOrder: 7, category: 'Sweets / Mishti' },
    { name: 'Gulab Jamun', isVeg: true, isPopular: true, sortOrder: 8, category: 'Sweets / Mishti' },
    { name: 'Kheer', isVeg: true, isPopular: false, sortOrder: 9, category: 'Sweets / Mishti' },
    { name: 'Pantua', isVeg: true, isPopular: false, sortOrder: 10, category: 'Sweets / Mishti' },
    { name: 'Chamcham', isVeg: true, isPopular: false, sortOrder: 11, category: 'Sweets / Mishti' },
    { name: 'Rasmalai', isVeg: true, isPopular: true, sortOrder: 12, category: 'Sweets / Mishti' },
    { name: 'Nolen Gurer Payesh', isVeg: true, isPopular: true, sortOrder: 13, category: 'Sweets / Mishti' },
    { name: 'Malpua', isVeg: true, isPopular: false, sortOrder: 14, category: 'Sweets / Mishti' },
    { name: 'Labanga Latika', isVeg: true, isPopular: false, sortOrder: 15, category: 'Sweets / Mishti' },
    // Beverages
    { name: 'Aam Panna', isVeg: true, isPopular: true, sortOrder: 1, category: 'Beverages' },
    { name: 'Lemonade', isVeg: true, isPopular: true, sortOrder: 2, category: 'Beverages' },
    { name: 'Sweet Lassi', isVeg: true, isPopular: true, sortOrder: 3, category: 'Beverages' },
    { name: 'Butter Milk', isVeg: true, isPopular: false, sortOrder: 4, category: 'Beverages' },
    { name: 'Rose Sharbat', isVeg: true, isPopular: false, sortOrder: 5, category: 'Beverages' },
    { name: 'Jal Jeera', isVeg: true, isPopular: false, sortOrder: 6, category: 'Beverages' },
    { name: 'Thandai', isVeg: true, isPopular: false, sortOrder: 7, category: 'Beverages' },
    { name: 'Coconut Water', isVeg: true, isPopular: false, sortOrder: 8, category: 'Beverages' },
    // Live Counters / Special
    { name: 'Phuchka Station', isVeg: true, isPopular: true, sortOrder: 1, category: 'Live Counters / Special' },
    { name: 'Chaat Counter', isVeg: true, isPopular: true, sortOrder: 2, category: 'Live Counters / Special' },
    { name: 'Dosa Counter', isVeg: true, isPopular: true, sortOrder: 3, category: 'Live Counters / Special' },
    { name: 'Pav Bhaji Counter', isVeg: true, isPopular: true, sortOrder: 4, category: 'Live Counters / Special' },
    { name: 'Biryani Live Counter', isVeg: false, isPopular: true, sortOrder: 5, category: 'Live Counters / Special' },
    { name: 'Ice Cream Counter', isVeg: true, isPopular: true, sortOrder: 6, category: 'Live Counters / Special' },
    { name: 'Roll Counter', isVeg: false, isPopular: true, sortOrder: 7, category: 'Live Counters / Special' },
    { name: 'Pan Counter', isVeg: true, isPopular: false, sortOrder: 8, category: 'Live Counters / Special' },
    { name: 'Rabri Malpua Counter', isVeg: true, isPopular: false, sortOrder: 9, category: 'Live Counters / Special' },
  ];

  await prisma.menuItemTemplate.createMany({
    data: menuItems.map(({ category, ...item }) => ({
      ...item,
      categoryId: createdCats[category],
    })),
  });
  console.log(`✅ Created ${menuItems.length} Bengali dish templates`);

  // Create 9 pre-built global menu templates (isTemplate=true, no catererId)
  const globalTemplates = [
    // ── SILVER ──
    {
      tier: PackageTier.SILVER,
      variant: MenuVariant.NON_VEG,
      name: 'Silver Non-Veg',
      description: 'Classic Bengali non-veg package — fish, meat & traditional sides',
      pricePerPlate: 650,
      itemCount: 26,
      isTemplate: true,
      items: {
        Starters: ['Alur Chop', 'Beguni', 'Nimki', 'Ghugni', 'Macher Cutlet', 'Kobiraji Cutlet'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Luchi'],
        Dal: ['Musur Dal', 'Chholar Dal'],
        'Vegetarian Curries': ['Shukto', 'Aloo Posto', 'Begun Bhaja'],
        'Fish Dishes': ['Ilish Macher Jhol', 'Rui Kalia'],
        'Meat & Mangsho': ['Kosha Mangsho'],
        Chutneys: ['Tomato Chutney', 'Kasundi', 'Papad'],
        Sweets: ['Rosogolla', 'Mishti Doi', 'Payesh'],
        Beverages: ['Lemonade', 'Sweet Lassi'],
      },
    },
    {
      tier: PackageTier.SILVER,
      variant: MenuVariant.VEG,
      name: 'Silver Veg',
      description: 'Pure vegetarian Bengali package — warm, wholesome & traditional',
      pricePerPlate: 550,
      itemCount: 30,
      isTemplate: true,
      items: {
        Starters: ['Alur Chop', 'Beguni', 'Nimki', 'Ghugni', 'Phuluri', 'Paneer Tikka'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Basanti Pulao', 'Luchi'],
        Dal: ['Musur Dal', 'Chholar Dal', 'Moong Dal'],
        'Vegetarian Curries': ['Shukto', 'Aloo Posto', 'Begun Bhaja', 'Dum Aloo', 'Dhokar Dalna'],
        Chutneys: ['Tomato Chutney', 'Kasundi', 'Papad', 'Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh'],
        Beverages: ['Lemonade', 'Sweet Lassi'],
      },
    },
    {
      tier: PackageTier.SILVER,
      variant: MenuVariant.JAIN,
      name: 'Silver Jain',
      description: 'Jain-friendly Bengali package — no onion, no garlic, pure & sattvic',
      pricePerPlate: 550,
      itemCount: 23,
      isTemplate: true,
      items: {
        Starters: ['Nimki', 'Paneer Tikka', 'Hara Bhara Kebab'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Jeera Rice', 'Luchi'],
        Dal: ['Moong Dal', 'Panchmel Dal'],
        'Vegetarian Curries': ['Paneer Butter Masala', 'Paneer Bhaja', 'Chhana Dalna'],
        Chutneys: ['Kasundi', 'Papad'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Gulab Jamun'],
        Beverages: ['Lemonade', 'Sweet Lassi'],
      },
    },
    // ── GOLD ──
    {
      tier: PackageTier.GOLD,
      variant: MenuVariant.NON_VEG,
      name: 'Gold Non-Veg',
      description: 'Premium Bengali non-veg package with Ilish, Chingri & Kolkata Biryani',
      pricePerPlate: 950,
      itemCount: 43,
      isTemplate: true,
      items: {
        Starters: ['Alur Chop', 'Beguni', 'Nimki', 'Ghugni', 'Phuluri', 'Macher Cutlet', 'Kobiraji Cutlet', 'Fish Finger', 'Prawn Fritter', 'Chicken Pakora'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Mishti Pulao', 'Mutton Biryani', 'Luchi'],
        Dal: ['Musur Dal', 'Chholar Dal', 'Dal Makhani'],
        'Vegetarian Curries': ['Shukto', 'Aloo Posto', 'Begun Bhaja', 'Dum Aloo', 'Dhokar Dalna'],
        'Fish Dishes': ['Ilish Bhapa', 'Ilish Macher Jhol', 'Chingri Malaikari', 'Rui Kalia'],
        'Meat & Mangsho': ['Kosha Mangsho', 'Mutton Rezala', 'Chicken Chaap'],
        Chutneys: ['Tomato Chutney', 'Aam Chutney', 'Kasundi', 'Papad', 'Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Rajbhog'],
        Beverages: ['Aam Panna', 'Lemonade', 'Sweet Lassi'],
        'Live Counters': ['Phuchka Station'],
      },
    },
    {
      tier: PackageTier.GOLD,
      variant: MenuVariant.VEG,
      name: 'Gold Veg',
      description: 'Premium vegetarian package with live Phuchka station & rich paneer dishes',
      pricePerPlate: 800,
      itemCount: 46,
      isTemplate: true,
      items: {
        Starters: ['Alur Chop', 'Beguni', 'Nimki', 'Ghugni', 'Phuluri', 'Dalpuri', 'Paneer Tikka', 'Hara Bhara Kebab', 'Veg Spring Roll'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Basanti Pulao', 'Mishti Pulao', 'Veg Dum Biryani', 'Luchi'],
        Dal: ['Musur Dal', 'Chholar Dal', 'Moong Dal', 'Dal Makhani'],
        'Vegetarian Curries': ['Shukto', 'Aloo Posto', 'Begun Bhaja', 'Dum Aloo', 'Dhokar Dalna', 'Mochar Ghonto', 'Paneer Butter Masala', 'Palak Paneer'],
        Chutneys: ['Tomato Chutney', 'Aam Chutney', 'Kasundi', 'Papad', 'Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Rajbhog', 'Chomchom'],
        Beverages: ['Aam Panna', 'Lemonade', 'Sweet Lassi'],
        'Live Counters': ['Phuchka Station', 'Chaat Counter'],
      },
    },
    {
      tier: PackageTier.GOLD,
      variant: MenuVariant.JAIN,
      name: 'Gold Jain',
      description: 'Premium Jain package with rich paneer dishes, nolen gur sweets & live counter',
      pricePerPlate: 800,
      itemCount: 36,
      isTemplate: true,
      items: {
        Starters: ['Nimki', 'Paneer Tikka', 'Hara Bhara Kebab', 'Phuluri'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Jeera Rice', 'Mishti Pulao', 'Luchi', 'Naan'],
        Dal: ['Moong Dal', 'Panchmel Dal', 'Dal Makhani'],
        'Vegetarian Curries': ['Paneer Butter Masala', 'Palak Paneer', 'Paneer Bhaja', 'Dum Aloo', 'Chhana Dalna'],
        Chutneys: ['Kasundi', 'Papad', 'Boondi Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Rajbhog', 'Rasmalai'],
        Beverages: ['Aam Panna', 'Lemonade', 'Sweet Lassi'],
        'Live Counters': ['Chaat Counter'],
      },
    },
    // ── PLATINUM ──
    {
      tier: PackageTier.PLATINUM,
      variant: MenuVariant.NON_VEG,
      name: 'Platinum Non-Veg',
      description: 'Luxury Bengali non-veg banquet — Ilish, Chingri, Biryani & multiple live counters',
      pricePerPlate: 1400,
      itemCount: 56,
      isTemplate: true,
      items: {
        Starters: ['Alur Chop', 'Beguni', 'Nimki', 'Ghugni', 'Phuluri', 'Dalpuri', 'Macher Cutlet', 'Kobiraji Cutlet', 'Fish Finger', 'Prawn Fritter', 'Chingri Fritter', 'Chicken Pakora', 'Mutton Seekh Kebab'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Basanti Pulao', 'Mishti Pulao', 'Mutton Biryani', 'Chicken Dum Biryani', 'Luchi'],
        Breads: ['Radhaballavi', 'Naan', 'Tandoori Roti'],
        Dal: ['Musur Dal', 'Chholar Dal', 'Dal Makhani'],
        'Vegetarian Curries': ['Shukto', 'Aloo Posto', 'Begun Bhaja', 'Dum Aloo', 'Dhokar Dalna', 'Mochar Ghonto', 'Paneer Butter Masala'],
        'Fish Dishes': ['Ilish Bhapa', 'Ilish Macher Jhol', 'Chingri Malaikari', 'Bhetki Paturi', 'Rui Kalia', 'Doi Maach'],
        'Meat & Mangsho': ['Kosha Mangsho', 'Mutton Rezala', 'Chicken Kosha', 'Chicken Chaap', 'Chicken Tikka Masala'],
        Chutneys: ['Tomato Chutney', 'Aam Chutney', 'Tetul Chutney', 'Kasundi', 'Papad', 'Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Rajbhog', 'Chomchom', 'Nolen Gurer Payesh', 'Rasmalai'],
        Beverages: ['Aam Panna', 'Lemonade', 'Sweet Lassi', 'Rose Sharbat'],
        'Live Counters': ['Phuchka Station', 'Biryani Live Counter', 'Ice Cream Counter'],
      },
    },
    {
      tier: PackageTier.PLATINUM,
      variant: MenuVariant.VEG,
      name: 'Platinum Veg',
      description: 'Grand vegetarian banquet — full spread with live Dosa, Phuchka & Ice Cream counters',
      pricePerPlate: 1100,
      itemCount: 54,
      isTemplate: true,
      items: {
        Starters: ['Alur Chop', 'Beguni', 'Nimki', 'Ghugni', 'Phuluri', 'Dalpuri', 'Paneer Tikka', 'Hara Bhara Kebab', 'Veg Spring Roll'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Basanti Pulao', 'Mishti Pulao', 'Ghee Bhat', 'Veg Dum Biryani', 'Luchi'],
        Breads: ['Radhaballavi', 'Naan', 'Tandoori Roti', 'Kulcha'],
        Dal: ['Musur Dal', 'Chholar Dal', 'Moong Dal', 'Dal Makhani', 'Biulir Dal'],
        'Vegetarian Curries': ['Shukto', 'Aloo Posto', 'Begun Bhaja', 'Dum Aloo', 'Dhokar Dalna', 'Mochar Ghonto', 'Echorer Dalna', 'Paneer Butter Masala', 'Palak Paneer'],
        Chutneys: ['Tomato Chutney', 'Aam Chutney', 'Tetul Chutney', 'Kasundi', 'Papad', 'Raita', 'Boondi Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Rajbhog', 'Chomchom', 'Sarbhaja', 'Nolen Gurer Payesh', 'Rasmalai'],
        Beverages: ['Aam Panna', 'Lemonade', 'Sweet Lassi', 'Rose Sharbat'],
        'Live Counters': ['Phuchka Station', 'Chaat Counter', 'Dosa Counter', 'Ice Cream Counter'],
      },
    },
    {
      tier: PackageTier.PLATINUM,
      variant: MenuVariant.JAIN,
      name: 'Platinum Jain',
      description: 'Luxury Jain banquet — sattvic ingredients, nolen gur specials & live counters',
      pricePerPlate: 1100,
      itemCount: 42,
      isTemplate: true,
      items: {
        Starters: ['Nimki', 'Paneer Tikka', 'Hara Bhara Kebab', 'Phuluri', 'Veg Spring Roll'],
        'Rice & Pulao': ['Gobindobhog Rice', 'Mishti Pulao', 'Ghee Bhat', 'Luchi', 'Naan', 'Tandoori Roti'],
        Dal: ['Moong Dal', 'Panchmel Dal', 'Dal Makhani', 'Tadka Dal'],
        'Vegetarian Curries': ['Paneer Butter Masala', 'Palak Paneer', 'Paneer Bhaja', 'Dum Aloo', 'Chhana Dalna', 'Echorer Dalna'],
        Chutneys: ['Kasundi', 'Papad', 'Boondi Raita'],
        Sweets: ['Sandesh', 'Rosogolla', 'Mishti Doi', 'Payesh', 'Rajbhog', 'Rasmalai', 'Nolen Gurer Payesh'],
        Beverages: ['Aam Panna', 'Lemonade', 'Sweet Lassi', 'Thandai'],
        'Live Counters': ['Chaat Counter', 'Dosa Counter', 'Ice Cream Counter'],
      },
    },
  ];

  for (const template of globalTemplates) {
    await prisma.menuPackage.create({ data: template });
  }
  console.log(`✅ Created ${globalTemplates.length} global Bengali menu templates`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Test Accounts:');
  console.log('  Admin:   admin@shubhspace.com / admin123');
  console.log('  Owner:   venue@shubhspace.com / owner123');
  console.log('  Caterer: caterer@shubhspace.com / caterer123');
  console.log('  User:    user@example.com / user123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
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
