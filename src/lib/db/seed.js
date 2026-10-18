// ============================================================================
// NOBO FASHION — Database Seed Script
// Run: node src/lib/db/seed.js
// ============================================================================
const bcrypt = require('bcryptjs');
const { initDatabase, getDb, run, insert, get, all, exec, saveImmediately } = require('./index');
const { SCHEMA } = require('./schema');

async function seed() {
  console.log('🌱 Initializing Nobo Fashion database...\n');
  await initDatabase();

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
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@priyocollection.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  const existingAdmin = get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    run(
      `INSERT INTO users (name, email, phone, password_hash, role_id, user_type, status)
       VALUES (?, ?, ?, ?, ?, 'admin', 'active')`,
      ['Admin', adminEmail, '09638044440', hashedPassword, superAdminRole ? superAdminRole.id : null]
    );
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  // ── Categories (from existing Nobo Fashion site) ──
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
    store_phone: '09638-044440, 09639-774962',
    store_phone_complaints: '01800033220',
    store_email: 'info@priyocollectionbd.com',
    store_address:
      'Shop # 6, Basement, Uttara Square Shopping Mall, Sonargaon Janapath, Sector 13, Uttara, Dhaka',
    store_whatsapp: '8801800033223',
    store_currency: '৳',
    store_currency_code: 'BDT',
    store_logo: '/logo.jpg',
    store_favicon: '/favicon.png',
    delivery_dhaka: '80',
    delivery_outside_dhaka: '150',
    free_delivery_threshold: '0',
    order_prefix: 'PC',
    invoice_prefix: 'INV-PC',
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

  // Seed sample real products from the reference site so the storefront is immediately rich and alive
  const sampleProducts = [
    {
      name: 'Pakistani (Bin Hameed Inspired)',
      slug: 'pakistani-bin-hameed-inspired',
      category_slug: '3-piece',
      sku: 'PRY-PAK4',
      price: 4200,
      stock: 15,
      is_featured: 1,
      is_new_arrival: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PAK4.jpg?v=1785083021',
      description: 'Authentic Pakistani Bin Hameed inspired luxury 3-piece suit with intricate embroidery and premium fabric.',
      variants: [{ size: 'Free', price: 4200, stock: 15 }],
    },
    {
      name: 'Pakistani Gharara',
      slug: 'pakistani-gharara',
      category_slug: '3-piece',
      sku: 'PRY-PAK5',
      price: 6200,
      stock: 24,
      is_featured: 1,
      is_best_seller: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PAK5.jpg?v=1785083021',
      description: 'Stunning Pakistani Gharara traditional formal outfit. Hand-finished details, rich color and magnificent flair.',
      variants: [
        { size: 'S', price: 6200, stock: 8 },
        { size: 'M', price: 6200, stock: 10 },
        { size: 'L', price: 6200, stock: 6 },
      ],
    },
    {
      name: 'Agha Noor (Pakistani 2 Pieces)',
      slug: 'agha-noor-pakistani-2-pieces',
      category_slug: 'co-ord-2-piece',
      sku: 'PRY-PAK3',
      price: 3900,
      stock: 55,
      is_featured: 1,
      is_new_arrival: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PAK3.jpg?v=1785083021',
      description: 'Agha Noor style Pakistani 2-piece ready-to-wear kurta and trouser combination in breathable premium lawn fabric.',
      variants: [
        { size: '38', price: 3900, stock: 5 },
        { size: '40', price: 3900, stock: 5 },
        { size: '42', price: 3900, stock: 5 },
        { size: '44', price: 3900, stock: 5 },
        { size: '46', price: 3900, stock: 5 },
        { size: '48', price: 3900, stock: 5 },
        { size: '50', price: 3900, stock: 5 },
        { size: '52', price: 3900, stock: 5 },
        { size: 'S', price: 3900, stock: 5 },
        { size: 'M', price: 3900, stock: 5 },
        { size: 'L', price: 3900, stock: 5 },
      ],
    },
    {
      name: 'Patabahar Co-Ords',
      slug: 'patabahar-co-ords',
      category_slug: 'co-ord-2-piece',
      sku: 'PRY-PB36L1',
      price: 1250,
      stock: 30,
      is_best_seller: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PB36L1.jpg?v=1785083021',
      description: 'Trendy and comfortable Patabahar printed 2-piece daily co-ord set for women.',
      variants: [{ size: 'Free', price: 1250, stock: 30 }],
    },
    {
      name: 'Blue Co-Ords',
      slug: 'blue-co-ords',
      category_slug: 'co-ord-2-piece',
      sku: 'PRY-PD001',
      price: 1450,
      stock: 40,
      is_new_arrival: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PD001.jpg?v=1785083021',
      description: 'Elegant royal blue co-ord set crafted with premium cotton for comfortable daylong wear.',
      variants: [
        { size: '38', price: 1450, stock: 5 },
        { size: '40', price: 1450, stock: 5 },
        { size: '42', price: 1450, stock: 5 },
        { size: '44', price: 1450, stock: 5 },
        { size: '46', price: 1450, stock: 5 },
        { size: '48', price: 1450, stock: 5 },
        { size: '50', price: 1450, stock: 5 },
        { size: '52', price: 1450, stock: 5 },
      ],
    },
    {
      name: 'White Co-Ords',
      slug: 'white-co-ords',
      category_slug: 'co-ord-2-piece',
      sku: 'PRY-PD002',
      price: 1450,
      stock: 40,
      is_featured: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PD002.jpg?v=1785083021',
      description: 'Pristine white co-ord set with minimalist embroidery and soft touch finish.',
      variants: [
        { size: '38', price: 1450, stock: 5 },
        { size: '40', price: 1450, stock: 5 },
        { size: '42', price: 1450, stock: 5 },
        { size: '44', price: 1450, stock: 5 },
        { size: '46', price: 1450, stock: 5 },
        { size: '48', price: 1450, stock: 5 },
        { size: '50', price: 1450, stock: 5 },
        { size: '52', price: 1450, stock: 5 },
      ],
    },
    {
      name: 'Beguni Co-Ords',
      slug: 'beguni-co-ords',
      category_slug: 'co-ord-2-piece',
      sku: 'PRY-PD003',
      price: 1450,
      stock: 40,
      is_new_arrival: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-PD003.jpg?v=1785083021',
      description: 'Deep violet beguni co-ord set that pairs effortlessly with ethnic and modern looks.',
      variants: [
        { size: '38', price: 1450, stock: 5 },
        { size: '40', price: 1450, stock: 5 },
        { size: '42', price: 1450, stock: 5 },
        { size: '44', price: 1450, stock: 5 },
        { size: '46', price: 1450, stock: 5 },
        { size: '48', price: 1450, stock: 5 },
        { size: '50', price: 1450, stock: 5 },
        { size: '52', price: 1450, stock: 5 },
      ],
    },
    {
      name: 'Priyo Made LP-01',
      slug: 'priyo-made-lp-01',
      category_slug: 'ladies-parts',
      sku: 'PRY-LP025B',
      price: 2500,
      stock: 30,
      is_featured: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-LP025B.jpg?v=1785083021',
      description: 'Nobo Fashion exclusive in-house curated luxury evening clutch bag.',
      variants: [
        { size: 'Free', color: 'Black', price: 2500, stock: 10 },
        { size: 'Free', color: 'Maroon', price: 2500, stock: 10 },
        { size: 'Free', color: 'Silver', price: 2500, stock: 10 },
      ],
    },
    {
      name: 'Ladies Parts Premium',
      slug: 'ladies-parts-premium',
      category_slug: 'ladies-parts',
      sku: 'PRY-LP026',
      price: 4990,
      stock: 12,
      is_best_seller: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-LP026.jpg?v=1785083021',
      description: 'Premium craftsmanship designer ladies bag with metallic accents and detachable strap.',
      variants: [{ size: 'Free', price: 4990, stock: 12 }],
    },
    {
      name: 'Super Premium Ladies Parts',
      slug: 'super-premium-ladies-parts',
      category_slug: 'ladies-parts',
      sku: 'PRY-LP028',
      price: 5990,
      stock: 10,
      is_featured: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-LP028.jpg?v=1785083021',
      description: 'Top-tier luxury structured purse featuring crystal embellishments and signature hardware.',
      variants: [{ size: 'Free', price: 5990, stock: 10 }],
    },
    {
      name: 'Butterfly Neck Piece',
      slug: 'butterfly-neck-piece',
      category_slug: 'jewellery',
      sku: 'PRY-J0001',
      price: 350,
      stock: 50,
      is_featured: 1,
      image: 'https://priyocollectionbd.com/images/products/PRY-J0001.jpg?v=1785083021',
      description: 'Delicate butterfly pendant necklace with fine chain and crystal accents.',
      variants: [{ size: 'Free', price: 350, stock: 50 }],
    },
    {
      name: 'Finger Ring 1',
      slug: 'finger-ring-1',
      category_slug: 'jewellery',
      sku: 'PRY-J0002',
      price: 150,
      stock: 60,
      image: 'https://priyocollectionbd.com/images/products/PRY-J0002.jpg?v=1785083021',
      description: 'Minimalist adjustable fashion finger ring with polished gold tone.',
      variants: [{ size: 'Free', price: 150, stock: 60 }],
    },
    {
      name: 'Finger Ring 2',
      slug: 'finger-ring-2',
      category_slug: 'jewellery',
      sku: 'PRY-J0003',
      price: 220,
      stock: 45,
      image: 'https://priyocollectionbd.com/images/products/PRY-J0003.jpg?v=1785083021',
      description: 'Dual band statement finger ring studded with simulated micro zircons.',
      variants: [{ size: 'Free', price: 220, stock: 45 }],
    },
    {
      name: 'Neck Piece 2',
      slug: 'neck-piece-2',
      category_slug: 'jewellery',
      sku: 'PRY-J0004',
      price: 300,
      stock: 35,
      image: 'https://priyocollectionbd.com/images/products/PRY-J0004.jpg?v=1785083021',
      description: 'Chic layered necklace with delicate pendant charms.',
      variants: [{ size: 'Free', price: 300, stock: 35 }],
    },
    {
      name: 'Haid Band 1',
      slug: 'haid-band-1',
      category_slug: 'jewellery',
      sku: 'PRY-J0006',
      price: 150,
      stock: 40,
      image: 'https://priyocollectionbd.com/images/products/PRY-J0006.jpg?v=1785083021',
      description: 'Velvet padded hair band with non-slip grip and subtle sheen.',
      variants: [{ size: 'Free', price: 150, stock: 40 }],
    },
  ];

  for (const p of sampleProducts) {
    const cat = get('SELECT id FROM categories WHERE slug = ?', [p.category_slug]);
    const catId = cat ? cat.id : null;

    const existing = get('SELECT id FROM products WHERE slug = ?', [p.slug]);
    if (!existing) {
      const prodId = insert(
        `INSERT INTO products (name, slug, description, category_id, sku, price, stock, is_featured, is_new_arrival, is_best_seller, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          p.name,
          p.slug,
          p.description,
          catId,
          p.sku,
          p.price,
          p.stock,
          p.is_featured || 0,
          p.is_new_arrival || 0,
          p.is_best_seller || 0,
        ]
      );

      if (p.image) {
        run('INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES (?, ?, ?, 0, 1)', [
          prodId,
          p.image,
          p.name,
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
              v.price || p.price,
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
  console.log(`  👤 Admin Email:    ${adminEmail}`);
  console.log(`  🔑 Admin Password: ${adminPassword}`);
  console.log('══════════════════════════════════════════════\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
