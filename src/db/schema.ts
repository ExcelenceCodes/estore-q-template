import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/* ============================================================
   CUSTOMERS
   ============================================================ */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    emailVerified: boolean("email_verified").notNull().default(false),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    defaultShippingAddress: jsonb("default_shipping_address"),
    defaultBillingAddress: jsonb("default_billing_address"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("idx_customers_email").on(t.email),
  }),
);

export const customerVerifications = pgTable(
  "customer_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["email", "phone"] }).notNull(),
    value: text("value").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    customerIdx: index("idx_customer_verifications_customer").on(t.customerId),
  }),
);

export const addressVerifications = pgTable(
  "address_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    addressType: text("address_type", { enum: ["shipping", "billing"] }).notNull(),
    addressJson: jsonb("address_json").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    customerIdx: index("idx_address_verifications_customer").on(t.customerId),
  }),
);

/* ============================================================
   CATALOG
   ============================================================ */

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoId: uuid("logo_id").references(() => media.id, { onDelete: "set null" }),
    description: text("description"),
    website: text("website"),
    active: boolean("active").notNull().default(true),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("idx_brands_slug").on(t.slug).where(t.active.equals(true)),
    orderIdx: index("idx_brands_order").on(t.active, t.orderIndex).where(t.active.equals(true)),
  }),
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id").references(() => productCategories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
    orderIndex: integer("order_index").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    parentIdx: index("idx_categories_parent")
      .on(t.parentId, t.active, t.orderIndex)
      .where(t.active.equals(true)),
    slugIdx: index("idx_categories_slug").on(t.slug).where(t.active.equals(true)),
  }),
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    sku: text("sku"),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    description: text("description").notNull().default(""),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
    cost: numeric("cost", { precision: 10, scale: 2 }),
    weight: numeric("weight"),
    dimensions: jsonb("dimensions"),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusPublishedIdx: index("idx_products_status_published")
      .on(t.status, t.publishedAt)
      .where(t.status.equals("published")),
    featuredIdx: index("idx_products_featured")
      .on(t.featured, t.status)
      .where(t.featured.equals(true).and(t.status.equals("published"))),
    brandIdx: index("idx_products_brand")
      .on(t.brandId, t.status)
      .where(t.status.equals("published")),
    slugIdx: index("idx_products_slug").on(t.slug),
  }),
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id").references(() => media.id, { onDelete: "set null" }),
    imageUrl: text("image_url"),
    altText: text("alt_text").notNull().default(""),
    orderIndex: integer("order_index").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    productOrderIdx: index("idx_product_images_product_order").on(t.productId, t.orderIndex),
    productOrderUnique: unique("uq_product_images_product_order").on(t.productId, t.orderIndex),
  }),
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    sku: text("sku"),
    price: numeric("price", { precision: 10, scale: 2 }),
    inventoryQuantity: integer("inventory_quantity").notNull().default(0),
    weight: numeric("weight"),
    dimensions: jsonb("dimensions"),
    options: jsonb("options").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index("idx_product_variants_product").on(t.productId),
  }),
);

export const productSpecDefinitions = pgTable("product_spec_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["text", "textarea", "number", "select", "multiselect", "date", "boolean"],
  }).notNull(),
  options: jsonb("options"),
  unit: text("unit"),
  active: boolean("active").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productSpecValues = pgTable(
  "product_spec_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    specDefinitionId: uuid("spec_definition_id")
      .notNull()
      .references(() => productSpecDefinitions.id, { onDelete: "cascade" }),
    valueText: text("value_text"),
    valueNumber: numeric("value_number"),
    valueDate: timestamp("value_date"),
    valueBoolean: boolean("value_boolean"),
    valueJson: jsonb("value_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index("idx_product_spec_values_product").on(t.productId),
    defNumberIdx: index("idx_product_spec_values_def_number")
      .on(t.specDefinitionId)
      .where(t.valueNumber.isNotNull()),
    defTextIdx: index("idx_product_spec_values_def_text")
      .on(t.specDefinitionId)
      .where(t.valueText.isNotNull()),
    productDefUnique: unique("uq_product_spec_product_def").on(t.productId, t.specDefinitionId),
  }),
);

/* ============================================================
   ENGAGEMENT
   ============================================================ */

export const productLikes = pgTable(
  "product_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index("idx_product_likes_product").on(t.productId),
    customerUnique: unique("uq_product_likes_customer")
      .on(t.productId)
      .where(t.customerId.isNotNull()),
    sessionUnique: unique("uq_product_likes_session")
      .on(t.productId)
      .where(t.sessionId.isNotNull()),
  }),
);

export const productViews = pgTable(
  "product_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    productTimeIdx: index("idx_product_views_product_time").on(t.productId, t.viewedAt),
    sessionIdx: index("idx_product_views_session").on(t.sessionId),
  }),
);

/* ============================================================
   CART
   ============================================================ */

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id"),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("idx_carts_session").on(t.sessionId),
    customerIdx: index("idx_carts_customer").on(t.customerId).where(t.customerId.isNotNull()),
    customerUnique: unique("uq_carts_customer").on(t.customerId).where(t.customerId.isNotNull()),
  }),
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    cartIdx: index("idx_cart_items_cart").on(t.cartId),
    cartProductUnique: unique("uq_cart_items_cart_product_variant").on(
      t.cartId,
      t.productId,
      t.variantId,
    ),
  }),
);

/* ============================================================
   SHIPPING + ORDERS
   ============================================================ */

export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  freeThreshold: numeric("free_threshold", { precision: 10, scale: 2 }),
  active: boolean("active").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    guestEmail: text("guest_email"),
    guestName: text("guest_name"),
    status: text("status", { enum: ["pending", "processing", "shipped", "delivered", "cancelled"] })
      .notNull()
      .default("pending"),
    paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "refunded"] })
      .notNull()
      .default("pending"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default(0),
    tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default(0),
    shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull().default(0),
    discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default(0),
    total: numeric("total", { precision: 10, scale: 2 }).notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    shippingMethodId: uuid("shipping_method_id").references(() => shippingMethods.id, {
      onDelete: "set null",
    }),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    carrier: text("carrier"),
    shippingAddress: jsonb("shipping_address").notNull(),
    billingAddress: jsonb("billing_address").notNull(),
    notes: text("notes"),
    placedAt: timestamp("placed_at").notNull().defaultNow(),
    fulfilledAt: timestamp("fulfilled_at"),
    cancelledAt: timestamp("cancelled_at"),
  },
  (t) => ({
    numberIdx: index("idx_orders_number").on(t.orderNumber),
    customerPlacedIdx: index("idx_orders_customer_placed")
      .on(t.customerId, t.placedAt)
      .where(t.customerId.isNotNull()),
    statusIdx: index("idx_orders_status").on(t.status, t.placedAt),
  }),
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    sku: text("sku"),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => ({
    orderIdx: index("idx_order_items_order").on(t.orderId),
  }),
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    orderTimeIdx: index("idx_order_status_history_order_time").on(t.orderId, t.createdAt),
  }),
);

/* ============================================================
   MARKETING
   ============================================================ */

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
    linkUrl: text("link_url").notNull().default(""),
    linkLabel: text("link_label").notNull().default("Shop Now"),
    active: boolean("active").notNull().default(true),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    activeOrderIdx: index("idx_promotions_active_order")
      .on(t.active, t.orderIndex)
      .where(t.active.equals(true)),
  }),
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    minPurchase: numeric("min_purchase", { precision: 10, scale: 2 }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    startsAt: timestamp("starts_at").notNull().defaultNow(),
    endsAt: timestamp("ends_at"),
  },
  (t) => ({
    codeIdx: index("idx_coupons_code").on(t.code),
  }),
);

/* ============================================================
   LEGACY TABLES (kept for reference)
   ============================================================ */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  bytes: text("bytes").notNull(),
  byteSize: integer("byte_size").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteUsers = pgTable("site_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull().default("editor"),
  photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSessions = pgTable("site_sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => siteUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""),
  icon: text("icon").notNull().default("briefcase"),
  imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
  highlights: jsonb("highlights").notNull().default([]),
  orderIndex: integer("order_index").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  coverId: uuid("cover_id").references(() => media.id, { onDelete: "set null" }),
  coverUrl: text("cover_url"),
  tags: text("tags").notNull().default([]),
  author: text("author").notNull().default("Editorial Team"),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const galleryPhotos = pgTable("gallery_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  mediaId: uuid("media_id").references(() => media.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  caption: text("caption").notNull().default(""),
  category: text("category").notNull().default("General"),
  width: integer("width"),
  height: integer("height"),
  postedOn: timestamp("posted_on").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  bio: text("bio").notNull().default(""),
  photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
  photoUrl: text("photo_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull().default(""),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const socials = pgTable("socials", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull().unique(),
  url: text("url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  icon: text("icon").notNull().default("link"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ============================================================
   ZOD SCHEMAS
   ============================================================ */

export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);

export const insertBrandSchema = createInsertSchema(brands);
export const selectBrandSchema = createSelectSchema(brands);

export const insertProductCategorySchema = createInsertSchema(productCategories);
export const selectProductCategorySchema = createSelectSchema(productCategories);

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertProductImageSchema = createInsertSchema(productImages);
export const selectProductImageSchema = createSelectSchema(productImages);

export const insertProductVariantSchema = createInsertSchema(productVariants);
export const selectProductVariantSchema = createSelectSchema(productVariants);

export const insertProductSpecDefinitionSchema = createInsertSchema(productSpecDefinitions);
export const selectProductSpecDefinitionSchema = createSelectSchema(productSpecDefinitions);

export const insertProductSpecValueSchema = createInsertSchema(productSpecValues);
export const selectProductSpecValueSchema = createSelectSchema(productSpecValues);

export const insertProductLikeSchema = createInsertSchema(productLikes);
export const selectProductLikeSchema = createSelectSchema(productLikes);

export const insertProductViewSchema = createInsertSchema(productViews);
export const selectProductViewSchema = createSelectSchema(productViews);

export const insertCartSchema = createInsertSchema(carts);
export const selectCartSchema = createSelectSchema(carts);

export const insertCartItemSchema = createInsertSchema(cartItems);
export const selectCartItemSchema = createSelectSchema(cartItems);

export const insertShippingMethodSchema = createInsertSchema(shippingMethods);
export const selectShippingMethodSchema = createSelectSchema(shippingMethods);

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory);
export const selectOrderStatusHistorySchema = createSelectSchema(orderStatusHistory);

export const insertPromotionSchema = createInsertSchema(promotions);
export const selectPromotionSchema = createSelectSchema(promotions);

export const insertCouponSchema = createInsertSchema(coupons);
export const selectCouponSchema = createSelectSchema(coupons);
