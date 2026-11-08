require('dotenv').config();
const { connectDB, mongoose } = require('./db');
const Product = require('./models/Product');
const ShippingTier = require('./models/ShippingTier');

const products = [
  {
    name: 'Sunday Showdown Home Jersey',
    slug: 'sunday-showdown-home-jersey',
    category: 'jerseys',
    team: 'Pittsburgh Steelers',
    price: 3200,
    description: 'A black-and-gold home jersey for Steelers game day.',
    featured: true,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 2 },
      { size: 'L', stock: 8 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 2 },
    ],
  },
  {
    name: 'Primetime Away Jersey',
    slug: 'primetime-away-jersey',
    category: 'jerseys',
    team: 'San Francisco 49ers',
    price: 3300,
    description: 'A red-and-white away jersey for the Faithful.',
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 6 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 3 },
      { size: 'XXL', stock: 1 },
    ],
  },
  {
    name: 'Midnight Alternate Jersey',
    slug: 'midnight-alternate-jersey',
    category: 'jerseys',
    team: 'Philadelphia Eagles',
    price: 3400,
    description: 'An Eagles alternate jersey in midnight green.',
    sizes: [
      { size: 'S', stock: 3 },
      { size: 'M', stock: 0 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 2 },
    ],
  },
  {
    name: 'Retro Game Day Jersey',
    slug: 'retro-game-day-jersey',
    category: 'jerseys',
    team: 'Las Vegas Raiders',
    price: 3100,
    description: 'A classic silver-and-black jersey for Raiders fans.',
    sizes: [
      { size: 'S', stock: 2 },
      { size: 'M', stock: 4 },
      { size: 'L', stock: 6 },
      { size: 'XL', stock: 3 },
      { size: 'XXL', stock: 1 },
    ],
  },
  {
    name: 'Endzone Pullover Hoodie',
    slug: 'endzone-pullover-hoodie',
    category: 'hoodies',
    team: 'Kansas City Chiefs',
    price: 2800,
    description: 'A warm pullover hoodie in Chiefs red.',
    featured: true,
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 2 },
      { size: 'XL', stock: 3 },
      { size: 'XXL', stock: 2 },
    ],
  },
  {
    name: 'Cold Front Fleece Hoodie',
    slug: 'cold-front-fleece-hoodie',
    category: 'hoodies',
    team: 'Buffalo Bills',
    price: 2950,
    description: 'A fleece-lined hoodie for cold-weather football.',
    sizes: [
      { size: 'S', stock: 3 },
      { size: 'M', stock: 0 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 2 },
    ],
  },
  {
    name: 'Sideline Zip Hoodie',
    slug: 'sideline-zip-hoodie',
    category: 'hoodies',
    team: 'Dallas Cowboys',
    price: 2650,
    description: 'A lightweight zip hoodie in Cowboys navy.',
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 3 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 2 },
      { size: 'XXL', stock: 1 },
    ],
  },
  {
    name: 'Tailgate Graphic Tee',
    slug: 'tailgate-graphic-tee',
    category: 'tees',
    team: 'Green Bay Packers',
    price: 1250,
    description: 'A soft cotton tee for a Packers tailgate.',
    featured: true,
    sizes: [
      { size: 'S', stock: 7 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 6 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 3 },
    ],
  },
  {
    name: 'Fourth Quarter Tee',
    slug: 'fourth-quarter-tee',
    category: 'tees',
    team: 'New York Giants',
    price: 1190,
    description: 'A game-day graphic tee in Giants blue.',
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 3 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 2 },
      { size: 'XXL', stock: 1 },
    ],
  },
  {
    name: 'Limited Run Championship Tee',
    slug: 'limited-run-championship-tee',
    category: 'tees',
    team: 'New England Patriots',
    price: 1450,
    description: 'A limited-run championship tee, available by pre-order.',
    preOrder: true,
    sizes: [
      { size: 'S', stock: 3 },
      { size: 'M', stock: 4 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 2 },
      { size: 'XXL', stock: 1 },
    ],
  },
];

const shippingTiers = [
  { region: 'Metro Manila', fee: 100, freeShippingMin: 5000, active: true },
  { region: 'Luzon', fee: 130, freeShippingMin: 5000, active: true },
  { region: 'Visayas', fee: 160, freeShippingMin: 5000, active: true },
  { region: 'Mindanao', fee: 180, freeShippingMin: 5000, active: true },
];

async function seed() {
  try {
    await connectDB(process.env.MONGODB_URI);
    await Product.deleteMany({});
    await ShippingTier.deleteMany({});
    await Product.insertMany(products);
    await ShippingTier.insertMany(shippingTiers);
    console.log(
      `Seeded ${products.length} products and ${shippingTiers.length} shipping tiers.`
    );
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

seed().catch(error => {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});
