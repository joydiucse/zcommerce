/** Demo catalog content used by the seeder. */

export const CATEGORIES = [
  { key: 'electronics', name: 'Electronics', description: 'Gadgets, audio gear and wearables for everyday life.', sort_order: 1 },
  { key: 'audio', parent: 'electronics', name: 'Audio', description: 'Headphones, earbuds and speakers with outstanding sound.', sort_order: 1 },
  { key: 'wearables', parent: 'electronics', name: 'Wearables', description: 'Smartwatches and fitness trackers.', sort_order: 2 },
  { key: 'home-kitchen', name: 'Home & Kitchen', description: 'Thoughtfully designed essentials for your home.', sort_order: 2 },
  { key: 'apparel', name: 'Apparel', description: 'Comfortable, durable clothing made to last.', sort_order: 3 },
  { key: 'sports-outdoors', name: 'Sports & Outdoors', description: 'Gear for trails, gyms and weekend adventures.', sort_order: 4 },
];

export const BRANDS = [
  { key: 'sonora', name: 'Sonora', description: 'Premium audio engineered in Copenhagen.' },
  { key: 'voltix', name: 'Voltix', description: 'Smart, connected devices for modern living.' },
  { key: 'lumen-home', name: 'Lumen Home', description: 'Minimalist homeware and kitchen tools.' },
  { key: 'threadline', name: 'Threadline', description: 'Organic cotton basics and everyday apparel.' },
  { key: 'northpeak', name: 'Northpeak', description: 'Outdoor equipment built for the elements.' },
];

const desc = (intro, bullets, outro) =>
  `<p>${intro}</p><ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>${outro ? `<p>${outro}</p>` : ''}`;

/**
 * name, category, brand, price, compare, cost, stock, featured, status, short, description, attributes, tags, weight
 */
export const PRODUCTS = [
  {
    name: 'Sonora Aria Wireless Headphones', category: 'audio', brand: 'sonora', price: 199, compare: 249, cost: 92, stock: 42, featured: true,
    short: 'Over-ear noise-cancelling headphones with 40-hour battery life.',
    description: desc('Immerse yourself in rich, detailed sound with the Aria. Adaptive noise cancellation tunes out the world while plush memory-foam cushions keep you comfortable all day.', ['Hybrid active noise cancellation', '40 hours of playback, 10 minutes charge = 5 hours', 'Multipoint Bluetooth 5.3', 'Foldable design with travel case'], 'Includes USB-C cable and 3.5 mm audio cable.'),
    attributes: [['Color', 'Midnight Black'], ['Battery life', '40 hours'], ['Connectivity', 'Bluetooth 5.3'], ['Weight', '250 g']], tags: ['headphones', 'wireless', 'noise-cancelling'], weight: 0.25,
  },
  {
    name: 'Sonora Pulse True Wireless Earbuds', category: 'audio', brand: 'sonora', price: 129, compare: 149, cost: 51, stock: 65, featured: true,
    short: 'Compact earbuds with punchy bass and IPX5 water resistance.',
    description: desc('Pulse earbuds deliver big sound in a pocketable case. A secure fit and IPX5 rating make them perfect for workouts and commutes alike.', ['6 mm dynamic drivers', '8 h battery + 24 h with case', 'IPX5 sweat and water resistance', 'Wireless charging case'], null),
    attributes: [['Color', 'Arctic White'], ['Water resistance', 'IPX5'], ['Battery life', '32 hours total']], tags: ['earbuds', 'wireless', 'sport'], weight: 0.06,
  },
  {
    name: 'Sonora Boom Portable Speaker', category: 'audio', brand: 'sonora', price: 89, compare: null, cost: 38, stock: 4, featured: false,
    short: 'Rugged Bluetooth speaker with 360° sound.',
    description: desc('Take the party anywhere. Boom pumps out room-filling 360° sound and survives drops, dust and splashes.', ['360° sound with passive radiator', 'IP67 dust and waterproof', '18 hours of playtime', 'Pair two for stereo'], null),
    attributes: [['Color', 'Forest Green'], ['Water resistance', 'IP67'], ['Battery life', '18 hours']], tags: ['speaker', 'portable', 'outdoor'], weight: 0.54,
  },
  {
    name: 'Sonora Studio Monitor Headphones', category: 'audio', brand: 'sonora', price: 159, compare: null, cost: 70, stock: 0, featured: false,
    short: 'Closed-back studio headphones for accurate mixing.',
    description: desc('Studio Monitor headphones offer a flat, honest frequency response trusted by producers and engineers.', ['50 mm neodymium drivers', 'Detachable coiled cable', 'Rotating ear cups for one-ear monitoring'], null),
    attributes: [['Impedance', '38 Ω'], ['Frequency response', '15 Hz – 28 kHz']], tags: ['headphones', 'studio', 'wired'], weight: 0.29,
  },
  {
    name: 'Voltix Pulse Smartwatch', category: 'wearables', brand: 'voltix', price: 249, compare: 299, cost: 120, stock: 28, featured: true,
    short: 'AMOLED smartwatch with GPS, heart-rate and 7-day battery.',
    description: desc('Pulse keeps you connected and motivated with a bright AMOLED display, built-in GPS and advanced health tracking.', ['1.4" always-on AMOLED display', 'Built-in GPS and 100+ sport modes', 'Heart rate, SpO2 and sleep tracking', 'Up to 7 days of battery'], null),
    attributes: [['Case size', '44 mm'], ['Water resistance', '5 ATM'], ['Battery life', '7 days']], tags: ['smartwatch', 'fitness', 'gps'], weight: 0.05,
  },
  {
    name: 'Voltix Fit Band 3', category: 'wearables', brand: 'voltix', price: 59, compare: 79, cost: 21, stock: 120, featured: false,
    short: 'Slim fitness tracker with 14-day battery.',
    description: desc('Fit Band 3 tracks steps, sleep and workouts in a lightweight band you will forget you are wearing.', ['Color touchscreen', '14-day battery life', 'Swim-proof to 50 m'], null),
    attributes: [['Color', 'Graphite'], ['Battery life', '14 days']], tags: ['fitness', 'tracker'], weight: 0.02,
  },
  {
    name: 'Voltix Smart Home Hub', category: 'electronics', brand: 'voltix', price: 119, compare: null, cost: 55, stock: 33, featured: false,
    short: 'Control lights, locks and sensors from one hub.',
    description: desc('Bring all your smart devices together. The Voltix Hub supports Zigbee, Matter and Wi-Fi accessories.', ['Matter and Zigbee 3.0 support', 'Local automations that work offline', 'Works with major voice assistants'], null),
    attributes: [['Protocols', 'Matter, Zigbee, Wi-Fi'], ['Power', 'USB-C']], tags: ['smart-home', 'hub'], weight: 0.3,
  },
  {
    name: 'Voltix 65W GaN Charger', category: 'electronics', brand: 'voltix', price: 45, compare: 59, cost: 16, stock: 210, featured: false,
    short: 'Compact three-port fast charger for laptop, phone and tablet.',
    description: desc('Charge three devices at once from a charger smaller than a deck of cards.', ['65 W total output', '2× USB-C + 1× USB-A', 'Foldable plug'], null),
    attributes: [['Output', '65 W'], ['Ports', '2× USB-C, 1× USB-A']], tags: ['charger', 'usb-c'], weight: 0.12,
  },
  {
    name: 'Lumen Pour-Over Coffee Set', category: 'home-kitchen', brand: 'lumen-home', price: 64, compare: null, cost: 24, stock: 37, featured: true,
    short: 'Borosilicate glass dripper, carafe and stainless filter.',
    description: desc('Brew a clean, aromatic cup every morning. The set includes everything you need for café-quality pour-over at home.', ['Heat-resistant borosilicate glass', 'Reusable stainless-steel filter', '600 ml carafe with wooden collar'], null),
    attributes: [['Capacity', '600 ml'], ['Material', 'Borosilicate glass, steel, oak']], tags: ['coffee', 'kitchen'], weight: 0.8,
  },
  {
    name: 'Lumen Cast Iron Skillet 26cm', category: 'home-kitchen', brand: 'lumen-home', price: 54, compare: 69, cost: 19, stock: 3, featured: false,
    short: 'Pre-seasoned cast iron for searing, baking and frying.',
    description: desc('A kitchen workhorse that gets better with every use. Even heat retention gives a perfect sear every time.', ['Pre-seasoned with vegetable oil', 'Oven safe to 260°C', 'Works on induction'], null),
    attributes: [['Diameter', '26 cm'], ['Material', 'Cast iron']], tags: ['cookware', 'cast-iron'], weight: 2.4,
  },
  {
    name: 'Lumen Linen Table Runner', category: 'home-kitchen', brand: 'lumen-home', price: 29, compare: null, cost: 9, stock: 75, featured: false,
    short: 'Stonewashed European linen in natural oat.',
    description: desc('Add texture and warmth to your table with soft, stonewashed linen that only improves with washing.', ['100% European flax linen', '40 × 180 cm', 'Machine washable'], null),
    attributes: [['Color', 'Oat'], ['Size', '40 × 180 cm']], tags: ['linen', 'dining'], weight: 0.3,
  },
  {
    name: 'Lumen Ceramic Dinnerware Set', category: 'home-kitchen', brand: 'lumen-home', price: 119, compare: 139, cost: 48, stock: 18, featured: true,
    short: '12-piece stoneware set with a reactive matte glaze.',
    description: desc('Handcrafted-look stoneware for everyday meals and dinner parties.', ['4 dinner plates, 4 side plates, 4 bowls', 'Dishwasher and microwave safe', 'Reactive glaze — every piece is unique'], null),
    attributes: [['Pieces', '12'], ['Color', 'Sand']], tags: ['dinnerware', 'ceramic'], weight: 6.5,
  },
  {
    name: 'Lumen Aroma Diffuser', category: 'home-kitchen', brand: 'lumen-home', price: 39, compare: null, cost: 14, stock: 0, featured: false, status: 'draft',
    short: 'Ultrasonic diffuser with warm ambient light.',
    description: desc('Fill your space with calming scents. Whisper-quiet ultrasonic mist with auto shut-off.', ['300 ml tank', '8 hour runtime', 'Auto shut-off'], null),
    attributes: [['Capacity', '300 ml']], tags: ['aroma', 'wellness'], weight: 0.4,
  },
  {
    name: 'Threadline Organic Cotton Tee', category: 'apparel', brand: 'threadline', price: 28, compare: null, cost: 8, stock: 160, featured: true,
    short: 'Heavyweight organic cotton crew neck tee.',
    description: desc('The tee you will reach for every day. Garment-dyed organic cotton with a relaxed fit.', ['100% GOTS-certified organic cotton', '220 gsm heavyweight jersey', 'Pre-shrunk'], null),
    attributes: [['Material', 'Organic cotton'], ['Fit', 'Relaxed'], ['Color', 'Washed Black']], tags: ['t-shirt', 'organic'], weight: 0.22,
  },
  {
    name: 'Threadline Merino Crew Sweater', category: 'apparel', brand: 'threadline', price: 89, compare: 110, cost: 34, stock: 22, featured: false,
    short: 'Fine-gauge merino wool sweater, naturally temperature regulating.',
    description: desc('Soft, breathable and itch-free. A wardrobe staple for cool mornings and travel.', ['100% extra-fine merino wool', 'Naturally odor resistant', 'Rib-knit cuffs and hem'], null),
    attributes: [['Material', 'Merino wool'], ['Color', 'Heather Grey']], tags: ['sweater', 'merino'], weight: 0.35,
  },
  {
    name: 'Threadline Everyday Chino', category: 'apparel', brand: 'threadline', price: 69, compare: null, cost: 25, stock: 48, featured: false,
    short: 'Stretch cotton chinos with a tapered fit.',
    description: desc('Smart enough for the office, comfortable enough for the weekend.', ['98% cotton, 2% elastane', 'Tapered leg', 'Hidden phone pocket'], null),
    attributes: [['Fit', 'Tapered'], ['Color', 'Khaki']], tags: ['pants', 'chino'], weight: 0.5,
  },
  {
    name: 'Threadline Canvas Weekender Bag', category: 'apparel', brand: 'threadline', price: 95, compare: 120, cost: 38, stock: 14, featured: true,
    short: 'Waxed canvas duffel with leather handles.',
    description: desc('Pack for a weekend away in a bag that ages beautifully.', ['Water-resistant waxed canvas', 'Full-grain leather handles', 'Padded laptop sleeve', '40 L capacity'], null),
    attributes: [['Capacity', '40 L'], ['Material', 'Waxed canvas, leather']], tags: ['bag', 'travel'], weight: 1.4,
  },
  {
    name: 'Threadline Wool Beanie', category: 'apparel', brand: 'threadline', price: 24, compare: null, cost: 6, stock: 90, featured: false, status: 'archived',
    short: 'Chunky rib-knit beanie.',
    description: desc('Keep warm in style with a classic cuffed beanie.', ['50% wool, 50% acrylic', 'One size fits most'], null),
    attributes: [['Color', 'Rust']], tags: ['hat', 'winter'], weight: 0.1,
  },
  {
    name: 'Northpeak Trail Running Shoes', category: 'sports-outdoors', brand: 'northpeak', price: 139, compare: 159, cost: 58, stock: 31, featured: true,
    short: 'Grippy, cushioned trail shoes for technical terrain.',
    description: desc('Lightweight protection and confident grip on mud, rock and roots.', ['Vibram Megagrip outsole', 'Rock plate for protection', '6 mm drop, responsive foam'], null),
    attributes: [['Drop', '6 mm'], ['Weight', '290 g (US 9)']], tags: ['shoes', 'trail', 'running'], weight: 0.58,
  },
  {
    name: 'Northpeak 2-Person Ultralight Tent', category: 'sports-outdoors', brand: 'northpeak', price: 329, compare: 379, cost: 150, stock: 9, featured: true,
    short: 'Freestanding 3-season tent weighing just 1.3 kg.',
    description: desc('Go further with less weight. Quick to pitch and storm-ready.', ['1.3 kg packed weight', 'Two doors and vestibules', 'Aluminum DAC poles', 'Fully taped seams'], null),
    attributes: [['Capacity', '2 person'], ['Season', '3-season'], ['Weight', '1.3 kg']], tags: ['tent', 'camping', 'ultralight'], weight: 1.3,
  },
  {
    name: 'Northpeak Insulated Water Bottle 750ml', category: 'sports-outdoors', brand: 'northpeak', price: 32, compare: null, cost: 10, stock: 140, featured: false,
    short: 'Keeps drinks cold for 24h or hot for 12h.',
    description: desc('Double-wall vacuum insulation in a leak-proof bottle tough enough for the trail.', ['18/8 stainless steel', 'BPA-free leak-proof lid', 'Powder-coated finish'], null),
    attributes: [['Capacity', '750 ml'], ['Color', 'Glacier Blue']], tags: ['bottle', 'hydration'], weight: 0.38,
  },
  {
    name: 'Northpeak Packable Down Jacket', category: 'sports-outdoors', brand: 'northpeak', price: 179, compare: 220, cost: 75, stock: 2, featured: false,
    short: '800-fill responsibly sourced down that packs into its own pocket.',
    description: desc('Serious warmth with almost no weight or bulk.', ['800-fill RDS-certified down', 'DWR-treated ripstop shell', 'Packs into chest pocket'], null),
    attributes: [['Fill power', '800'], ['Color', 'Ember Orange']], tags: ['jacket', 'down', 'insulation'], weight: 0.34,
  },
  {
    name: 'Northpeak Yoga Mat Pro', category: 'sports-outdoors', brand: 'northpeak', price: 79, compare: null, cost: 27, stock: 44, featured: false,
    short: '5 mm natural rubber mat with a grippy top layer.',
    description: desc('Stable, cushioned and grippy — even in hot yoga.', ['Natural tree rubber base', 'Moisture-wicking PU top', '183 × 68 cm'], null),
    attributes: [['Thickness', '5 mm'], ['Size', '183 × 68 cm']], tags: ['yoga', 'fitness'], weight: 2.5,
  },
  {
    name: 'Voltix Action Camera 4K', category: 'electronics', brand: 'voltix', price: 219, compare: 259, cost: 98, stock: 16, featured: false,
    short: 'Stabilized 4K60 action camera, waterproof to 10 m.',
    description: desc('Capture every adventure in crisp, stabilized 4K.', ['4K60 video, 20 MP photos', 'HyperSteady stabilization', 'Waterproof to 10 m without housing', 'Front and rear screens'], null),
    attributes: [['Video', '4K60'], ['Waterproof', '10 m']], tags: ['camera', 'action', '4k'], weight: 0.15,
  },
];

export const PAGES = [
  {
    slug: 'about', title: 'About Us', show_in_footer: true,
    content: '<h2>Our story</h2><p>Demo Store started in 2019 with a simple idea: carefully chosen products that are built to last. Today we work with a small group of independent brands that share our values of quality, fairness and sustainability.</p><h3>What we believe</h3><ul><li>Fewer, better things</li><li>Honest pricing</li><li>Real people answering your questions</li></ul>',
  },
  {
    slug: 'contact', title: 'Contact', show_in_footer: true,
    content: '<h2>Get in touch</h2><p>We usually reply within one business day.</p><ul><li>Email: <a href="mailto:hello@demo.test">hello@demo.test</a></li><li>Phone: +1 (555) 010-2030</li><li>Address: 123 Market Street, San Francisco, CA 94103</li></ul>',
  },
  {
    slug: 'terms', title: 'Terms of Service', show_in_footer: true,
    content: '<h2>Terms of Service</h2><p>By placing an order you agree to these terms. Prices are shown in USD and include applicable discounts. We reserve the right to cancel orders in case of pricing errors or suspected fraud.</p><h3>Orders</h3><p>An order confirmation email does not constitute acceptance; acceptance occurs when the order ships.</p>',
  },
  {
    slug: 'privacy', title: 'Privacy Policy', show_in_footer: true,
    content: '<h2>Privacy Policy</h2><p>We collect only the information needed to process your orders and improve our store. We never sell your personal data.</p><h3>Cookies</h3><p>We use essential cookies for your cart and optional analytics cookies that you can disable at any time.</p>',
  },
  {
    slug: 'shipping-returns', title: 'Shipping & Returns', show_in_footer: true,
    content: '<h2>Shipping</h2><p>Standard shipping is free on orders over $50. Express delivery arrives in 1–2 business days.</p><h2>Returns</h2><p>Not quite right? Return unused items within 30 days for a full refund.</p>',
  },
];

export const CUSTOMERS = [
  ['Jane Cooper', 'jane@example.com', '+1 555 0101', 'San Francisco', 'CA', '94103'],
  ['Robert Fox', 'robert.fox@example.com', '+1 555 0102', 'Austin', 'TX', '73301'],
  ['Esther Howard', 'esther@example.com', '+1 555 0103', 'Seattle', 'WA', '98101'],
  ['Cameron Williamson', 'cameron@example.com', '+1 555 0104', 'Denver', 'CO', '80202'],
  ['Brooklyn Simmons', 'brooklyn@example.com', '+1 555 0105', 'Brooklyn', 'NY', '11201'],
  ['Leslie Alexander', 'leslie@example.com', '+1 555 0106', 'Chicago', 'IL', '60601'],
  ['Jenny Wilson', 'jenny@example.com', '+1 555 0107', 'Portland', 'OR', '97201'],
  ['Guy Hawkins', 'guy@example.com', '+1 555 0108', 'Boston', 'MA', '02108'],
  ['Kristin Watson', 'kristin@example.com', '+1 555 0109', 'Miami', 'FL', '33101'],
  ['Devon Lane', 'devon@example.com', '+1 555 0110', 'Phoenix', 'AZ', '85001'],
];

export const REVIEW_SNIPPETS = [
  [5, 'Absolutely love it', 'Exceeded my expectations. Build quality is excellent and it arrived quickly.'],
  [5, 'Worth every penny', 'I have been using this daily for a few weeks and it still feels brand new.'],
  [4, 'Great, with one small nitpick', 'Really happy overall. Packaging could be a little less wasteful.'],
  [4, 'Solid purchase', 'Does exactly what it says. Would buy again.'],
  [5, 'Perfect gift', 'Bought this for my partner and they have not stopped using it.'],
  [3, 'Good but not great', 'It is fine for the price, but I expected slightly better finishing.'],
  [4, 'Very good quality', 'Feels premium. Shipping was fast and the support team was helpful.'],
];
