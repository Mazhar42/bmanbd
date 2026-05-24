const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const User = require("../models/User");
const Order = require("../models/Order");
const InventoryTransaction = require("../models/InventoryTransaction");
const SiteSettings = require("../models/SiteSettings");

const SIZES = ["S", "M", "L", "XL", "XXL"];
const SHIRT_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Black", hex: "#111111" },
  { name: "Light Green", hex: "#90EE90" },
  { name: "Beige", hex: "#C6A77D" },
  { name: "Houndstooth", hex: "#555555" },
];

const seed = async () => {
  await connectDB();

  // Clear existing
  await Promise.all([
    Category.deleteMany(),
    Product.deleteMany(),
    ProductVariant.deleteMany(),
    User.deleteMany(),
    Order.deleteMany(),
    InventoryTransaction.deleteMany(),
    SiteSettings.deleteMany(),
  ]);
  console.log("Cleared existing data");

  // ─── Category Hierarchy ────────────────────────────────────────────────────
  // Level 0 – root
  const menCat = await Category.create({
    name: "Men",
    slug: "men",
    sortOrder: 0,
  });

  // Level 1 – main types (as requested)
  const [shirtCat, pantCat, panjabiCat, tshirtCat, poloCat, shortsCat] =
    await Promise.all([
      Category.create({
        name: "Shirt",
        slug: "shirt",
        parent: menCat._id,
        sortOrder: 1,
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
      }),
      Category.create({
        name: "Pant",
        slug: "pant",
        parent: menCat._id,
        sortOrder: 2,
        image:
          "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400",
      }),
      Category.create({
        name: "Panjabi",
        slug: "panjabi",
        parent: menCat._id,
        sortOrder: 3,
        image:
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
      }),
      Category.create({
        name: "T-Shirt",
        slug: "t-shirt",
        parent: menCat._id,
        sortOrder: 4,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      }),
      Category.create({
        name: "Polo",
        slug: "polo",
        parent: menCat._id,
        sortOrder: 5,
        image:
          "https://images.unsplash.com/photo-1563630381190-77c336ea545a?w=400",
      }),
      Category.create({
        name: "Shorts",
        slug: "shorts",
        parent: menCat._id,
        sortOrder: 6,
        image:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400",
      }),
    ]);

  // Level 2 – Shirt sub-types
  const [longSleeveCat, shortSleeveCat] = await Promise.all([
    Category.create({
      name: "Long Sleeve",
      slug: "long-sleeve",
      parent: shirtCat._id,
      sortOrder: 0,
    }),
    Category.create({
      name: "Short Sleeve",
      slug: "short-sleeve",
      parent: shirtCat._id,
      sortOrder: 1,
    }),
  ]);

  // Level 3 – Long Sleeve sub-styles
  const [longRegularCat, longFormalCat, longCheckCat, longPrintCat, katuaCat] =
    await Promise.all([
      Category.create({
        name: "Regular",
        slug: "long-regular",
        parent: longSleeveCat._id,
        sortOrder: 2,
      }),
      Category.create({
        name: "Formal",
        slug: "long-formal",
        parent: longSleeveCat._id,
        sortOrder: 3,
      }),
      Category.create({
        name: "Check",
        slug: "long-check",
        parent: longSleeveCat._id,
        sortOrder: 4,
      }),
      Category.create({
        name: "Print",
        slug: "long-print",
        parent: longSleeveCat._id,
        sortOrder: 5,
      }),
      Category.create({
        name: "Katua",
        slug: "katua",
        parent: longSleeveCat._id,
        sortOrder: 6,
      }),
    ]);

  // Level 3 – Short Sleeve sub-styles
  const [
    shortRegularCat,
    shortFormalCat,
    shortCheckCat,
    shortPrintCat,
    cubanCat,
  ] = await Promise.all([
    Category.create({
      name: "Regular",
      slug: "short-regular",
      parent: shortSleeveCat._id,
      sortOrder: 0,
    }),
    Category.create({
      name: "Formal",
      slug: "short-formal",
      parent: shortSleeveCat._id,
      sortOrder: 1,
    }),
    Category.create({
      name: "Check",
      slug: "short-check",
      parent: shortSleeveCat._id,
      sortOrder: 2,
    }),
    Category.create({
      name: "Print",
      slug: "short-print",
      parent: shortSleeveCat._id,
      sortOrder: 3,
    }),
    Category.create({
      name: "Cuban",
      slug: "short-cuban",
      parent: shortSleeveCat._id,
      sortOrder: 4,
    }),
  ]);

  // Level 2 – Pant sub-types
  const [denimCat, chinoCat, formalPantCat, trouserPantCat, joggersCat] =
    await Promise.all([
      Category.create({
        name: "Denim",
        slug: "denim",
        parent: pantCat._id,
        sortOrder: 0,
      }),
      Category.create({
        name: "Chino",
        slug: "chino",
        parent: pantCat._id,
        sortOrder: 1,
      }),
      Category.create({
        name: "Formal",
        slug: "formal-pant",
        parent: pantCat._id,
        sortOrder: 2,
      }),
      Category.create({
        name: "Trousers",
        slug: "trouser",
        parent: pantCat._id,
        sortOrder: 3,
      }),
      Category.create({
        name: "Joggers",
        slug: "joggers",
        parent: pantCat._id,
        sortOrder: 4,
      }),
    ]);

  // Level 2 – T-Shirt sub-types
  const [tshirtRegularCat, dropShoulderCat] = await Promise.all([
    Category.create({
      name: "Regular",
      slug: "tshirt-regular",
      parent: tshirtCat._id,
      sortOrder: 0,
    }),
    Category.create({
      name: "Drop Shoulder",
      slug: "tshirt-drop-shoulder",
      parent: tshirtCat._id,
      sortOrder: 1,
    }),
  ]);

  // Level 2 – Panjabi sub-types
  const [panjabiCasualCat, panjabiPremiumCat] = await Promise.all([
    Category.create({
      name: "Casual",
      slug: "panjabi-casual",
      parent: panjabiCat._id,
      sortOrder: 0,
    }),
    Category.create({
      name: "Premium",
      slug: "panjabi-premium",
      parent: panjabiCat._id,
      sortOrder: 1,
    }),
  ]);

  // Level 3 – Denim sub-styles
  const [denimRegularCat, denimCargoCat] = await Promise.all([
    Category.create({
      name: "Regular",
      slug: "denim-regular",
      parent: denimCat._id,
      sortOrder: 0,
    }),
    Category.create({
      name: "Cargo",
      slug: "denim-cargo",
      parent: denimCat._id,
      sortOrder: 1,
    }),
  ]);

  // Level 3 – Chino sub-styles
  const [chinoRegularCat, chinoCargoCat] = await Promise.all([
    Category.create({
      name: "Regular",
      slug: "chino-regular",
      parent: chinoCat._id,
      sortOrder: 0,
    }),
    Category.create({
      name: "Cargo",
      slug: "chino-cargo",
      parent: chinoCat._id,
      sortOrder: 1,
    }),
  ]);

  // Backward-compatible aliases used in product seed objects below
  const solidColorCat = longRegularCat;
  const checkShirtFullCat = longCheckCat;
  const checkShirtHalfCat = shortCheckCat;
  const trouserCat = trouserPantCat;

  console.log("Categories created (full hierarchy)");

  // Admin user
  await User.create({
    name: "Admin",
    email: "admin@bmanbd.com",
    password: "09007860",
    role: "admin",
  });
  console.log("Admin user created: admin@bmanbd.com / 09007860");

  // ─── Products ─────────────────────────────────────────────────────────────
  const productsData = [
    {
      name: "Sky Blue Oxford Cotton Shirt",
      description:
        "Classic Oxford weave cotton shirt, perfect for casual and smart-casual occasions. Breathable and comfortable.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Oxford Cotton",
      fit: "regular",
      tags: ["oxford", "cotton", "casual"],
      isFeatured: true,
      isNewArrival: true,
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600",
        "https://images.unsplash.com/photo-1604695573706-53170668f6a6?w=600",
      ],
      colors: [
        { name: "Sky Blue", hex: "#87CEEB" },
        { name: "White", hex: "#FFFFFF" },
      ],
      price: 1290,
    },
    {
      name: "Black & Brown Checked Shirt",
      description:
        "Stylish checked shirt with a modern fit. Made from premium cotton blend fabric.",
      category: checkShirtFullCat._id, // Shirt > Full Sleeve > Check Shirt
      fabric: "Cotton Blend",
      fit: "slim",
      tags: ["checked", "casual", "trendy"],
      isFeatured: true,
      isTrending: true,
      images: [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600",
      ],
      colors: [
        { name: "Black", hex: "#111111" },
        { name: "Brown", hex: "#8B4513" },
      ],
      price: 1390,
    },
    {
      name: "Black & White Checked Shirt",
      description:
        "Timeless black and white check pattern. A wardrobe essential.",
      category: checkShirtFullCat._id, // Shirt > Full Sleeve > Check Shirt
      fabric: "Cotton",
      fit: "regular",
      tags: ["checked", "classic"],
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600",
      ],
      colors: [{ name: "Black/White", hex: "#555555" }],
      price: 990,
    },
    {
      name: "Olive Army Canvas Shirt",
      description:
        "Classic olive canvas fabric shirt with a relaxed military-inspired fit.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Canvas",
      fit: "relaxed",
      tags: ["olive", "army", "casual"],
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
      ],
      colors: [{ name: "Olive", hex: "#556B2F" }],
      price: 1190,
    },
    {
      name: "Light Pigeon Oxford Cotton Shirt",
      description:
        "Soft light pigeon colored Oxford cotton shirt. Easy breezy everyday wear.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Oxford Cotton",
      fit: "regular",
      tags: ["oxford", "light", "casual"],
      isFeatured: true,
      isNewArrival: true,
      images: [
        "https://images.unsplash.com/photo-1618517351616-38fb9c5210c6?w=600",
      ],
      colors: [{ name: "Light Pigeon", hex: "#B0C4DE" }],
      price: 1090,
    },
    {
      name: "The Blue Ocean Cotton Shirt",
      description: "Cool blue ocean color soft cotton shirt. Great for summer.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Cotton",
      fit: "regular",
      tags: ["blue", "cotton", "summer"],
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4b4e51?w=600",
      ],
      colors: [{ name: "Ocean Blue", hex: "#006994" }],
      price: 990,
    },
    {
      name: "Deep Navy Blue Oxford Shirt",
      description:
        "Classic deep navy oxford shirt. Versatile choice for any occasion.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Oxford Cotton",
      fit: "slim",
      tags: ["navy", "oxford", "formal"],
      images: [
        "https://images.unsplash.com/photo-1598030343246-eec71cb1f113?w=600",
      ],
      colors: [{ name: "Navy", hex: "#1B2A4A" }],
      price: 1190,
    },
    {
      name: "Mint Green Damascus Shirt",
      description:
        "Fresh mint green shirt with subtle texture. Light and airy.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Damascus Cotton",
      fit: "regular",
      tags: ["mint", "green", "summer"],
      isTrending: true,
      images: [
        "https://images.unsplash.com/photo-1563630381190-77c336ea545a?w=600",
      ],
      colors: [{ name: "Mint Green", hex: "#98FF98" }],
      price: 1090,
    },
    {
      name: "Light Pink & Checkered Shirt",
      description: "Soft light pink checkered shirt. Subtle and stylish.",
      category: checkShirtHalfCat._id, // Shirt > Half Sleeve > Check Shirt
      fabric: "Cotton",
      fit: "regular",
      tags: ["pink", "checkered", "casual"],
      images: [
        "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600",
      ],
      colors: [{ name: "Light Pink", hex: "#FFB6C1" }],
      price: 1090,
    },
    {
      name: "Light Blue & Peach Linen Shirt",
      description:
        "Premium linen fabric for maximum breathability. Ideal for hot weather.",
      category: solidColorCat._id, // Shirt > Full Sleeve > Solid Color
      fabric: "Linen",
      fit: "relaxed",
      tags: ["linen", "summer", "breathable"],
      isNewArrival: true,
      images: [
        "https://images.unsplash.com/photo-1598966739654-5e9a252d8c32?w=600",
      ],
      colors: [
        { name: "Light Blue", hex: "#ADD8E6" },
        { name: "Peach", hex: "#FFCBA4" },
      ],
      price: 1490,
    },
    {
      name: "Classic Slim Fit Chino Pant",
      description:
        "Slim fit chino pants in premium stretch cotton. Office to weekend ready.",
      category: chinoCat._id, // Pant > Twill > Chino
      fabric: "Stretch Cotton",
      fit: "slim",
      tags: ["chino", "formal", "office"],
      isFeatured: true,
      isTrending: true,
      images: [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
      ],
      colors: [
        { name: "Navy", hex: "#1B2A4A" },
        { name: "Khaki", hex: "#C3B091" },
        { name: "Black", hex: "#111111" },
      ],
      price: 1290,
    },
    {
      name: "Olive Grey Formal Trouser",
      description:
        "Slim cut formal trouser. A must-have for the office wardrobe.",
      category: trouserCat._id, // Pant > Trouser
      fabric: "Polyester Viscose",
      fit: "slim",
      tags: ["formal", "office", "trouser"],
      images: [
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
      ],
      colors: [{ name: "Olive Grey", hex: "#708090" }],
      price: 1090,
    },
    {
      name: "Traditional White Panjabi",
      description:
        "Pure white traditional panjabi with subtle embroidery. Perfect for Eid and festivals.",
      category: panjabiPremiumCat._id, // Panjabi > Premium
      fabric: "Cotton Voile",
      fit: "regular",
      tags: ["traditional", "white", "eid", "festival"],
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600",
      ],
      colors: [{ name: "White", hex: "#FFFFFF" }],
      price: 1890,
    },
    {
      name: "Embroidered Panjabi - Cream",
      description:
        "Elegant cream panjabi with hand-crafted embroidery detailing.",
      category: panjabiPremiumCat._id, // Panjabi > Premium
      fabric: "Cotton Silk",
      fit: "regular",
      tags: ["embroidery", "cream", "premium"],
      isFeatured: true,
      isTrending: true,
      images: [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
      ],
      colors: [{ name: "Cream", hex: "#FFFDD0" }],
      price: 2490,
    },
    {
      name: "Modern Casual Panjabi - Olive",
      description:
        "Modern take on the classic panjabi. Great for casual and semi-formal wear.",
      category: panjabiCasualCat._id, // Panjabi > Casual
      fabric: "Cotton",
      fit: "regular",
      tags: ["casual", "olive", "modern"],
      isNewArrival: true,
      images: [
        "https://images.unsplash.com/photo-1604695573706-53170668f6a6?w=600",
      ],
      colors: [{ name: "Olive", hex: "#556B2F" }],
      price: 1690,
    },
  ];

  let skuCounter = 1;
  for (const pData of productsData) {
    const { colors, price, ...rest } = pData;
    const product = await Product.create(rest);
    for (const color of colors) {
      for (const size of SIZES) {
        const sku = `${product.name.substring(0, 4).toUpperCase().replace(/\s/g, "")}-${color.name.substring(0, 3).toUpperCase()}-${size}-${String(skuCounter++).padStart(3, "0")}`;
        const hasDiscount = Math.random() > 0.6;
        await ProductVariant.create({
          product: product._id,
          size,
          color: color.name,
          colorHex: color.hex,
          sku: sku.replace(/[^A-Z0-9-]/g, ""),
          price,
          discountPrice: hasDiscount ? Math.round(price * 0.85) : undefined,
          stock: Math.floor(Math.random() * 40) + 5,
          image: rest.images[0],
        });
      }
    }
  }

  console.log(`✅ Seeded ${productsData.length} products with variants`);
  console.log("🎉 Database seeded successfully!");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
