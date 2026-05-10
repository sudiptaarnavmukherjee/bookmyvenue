import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// ─── Authentic Bengali Wedding / Reception Menu Data ───────────────────────
const BENGALI_MENU = [
  {
    name: "🥗 Salad & Papad",
    sortOrder: 1,
    items: [
      { name: "Kakrol / Kochur Salad", isVeg: true },
      { name: "Mixed Green Salad", isVeg: true },
      { name: "Tomato & Cucumber Salad", isVeg: true },
      { name: "Beet & Carrot Salad", isVeg: true },
      { name: "Roasted Papad", isVeg: true, isPopular: true },
      { name: "Fry Papad", isVeg: true },
      { name: "Achar (Mango Pickle)", isVeg: true },
    ],
  },
  {
    name: "🍲 Starter / Telebhaja",
    sortOrder: 2,
    items: [
      { name: "Beguni (Fried Brinjal)", isVeg: true, isPopular: true },
      { name: "Alur Chop (Potato Chop)", isVeg: true, isPopular: true },
      { name: "Fuluri (Dal Fritter)", isVeg: true },
      { name: "Peyaji (Onion Fritter)", isVeg: true },
      { name: "Mochar Chop (Banana Blossom)", isVeg: true },
      { name: "Dimer Devil (Stuffed Egg Chop)", isVeg: false, isPopular: true },
      { name: "Mutton Kabab", isVeg: false },
      { name: "Chicken Kabab", isVeg: false, isPopular: true },
      { name: "Fish Fry (Bhetki)", isVeg: false, isPopular: true },
      { name: "Prawn Fritter", isVeg: false },
      { name: "Chingri Chop (Prawn Chop)", isVeg: false },
    ],
  },
  {
    name: "🍛 Dal",
    sortOrder: 3,
    items: [
      { name: "Cholar Dal (Bengal Gram Dal)", isVeg: true, isPopular: true },
      { name: "Musur Dal (Red Lentil)", isVeg: true },
      { name: "Moong Dal (Yellow Lentil)", isVeg: true },
      { name: "Kalai Dal", isVeg: true },
      { name: "Dal Makhani", isVeg: true },
      { name: "Niramish Dal Tadka", isVeg: true },
    ],
  },
  {
    name: "🥬 Vegetables (Torkari)",
    sortOrder: 4,
    items: [
      { name: "Aloo Phoolkopi (Potato & Cauliflower)", isVeg: true, isPopular: true },
      { name: "Posto Aloo (Potato in Poppy Seed)", isVeg: true, isPopular: true },
      { name: "Shukto (Bitter Mixed Veg)", isVeg: true },
      { name: "Chhorchori (Mixed Veg Medley)", isVeg: true },
      { name: "Dum Aloo (Spiced Potatoes)", isVeg: true },
      { name: "Niramish Alu Dom", isVeg: true },
      { name: "Kochu Saag (Taro Leaf Curry)", isVeg: true },
      { name: "Mochar Ghonto (Banana Blossom)", isVeg: true, isPopular: true },
      { name: "Alu Kumro (Potato & Pumpkin)", isVeg: true },
      { name: "Labra (Mixed Veg Curry)", isVeg: true },
      { name: "Paneer Butter Masala", isVeg: true },
      { name: "Paneer Tikka Masala", isVeg: true },
      { name: "Palak Paneer", isVeg: true },
    ],
  },
  {
    name: "🐟 Fish (Maach)",
    sortOrder: 5,
    items: [
      { name: "Rohu Kalia (Rohu Fish Curry)", isVeg: false, isPopular: true },
      { name: "Bhetki Maacher Jhol", isVeg: false, isPopular: true },
      { name: "Hilsa / Ilish Bhapa (Steamed Hilsa)", isVeg: false, isPopular: true },
      { name: "Ilish Macher Jhol", isVeg: false, isPopular: true },
      { name: "Chingri Malai Curry (Prawn Coconut)", isVeg: false, isPopular: true },
      { name: "Prawn Butter Masala", isVeg: false },
      { name: "Golda Chingri (Tiger Prawn Curry)", isVeg: false },
      { name: "Katla Kalia", isVeg: false },
      { name: "Muri Ghonto (Fish Head Rice)", isVeg: false, isPopular: true },
      { name: "Paturi (Fish in Banana Leaf)", isVeg: false },
      { name: "Dhokar Dalna (Fish Cake Curry)", isVeg: false },
    ],
  },
  {
    name: "🍖 Mutton & Chicken",
    sortOrder: 6,
    items: [
      { name: "Kosha Mangsho (Slow-Cooked Mutton)", isVeg: false, isPopular: true },
      { name: "Mutton Curry (Bengali Style)", isVeg: false, isPopular: true },
      { name: "Mutton Biryani", isVeg: false, isPopular: true },
      { name: "Chicken Kosha", isVeg: false },
      { name: "Chicken Curry (Bengali Bhuna)", isVeg: false, isPopular: true },
      { name: "Chicken Biryani", isVeg: false, isPopular: true },
      { name: "Chicken Roganjosh", isVeg: false },
      { name: "Chicken Tikka Masala", isVeg: false },
      { name: "Doi Murgi (Chicken in Yogurt)", isVeg: false },
    ],
  },
  {
    name: "🍚 Rice & Biryani",
    sortOrder: 7,
    items: [
      { name: "Steamed Basmati Rice", isVeg: true, isPopular: true },
      { name: "Gobindobhog Rice", isVeg: true, isPopular: true },
      { name: "Veg Biryani", isVeg: true },
      { name: "Mutton Biryani (Lucknowi Style)", isVeg: false, isPopular: true },
      { name: "Chicken Biryani (Kolkata Style)", isVeg: false, isPopular: true },
      { name: "Prawn Biryani", isVeg: false },
      { name: "Ghee Bhat (Ghee Rice)", isVeg: true },
      { name: "Pulao (Bengali Mishti Pulao)", isVeg: true, isPopular: true },
    ],
  },
  {
    name: "🫓 Roti & Bread",
    sortOrder: 8,
    items: [
      { name: "Luchi (Fried Puri)", isVeg: true, isPopular: true },
      { name: "Kochuri (Stuffed Puri)", isVeg: true, isPopular: true },
      { name: "Radhaballabhi (Dal Kachori)", isVeg: true, isPopular: true },
      { name: "Tandoori Roti", isVeg: true },
      { name: "Butter Naan", isVeg: true },
      { name: "Paratha", isVeg: true },
    ],
  },
  {
    name: "🍜 Live Stall",
    sortOrder: 9,
    items: [
      { name: "Puchka / Golgappa Live Counter", isVeg: true, isPopular: true },
      { name: "Jhalmuri Live Counter", isVeg: true, isPopular: true },
      { name: "Ghugni Chat Live Counter", isVeg: true, isPopular: true },
      { name: "Kathi Roll Stall (Egg / Chicken)", isVeg: false, isPopular: true },
      { name: "Frankie Roll Stall", isVeg: false },
      { name: "Alu Dum Chaat Live Counter", isVeg: true },
      { name: "Chaat Counter (Bhel / Papri)", isVeg: true },
      { name: "Ice Cream / Kulfi Live Counter", isVeg: true, isPopular: true },
      { name: "Pakora / Telebhaja Live Stall", isVeg: true },
      { name: "Biryani Live Counter", isVeg: false, isPopular: true },
      { name: "Kebab Live Grill Station", isVeg: false },
    ],
  },
  {
    name: "🥗 Chutney",
    sortOrder: 10,
    items: [
      { name: "Tomato Chutney (Mishti)", isVeg: true, isPopular: true },
      { name: "Aam Chutney (Tamarind-Mango)", isVeg: true },
      { name: "Khejur Aam Chutney (Date-Mango)", isVeg: true, isPopular: true },
      { name: "Kacha Amer Chutney", isVeg: true },
      { name: "Pineapple Chutney", isVeg: true },
      { name: "Mixed Fruit Chutney", isVeg: true },
    ],
  },
  {
    name: "🍮 Dessert / Mishti",
    sortOrder: 11,
    items: [
      { name: "Rasgulla", isVeg: true, isPopular: true },
      { name: "Sandesh (Bengali Sweet)", isVeg: true, isPopular: true },
      { name: "Mishti Doi (Sweet Yogurt)", isVeg: true, isPopular: true },
      { name: "Rasmalai", isVeg: true, isPopular: true },
      { name: "Pantua / Gulab Jamun", isVeg: true, isPopular: true },
      { name: "Kheer / Payesh (Rice Pudding)", isVeg: true, isPopular: true },
      { name: "Chomchom", isVeg: true },
      { name: "Langcha", isVeg: true },
      { name: "Sitabhog & Mihidana", isVeg: true },
      { name: "Patisapta (Crepe with Coconut)", isVeg: true },
      { name: "Malpua (Fried Sweet Pancake)", isVeg: true },
      { name: "Sondesh Platter", isVeg: true },
      { name: "Rabri (Thickened Milk)", isVeg: true },
      { name: "Halwa (Sooji / Gajar)", isVeg: true },
    ],
  },
  {
    name: "🥤 Drinks",
    sortOrder: 12,
    items: [
      { name: "Aam Panna (Raw Mango)", isVeg: true, isPopular: true },
      { name: "Jaljeera", isVeg: true },
      { name: "Lassi (Sweet / Salted)", isVeg: true, isPopular: true },
      { name: "Sharbat (Rose / Bel)", isVeg: true },
      { name: "Nimbu Pani (Lemonade)", isVeg: true },
      { name: "Coconut Water", isVeg: true },
      { name: "Soft Drinks (Pepsi / 7Up)", isVeg: true },
      { name: "Packaged Drinking Water", isVeg: true },
      { name: "Buttermilk / Chaas", isVeg: true },
    ],
  },
  {
    name: "🫕 Dahi / Raita",
    sortOrder: 13,
    items: [
      { name: "Boondi Raita", isVeg: true, isPopular: true },
      { name: "Cucumber Raita (Kakdi Raita)", isVeg: true },
      { name: "Mixed Veg Raita", isVeg: true },
      { name: "Pineapple Raita", isVeg: true },
      { name: "Plain Dahi (Yogurt)", isVeg: true },
    ],
  },
];

// POST /api/admin/seed-bengali-menu — one-time seed of Bengali menu library
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let categoriesCreated = 0;
    let itemsCreated = 0;

    for (const cat of BENGALI_MENU) {
      // Upsert category (skip if already exists)
      const category = await prisma.menuCategory.upsert({
        where: { name: cat.name },
        update: { sortOrder: cat.sortOrder },
        create: {
          name: cat.name,
          sortOrder: cat.sortOrder,
          icon: cat.name.split(" ")[0], // extract emoji
        },
      });

      if (!category) continue;
      categoriesCreated++;

      for (const item of cat.items) {
        // Check existence to avoid duplicates
        const exists = await prisma.menuItemTemplate.findFirst({
          where: { name: item.name, categoryId: category.id },
        });

        if (!exists) {
          await prisma.menuItemTemplate.create({
            data: {
              name: item.name,
              categoryId: category.id,
              isVeg: item.isVeg,
              isPopular: (item as any).isPopular ?? false,
              sortOrder: 0,
            },
          });
          itemsCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${categoriesCreated} categories and ${itemsCreated} new items`,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
