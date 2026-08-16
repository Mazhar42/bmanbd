/**
 * One-off migration: import catalog/account data from the legacy Laravel/MySQL
 * "fastitbd_bman_db" dump into this app's MongoDB collections.
 *
 * Scope (per plan approved 2026-08-14): categories, products, product variants
 * (SKUs, with stock computed from the purchase/sale ledger), and staff users.
 * Purchases, suppliers, banking/ledger, expenses, used-goods, invoices/orders,
 * and courier data are intentionally NOT migrated - there is no equivalent
 * feature in this app for them.
 *
 * Reads from a MySQL instance (point LEGACY_MYSQL_* env vars at it - typically
 * a throwaway container the dump was loaded into) and writes into MongoDB via
 * the app's own Mongoose models, so schema validation/hooks still apply.
 *
 * Idempotent: every entity is found-or-created by a natural key, so re-running
 * is safe and never overwrites/deletes existing documents.
 *
 * Usage:
 *   node src/utils/migrateLegacyData.js --dry-run   # report only, no writes
 *   node src/utils/migrateLegacyData.js              # live run
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

const DRY_RUN = process.argv.includes("--dry-run");

const MYSQL_CONFIG = {
  host: process.env.LEGACY_MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.LEGACY_MYSQL_PORT || 3307),
  user: process.env.LEGACY_MYSQL_USER || "root",
  password: process.env.LEGACY_MYSQL_PASSWORD || "migrate123",
  database: process.env.LEGACY_MYSQL_DATABASE || "legacy",
};

const ROLE_SLUG_TO_APP_ROLE = {
  admin: "admin",
  superadmin: "admin",
  "sales-man": "staff",
};

function skuToken(str) {
  return String(str)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function newSummarySection() {
  return { created: [], skipped: [], errors: [] };
}

async function migrateUsers(conn, summary) {
  const [roles] = await conn.execute("SELECT id, slug FROM roles");
  const roleSlugById = new Map(roles.map((r) => [r.id, r.slug]));

  const [legacyUsers] = await conn.execute(
    "SELECT id, role_id, name, email, phone, address, password, status FROM users",
  );

  for (const u of legacyUsers) {
    const email = String(u.email).toLowerCase().trim();
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        summary.users.skipped.push({ legacyId: u.id, email, reason: "already exists" });
        continue;
      }

      const role = ROLE_SLUG_TO_APP_ROLE[roleSlugById.get(u.role_id)] || "staff";

      if (DRY_RUN) {
        summary.users.created.push({ legacyId: u.id, email, role, isActive: u.status === 1 });
        continue;
      }

      const created = await User.create({
        name: u.name,
        email,
        role,
        phone: u.phone || undefined,
        address: u.address ? { street: u.address } : undefined,
        isActive: u.status === 1,
        authProvider: "local",
      });
      // Legacy passwords are already bcrypt hashes ($2y$...), compatible with
      // bcryptjs.compare - update the field directly (query middleware, not
      // the pre("save") hook) so it isn't re-hashed.
      await User.updateOne({ _id: created._id }, { $set: { password: u.password } });

      summary.users.created.push({ legacyId: u.id, email, role, mongoId: created._id.toString() });
    } catch (err) {
      summary.users.errors.push({ legacyId: u.id, email, error: err.message });
    }
  }
}

async function migrateCategories(conn, summary) {
  const [rows] = await conn.execute("SELECT id, name FROM categories");
  const idMap = new Map();

  for (const c of rows) {
    const name = String(c.name).trim();
    try {
      const existing = await Category.findOne({ name });
      if (existing) {
        idMap.set(c.id, existing._id);
        summary.categories.skipped.push({ legacyId: c.id, name, reason: "already exists" });
        continue;
      }

      if (DRY_RUN) {
        idMap.set(c.id, `DRY_RUN_CATEGORY_${c.id}`);
        summary.categories.created.push({ legacyId: c.id, name });
        continue;
      }

      const created = await Category.create({ name });
      idMap.set(c.id, created._id);
      summary.categories.created.push({ legacyId: c.id, name, mongoId: created._id.toString() });
    } catch (err) {
      summary.categories.errors.push({ legacyId: c.id, name, error: err.message });
    }
  }

  return idMap;
}

async function migrateProducts(conn, summary, categoryIdMap) {
  const [brandRows] = await conn.execute("SELECT id, name FROM brands");
  const brandNameById = new Map(brandRows.map((b) => [b.id, b.name]));

  const [rows] = await conn.execute(
    "SELECT id, name, description, category_id, brand_id, selling_price, status FROM products",
  );

  const idMap = new Map();
  const priceByLegacyId = new Map();

  for (const p of rows) {
    const name = String(p.name).trim();
    priceByLegacyId.set(p.id, Number(p.selling_price));
    try {
      const categoryId = categoryIdMap.get(p.category_id);
      if (!categoryId) {
        summary.products.errors.push({
          legacyId: p.id,
          name,
          error: `no mapped category for legacy category_id ${p.category_id}`,
        });
        continue;
      }

      const existing = await Product.findOne({ name });
      if (existing) {
        idMap.set(p.id, existing._id);
        summary.products.skipped.push({ legacyId: p.id, name, reason: "already exists" });
        continue;
      }

      const brand = brandNameById.get(p.brand_id) || "BMAN";
      const status = p.status === "1" ? "active" : "archived";

      if (DRY_RUN) {
        idMap.set(p.id, `DRY_RUN_PRODUCT_${p.id}`);
        summary.products.created.push({ legacyId: p.id, name, brand, status, price: priceByLegacyId.get(p.id) });
        continue;
      }

      const created = await Product.create({
        name,
        description: p.description || undefined,
        category: categoryId,
        brand,
        status,
      });
      idMap.set(p.id, created._id);
      summary.products.created.push({ legacyId: p.id, name, mongoId: created._id.toString() });
    } catch (err) {
      summary.products.errors.push({ legacyId: p.id, name, error: err.message });
    }
  }

  return { idMap, priceByLegacyId };
}

async function migrateVariants(conn, summary, productIdMap, priceByLegacyId) {
  const [sizeRows] = await conn.execute("SELECT id, size FROM product_sizes");
  const sizeById = new Map(sizeRows.map((s) => [s.id, s.size]));

  const [colorRows] = await conn.execute("SELECT id, color FROM product_colors");
  const colorById = new Map(colorRows.map((c) => [c.id, c.color]));

  const [productBarcodeRows] = await conn.execute("SELECT id, barcode FROM products");
  const barcodeByLegacyProductId = new Map(productBarcodeRows.map((p) => [p.id, p.barcode]));

  // Stock is not stored per-variant in the legacy schema - it's implied by the
  // purchase/sale ledger. Sum purchased qty minus sold qty per variation,
  // converting via each product's unit (all "pcs"/factor 1 in this dataset,
  // but computed generically for correctness).
  const [purchasedRows] = await conn.execute(`
    SELECT pi.product_variation_id AS pvid, SUM(pi.main_qty * COALESCE(u.related_value, 1)) AS qty
    FROM purchase_items pi
    JOIN product_variations pv ON pv.id = pi.product_variation_id
    JOIN products p ON p.id = pv.product_id
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE pi.product_variation_id IS NOT NULL
    GROUP BY pi.product_variation_id
  `);
  const purchasedByPV = new Map(purchasedRows.map((r) => [r.pvid, Number(r.qty)]));

  const [soldRows] = await conn.execute(`
    SELECT ii.product_variation_id AS pvid, SUM(ii.main_qty * COALESCE(u.related_value, 1)) AS qty
    FROM invoice_items ii
    JOIN product_variations pv ON pv.id = ii.product_variation_id
    JOIN products p ON p.id = pv.product_id
    LEFT JOIN units u ON u.id = p.unit_id
    WHERE ii.product_variation_id IS NOT NULL
    GROUP BY ii.product_variation_id
  `);
  const soldByPV = new Map(soldRows.map((r) => [r.pvid, Number(r.qty)]));

  const [pvRows] = await conn.execute("SELECT id, product_id, size_id, color_id FROM product_variations");

  const usedSkus = new Set(DRY_RUN ? [] : (await ProductVariant.find({}, "sku")).map((v) => v.sku));

  for (const pv of pvRows) {
    try {
      const productId = productIdMap.get(pv.product_id);
      if (!productId) {
        summary.variants.skipped.push({
          legacyId: pv.id,
          reason: `parent product ${pv.product_id} not migrated (orphaned legacy row)`,
        });
        continue;
      }

      const size = sizeById.get(pv.size_id) || "One Size";
      const color = colorById.get(pv.color_id) || "Default";
      const barcode = barcodeByLegacyProductId.get(pv.product_id) || `P${pv.product_id}`;

      let baseSku = skuToken(`${barcode}-${size}-${color}`);
      let sku = baseSku;
      let n = 2;
      while (usedSkus.has(sku)) {
        sku = `${baseSku}-${pv.id}${n > 2 ? `-${n}` : ""}`;
        n++;
      }
      usedSkus.add(sku);

      const price = priceByLegacyId.get(pv.product_id);
      if (price == null || Number.isNaN(price)) {
        summary.variants.errors.push({ legacyId: pv.id, error: `no price found for parent product ${pv.product_id}` });
        continue;
      }

      const purchasedQty = purchasedByPV.get(pv.id) || 0;
      const soldQty = soldByPV.get(pv.id) || 0;
      let stock = purchasedQty - soldQty;
      let stockFlag;
      if (stock < 0) {
        stockFlag = `negative computed stock (${stock}), clamped to 0`;
        stock = 0;
      }

      if (DRY_RUN) {
        summary.variants.created.push({ legacyId: pv.id, sku, size, color, price, stock, flag: stockFlag });
        continue;
      }

      const created = await ProductVariant.create({
        product: productId,
        size,
        color,
        sku,
        price,
        stock,
        isActive: true,
      });
      summary.variants.created.push({
        legacyId: pv.id,
        sku,
        mongoId: created._id.toString(),
        stock,
        flag: stockFlag,
      });
    } catch (err) {
      summary.variants.errors.push({ legacyId: pv.id, error: err.message });
    }
  }
}

async function main() {
  console.log(`\n=== Legacy data migration ${DRY_RUN ? "(DRY RUN - no writes)" : "(LIVE)"} ===\n`);

  const summary = {
    users: newSummarySection(),
    categories: newSummarySection(),
    products: newSummarySection(),
    variants: newSummarySection(),
  };

  const conn = await mysql.createConnection(MYSQL_CONFIG);
  await connectDB();

  await migrateUsers(conn, summary);
  const categoryIdMap = await migrateCategories(conn, summary);
  const { idMap: productIdMap, priceByLegacyId } = await migrateProducts(conn, summary, categoryIdMap);
  await migrateVariants(conn, summary, productIdMap, priceByLegacyId);

  await conn.end();

  for (const [entity, s] of Object.entries(summary)) {
    console.log(`-- ${entity}: created=${s.created.length} skipped=${s.skipped.length} errors=${s.errors.length}`);
    if (s.errors.length) console.log(JSON.stringify(s.errors, null, 2));
  }

  const outFile = path.join(__dirname, "..", "..", `migration-summary${DRY_RUN ? "-dry-run" : ""}.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log(`\nFull summary written to ${outFile}`);

  await mongoose.connection.close();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
