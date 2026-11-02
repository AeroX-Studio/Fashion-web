// ============================================================================
// NOBO FASHION — Database Seed Script
// Run: node src/lib/db/seed.js
// ============================================================================
const bcrypt = require('bcryptjs');
const { initDatabase, getDb, run, insert, get, all, exec, saveImmediately } = require('./index');
const { SCHEMA } = require('./schema');

async function seed({ bootstrap = false, initialized = false, resetProducts = false } = {}) {
  console.log('🌱 Initializing Nobo Fashion database...\n');
  if (!initialized) await initDatabase();

  const db = getDb();
  // Ensure schema is up to date
  db.run(SCHEMA);
  console.log('✅ Schema initialized');

  // ── Roles ──
  const roles = [
    { name: 'Super Admin', description: 'Full access to everything' },
    { name: 'Manager', description: 'Manage orders, products, and customers' },
    { name: 'Order Manager', description: 'Manage orders and invoices' },
    { name: 'Product Manager', description: 'Manage products and inventory' },
    { name: 'Customer Support', description: 'Manage chat and customer issues' },
    { name: 'Inventory Manager', description: 'Manage stock and inventory' },
  ];

  for (const r of roles) {
    const existing = get('SELECT id FROM roles WHERE name = ?', [r.name]);
    if (!existing) {
      run('INSERT INTO roles (name, description) VALUES (?, ?)', [r.name, r.description]);
    }
  }
  console.log('✅ Roles created');

  // ── Permissions ──
  const permissions = [
    { name: 'view_orders', group_name: 'Orders', description: 'View orders' },
    { name: 'edit_orders', group_name: 'Orders', description: 'Edit/update orders' },
    { name: 'delete_orders', group_name: 'Orders', description: 'Delete orders' },
    { name: 'view_products', group_name: 'Products', description: 'View products' },
    { name: 'create_products', group_name: 'Products', description: 'Create products' },
    { name: 'edit_products', group_name: 'Products', description: 'Edit products' },
    { name: 'delete_products', group_name: 'Products', description: 'Delete products' },
    { name: 'view_inventory', group_name: 'Inventory', description: 'View inventory' },
    { name: 'manage_inventory', group_name: 'Inventory', description: 'Adjust inventory' },
    { name: 'view_customers', group_name: 'Customers', description: 'View customers' },
    { name: 'edit_customers', group_name: 'Customers', description: 'Edit customers' },
    { name: 'view_invoices', group_name: 'Invoices', description: 'View invoices' },
    { name: 'manage_invoices', group_name: 'Invoices', description: 'Manage invoices' },
    { name: 'view_chat', group_name: 'Chat', description: 'View chat conversations' },
    { name: 'manage_chat', group_name: 'Chat', description: 'Reply to chat' },
    { name: 'view_coupons', group_name: 'Coupons', description: 'View coupons' },
    { name: 'manage_coupons', group_name: 'Coupons', description: 'Create/edit coupons' },
    { name: 'view_reviews', group_name: 'Reviews', description: 'View reviews' },
    { name: 'manage_reviews', group_name: 'Reviews', description: 'Approve/reject reviews' },
    { name: 'manage_settings', group_name: 'Settings', description: 'Manage store settings' },
    { name: 'manage_homepage', group_name: 'Settings', description: 'Manage homepage CMS' },
    { name: 'manage_users', group_name: 'Settings', description: 'Manage admin users' },
    { name: 'manage_roles', group_name: 'Settings', description: 'Manage roles & permissions' },
    { name: 'view_reports', group_name: 'Reports', description: 'View reports' },
    { name: 'view_activity', group_name: 'Reports', description: 'View activity logs' },
  ];

  for (const p of permissions) {
    const existing = get('SELECT id FROM permissions WHERE name = ?', [p.name]);
    if (!existing) {
      run('INSERT INTO permissions (name, group_name, description) VALUES (?, ?, ?)', [
        p.name,
        p.group_name,
        p.description,
      ]);
    }
  }
  console.log('✅ Permissions created');

  // ── Give Super Admin all permissions ──
  const superAdminRole = get("SELECT id FROM roles WHERE name = 'Super Admin'");
  if (superAdminRole) {
    const allPerms = all('SELECT id FROM permissions');
    for (const p of allPerms) {
      const existing = get(
        'SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [superAdminRole.id, p.id]
      );
      if (!existing) {
        run('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
          superAdminRole.id,
          p.id,
        ]);
      }
    }
    console.log('✅ Super Admin permissions assigned');
  }

  // ── Admin User ──
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nobofashion.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existingAdmin = get(
    "SELECT id FROM users WHERE email = ? AND user_type = 'admin' LIMIT 1",
    [adminEmail]
  ) || get("SELECT id FROM users WHERE user_type = 'admin' ORDER BY id ASC LIMIT 1");
  const canCreateAdmin = !bootstrap || Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  if (!existingAdmin && canCreateAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    run(
      `INSERT INTO users (name, email, phone, password_hash, role_id, user_type, status)
       VALUES (?, ?, ?, ?, ?, 'admin', 'active')`,
      ['Admin', adminEmail, '+8801301806880', hashedPassword, superAdminRole ? superAdminRole.id : null]
    );
    console.log('✅ Admin user created from configured environment credentials.');
  } else if (!existingAdmin) {
    console.warn('[DB Seed] Admin account skipped; configure ADMIN_EMAIL and ADMIN_PASSWORD in Vercel.');
  }

  // ── Categories ──
  const categories = [
    { name: '1 Piece / Kurti', slug: '1-piece-kurti', sidebar: 1, header: 1, homepage: 1, sort: 1 },
    { name: '3 Piece', slug: '3-piece', sidebar: 1, header: 1, homepage: 1, sort: 2 },
    { name: '3 Piece (Block Print)', slug: '3-piece-block-print', sidebar: 1, header: 0, homepage: 0, sort: 3 },
    { name: '4 Piece', slug: '4-piece', sidebar: 1, header: 0, homepage: 0, sort: 4 },
    { name: 'Appliances', slug: 'appliances', sidebar: 0, header: 0, homepage: 0, sort: 5 },
    { name: 'Baby Co-Ords', slug: 'baby-co-ords', sidebar: 1, header: 0, homepage: 0, sort: 6 },
    { name: 'Baby Dress', slug: 'baby-dress', sidebar: 1, header: 0, homepage: 0, sort: 7 },
    { name: 'Bag', slug: 'bag', sidebar: 1, header: 0, homepage: 0, sort: 8 },
    { name: 'Batik', slug: 'batik', sidebar: 1, header: 0, homepage: 0, sort: 9 },
    { name: 'Bed Sheet', slug: 'bed-sheet', sidebar: 0, header: 0, homepage: 0, sort: 10 },
    { name: 'Blouse', slug: 'blouse', sidebar: 1, header: 0, homepage: 0, sort: 11 },
    { name: 'Co-Ord / 2 Piece', slug: 'co-ord-2-piece', sidebar: 1, header: 1, homepage: 1, sort: 12 },
    { name: 'Decor', slug: 'decor', sidebar: 0, header: 0, homepage: 0, sort: 13 },
    { name: 'Gaun', slug: 'gaun', sidebar: 1, header: 1, homepage: 1, sort: 14 },
    { name: 'Gift', slug: 'gift', sidebar: 0, header: 0, homepage: 0, sort: 15 },
    { name: 'Hair Care', slug: 'hair-care', sidebar: 0, header: 0, homepage: 0, sort: 16 },
    { name: 'Jersey', slug: 'jersey', sidebar: 0, header: 0, homepage: 0, sort: 17 },
    { name: 'Jewellery', slug: 'jewellery', sidebar: 1, header: 1, homepage: 1, sort: 18 },
    { name: 'Kantha', slug: 'kantha', sidebar: 1, header: 0, homepage: 0, sort: 19 },
    { name: 'Ladies Parts', slug: 'ladies-parts', sidebar: 1, header: 1, homepage: 1, sort: 20 },
    { name: 'Lehenga', slug: 'lehenga', sidebar: 1, header: 1, homepage: 1, sort: 21 },
    { name: 'Ma-Meye Combo', slug: 'ma-meye-combo', sidebar: 1, header: 0, homepage: 0, sort: 22 },
    { name: 'Orna', slug: 'orna', sidebar: 1, header: 0, homepage: 0, sort: 23 },
    { name: 'Overcoat', slug: 'overcoat', sidebar: 1, header: 0, homepage: 0, sort: 24 },
    { name: 'Panjabi', slug: 'panjabi', sidebar: 1, header: 0, homepage: 0, sort: 25 },
    { name: 'Saree', slug: 'saree', sidebar: 1, header: 1, homepage: 1, sort: 26 },
    { name: 'Scarf & Hijab', slug: 'scarf-hijab', sidebar: 1, header: 0, homepage: 0, sort: 27 },
    { name: 'School Bag', slug: 'school-bag', sidebar: 0, header: 0, homepage: 0, sort: 28 },
    { name: 'Shawl', slug: 'shawl', sidebar: 1, header: 0, homepage: 0, sort: 29 },
    { name: 'Soap', slug: 'soap', sidebar: 0, header: 0, homepage: 0, sort: 30 },
    { name: 'T-Shirt', slug: 't-shirt', sidebar: 1, header: 0, homepage: 0, sort: 31 },
    { name: 'Wallet', slug: 'wallet', sidebar: 0, header: 0, homepage: 0, sort: 32 },
    { name: 'Wants & Needs', slug: 'wants-needs', sidebar: 0, header: 0, homepage: 0, sort: 33 },
  ];

  for (const c of categories) {
    const existing = get('SELECT id FROM categories WHERE slug = ?', [c.slug]);
    if (!existing) {
      run(
        `INSERT INTO categories (name, slug, show_in_sidebar, show_in_header, show_on_homepage, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [c.name, c.slug, c.sidebar, c.header, c.homepage, c.sort]
      );
    }
  }
  console.log('✅ 33 categories initialized');

  // ── Delivery Zones ──
  const zones = [
    { name: 'Inside Dhaka', slug: 'dhaka', charge: 80, desc: 'Delivery within Dhaka city' },
    { name: 'Outside Dhaka', slug: 'outside_dhaka', charge: 150, desc: 'Delivery to all districts across Bangladesh' },
  ];
  for (const z of zones) {
    const existing = get('SELECT id FROM delivery_zones WHERE slug = ?', [z.slug]);
    if (!existing) {
      run('INSERT INTO delivery_zones (name, slug, charge, description, is_active) VALUES (?, ?, ?, ?, 1)', [
        z.name,
        z.slug,
        z.charge,
        z.desc,
      ]);
    }
  }
  console.log('✅ Delivery zones created');

  // ── Default Settings ──
  const defaultSettings = {
    store_name: 'Nobo Fashion',
    store_tagline: "Women's Fashion & Three-Piece in Bangladesh",
    store_description:
      'Shop Nobo Fashion for premium three-piece, gowns, sarees and unstitched dresses. 100% authentic, cash on delivery, fast nationwide delivery across Bangladesh.',
    store_phone: '+880 1301-806880',
    store_phone_complaints: '+880 1301-806880',
    store_email: 'info@nobofashion.com',
    store_address:
      'House 10, Road 1/A, Sector 9, Uttara, Dhaka, Bangladesh',
    store_whatsapp: '8801301806880',
    store_currency: '৳',
    store_currency_code: 'BDT',
    store_logo: '/logo.jpg',
    store_favicon: '/favicon.png',
    delivery_dhaka: '80',
    delivery_outside_dhaka: '150',
    free_delivery_threshold: '0',
    order_prefix: 'NF',
    invoice_prefix: 'INV-NF',
    meta_title: "Nobo Fashion — Women's Fashion & Three-Piece in Bangladesh",
    meta_description:
      'Shop Nobo Fashion for premium three-piece, gowns, sarees and unstitched dresses. 100% authentic, cash on delivery, fast nationwide delivery across Bangladesh.',
    facebook_url: 'https://facebook.com',
    instagram_url: 'https://instagram.com',
    youtube_url: '',
    tiktok_url: '',
    opening_hours: 'Saturday - Thursday: 10:00 AM - 9:00 PM',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = get('SELECT key FROM settings WHERE key = ?', [key]);
    if (!existing) {
      run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }
  console.log('✅ Default settings created');

  // ── Default Size Chart ──
  const defaultSizeChart = JSON.stringify([
    { size: 'S', bust: '34"', waist: '28"', hip: '36"', length: '38"' },
    { size: 'M', bust: '36"', waist: '30"', hip: '38"', length: '39"' },
    { size: 'L', bust: '38"', waist: '32"', hip: '40"', length: '40"' },
    { size: 'XL', bust: '40"', waist: '34"', hip: '42"', length: '41"' },
    { size: 'XXL', bust: '42"', waist: '36"', hip: '44"', length: '42"' },
  ]);
  const existingChart = get('SELECT id FROM size_charts WHERE id = 1');
  if (!existingChart) {
    run("INSERT INTO size_charts (id, name, chart_data) VALUES (1, 'Standard Women''s Size Chart', ?)", [
      defaultSizeChart,
    ]);
  }
  console.log('✅ Default size chart created');

  // ── Homepage Sections ──
  const homepageSections = [
    { type: 'hero_banner', title: 'Hero Banner', sort: 1 },
    { type: 'category_grid', title: 'Shop by Category', sort: 2 },
    { type: 'new_arrivals', title: 'New Arrivals', sort: 3 },
    { type: 'flash_sale', title: 'Flash Sale', sort: 4 },
    { type: 'featured_products', title: 'Featured Products', sort: 5 },
    { type: 'collection_tiles', title: 'Collections', sort: 6 },
    { type: 'best_sellers', title: 'Best Sellers', sort: 7 },
    { type: 'product_tabs', title: 'Browse by Category', subtitle: 'Explore our collections', sort: 8 },
    { type: 'brand_strip', title: 'Our Brands', sort: 9 },
    { type: 'editorial', title: 'Our Story', sort: 10 },
    { type: 'why_choose_us', title: 'Why Choose Us', sort: 11 },
    { type: 'gallery', title: 'Nobo Fashion', subtitle: 'At the counter', sort: 12 },
    { type: 'newsletter', title: 'New pieces, once a week', sort: 13 },
  ];

  for (const s of homepageSections) {
    const existing = get('SELECT id FROM homepage_sections WHERE section_type = ?', [s.type]);
    if (!existing) {
      run(
        'INSERT INTO homepage_sections (section_type, title, subtitle, data, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [s.type, s.title, s.subtitle || null, '{}', s.sort]
      );
    }
  }
  console.log('✅ Homepage sections created');

  // ── Reset previous products if requested ──
  if (resetProducts) {
    console.log('🧹 Clearing old products to replace with new catalog...');
    run('DELETE FROM product_images');
    run('DELETE FROM product_variants');
    run('DELETE FROM size_charts WHERE product_id IS NOT NULL');
    run('DELETE FROM reviews');
    run('DELETE FROM products');
  }

  // ── Real Products with User Images and Multi-Image support ──
  const sampleProducts = [
    {
      name: 'Exclusive Batik Print Three Piece - Deep Maroon',
      slug: 'exclusive-batik-print-three-piece-deep-maroon',
      category_slug: '3-piece',
      sku: 'NOBO-BTK-01',
      price: 2650,
      sale_price: 2450,
      stock: 25,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 1,
      images: [
        { url: '/products/maroon-batik-three-piece.jpg', is_primary: 1, alt: 'Deep Maroon Handcrafted Batik Three Piece' },
      ],
      description: 'Exclusive handcrafted batik printed cotton three-piece suit with rich traditional border detailing and lightweight matching dupatta. Breathable, comfortable, and tailored from 100% pure premium cotton.',
      variants: [
        { size: 'Free', price: 2450, stock: 10 },
        { size: 'M', price: 2450, stock: 5 },
        { size: 'L', price: 2450, stock: 5 },
        { size: 'XL', price: 2450, stock: 5 },
      ],
    },
    {
      name: 'Luxury Floral Cotton Three Piece - Sky Blue',
      slug: 'luxury-floral-cotton-three-piece-sky-blue',
      category_slug: '3-piece',
      sku: 'NOBO-FLR-02',
      price: 2850,
      sale_price: 2650,
      stock: 30,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 0,
      images: [
        { url: '/products/sky-blue-embroidered-three-piece.jpg', is_primary: 1, alt: 'Sky Blue Floral Embroidered Three Piece' },
        { url: '/products/rust-orange-embroidered-three-piece.jpg', is_primary: 0, alt: 'Floral Three Piece - Alternate Colorway View' },
      ],
      description: 'Elegant sky blue all-over floral motif three-piece suit featuring an intricately embroidered neckline, stylish sleeve cuffs, and an artistic printed organza-blend dupatta.',
      variants: [
        { size: '38', price: 2650, stock: 6 },
        { size: '40', price: 2650, stock: 8 },
        { size: '42', price: 2650, stock: 8 },
        { size: '44', price: 2650, stock: 4 },
        { size: '46', price: 2650, stock: 4 },
      ],
    },
    {
      name: 'Luxury Floral Cotton Three Piece - Rust Terracotta',
      slug: 'luxury-floral-cotton-three-piece-rust-terracotta',
      category_slug: '3-piece',
      sku: 'NOBO-FLR-03',
      price: 2850,
      sale_price: 2650,
      stock: 25,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 1,
      images: [
        { url: '/products/rust-orange-embroidered-three-piece.jpg', is_primary: 1, alt: 'Rust Terracotta Floral Embroidered Three Piece' },
        { url: '/products/sky-blue-embroidered-three-piece.jpg', is_primary: 0, alt: 'Floral Three Piece - Alternate Colorway View' },
      ],
      description: 'Warm rust terracotta printed three-piece with exquisite front buttoned embroidery, breathable lawn cotton fabric, and an artistically coordinated floral dupatta.',
      variants: [
        { size: '38', price: 2650, stock: 5 },
        { size: '40', price: 2650, stock: 6 },
        { size: '42', price: 2650, stock: 6 },
        { size: '44', price: 2650, stock: 4 },
        { size: '46', price: 2650, stock: 4 },
      ],
    },
    {
      name: 'Designer Polka Dot & Floral Three Piece - Off-White',
      slug: 'designer-polka-dot-floral-three-piece-off-white',
      category_slug: '3-piece',
      sku: 'NOBO-PLF-04',
      price: 2950,
      sale_price: 2750,
      stock: 20,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 1,
      images: [
        { url: '/products/offwhite-polka-floral-three-piece.jpg', is_primary: 1, alt: 'Off-White Designer Polka Dot & Floral Three Piece' },
      ],
      description: 'Modern chic off-white three-piece ensemble adorned with vibrant floral artwork, contrasting monochrome polka dot dupatta, and comfortable tailored silhouette.',
      variants: [
        { size: 'Free', price: 2750, stock: 8 },
        { size: 'M', price: 2750, stock: 4 },
        { size: 'L', price: 2750, stock: 4 },
        { size: 'XL', price: 2750, stock: 4 },
      ],
    },
    {
      name: 'Traditional Bandhani Printed Three Piece - Lime Olive',
      slug: 'traditional-bandhani-printed-three-piece-lime-olive',
      category_slug: '3-piece',
      sku: 'NOBO-BND-05',
      price: 2550,
      sale_price: 2350,
      stock: 20,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 0,
      images: [
        { url: '/products/olive-lime-bandhani-three-piece.jpg', is_primary: 1, alt: 'Lime Olive Traditional Bandhani Printed Three Piece' },
      ],
      description: 'Festive lime olive green three-piece adorned with traditional bandhani tie-dye geometric patterns, neck embroidery, and a bright multicolor patterned dupatta.',
      variants: [
        { size: 'Free', price: 2350, stock: 8 },
        { size: 'M', price: 2350, stock: 4 },
        { size: 'L', price: 2350, stock: 4 },
        { size: 'XL', price: 2350, stock: 4 },
      ],
    },
  ];

  for (const p of sampleProducts) {
    const cat = get('SELECT id FROM categories WHERE slug = ?', [p.category_slug]);
    const catId = cat ? cat.id : null;

    const existing = get('SELECT id FROM products WHERE slug = ?', [p.slug]);
    if (!existing) {
      const prodId = insert(
        `INSERT INTO products (name, slug, description, category_id, sku, price, sale_price, stock, is_featured, is_new_arrival, is_best_seller, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          p.name,
          p.slug,
          p.description,
          catId,
          p.sku,
          p.price,
          p.sale_price || null,
          p.stock,
          p.is_featured || 0,
          p.is_new_arrival || 0,
          p.is_best_seller || 0,
        ]
      );

      // Support array of images
      const prodImages = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : (p.image ? [{ url: p.image, is_primary: 1, alt: p.name }] : []);

      for (let i = 0; i < prodImages.length; i++) {
        const img = prodImages[i];
        const imgUrl = typeof img === 'string' ? img : img.url;
        const imgAlt = (typeof img === 'object' && img.alt) ? img.alt : p.name;
        const isPrimary = (typeof img === 'object' && img.is_primary !== undefined) ? (img.is_primary ? 1 : 0) : (i === 0 ? 1 : 0);
        run('INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)', [
          prodId,
          imgUrl,
          imgAlt,
          i,
          isPrimary,
        ]);
      }

      if (p.variants && p.variants.length > 0) {
        for (let i = 0; i < p.variants.length; i++) {
          const v = p.variants[i];
          run(
            `INSERT INTO product_variants (product_id, size_name, color_name, sku, price, stock, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              prodId,
              v.size || 'Free',
              v.color || null,
              `${p.sku}-${v.size || 'FREE'}${v.color ? '-' + v.color : ''}`,
              v.price || p.sale_price || p.price,
              v.stock || 10,
              i,
            ]
          );
        }
      }
    }
  }
  console.log('✅ Real reference products seeded with size & color variants');

  saveImmediately();

  console.log('\n══════════════════════════════════════════════');
  console.log('  🎉 Database seeded successfully with real reference data!');
  console.log('══════════════════════════════════════════════\n');
}

module.exports = { seed };

if (require.main === module) {
  seed({ resetProducts: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
