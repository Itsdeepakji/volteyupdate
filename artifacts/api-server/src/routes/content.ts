import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contentSectionsTable, pool } from "@workspace/db";

const router: IRouter = Router();

async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_sections (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (_) {}
}

ensureTable();

router.get("/content", async (_req, res) => {
  try {
    const rows = await db.select().from(contentSectionsTable);
    const map: Record<string, unknown> = {};
    for (const row of rows) map[row.key] = row.value;
    res.json(map);
  } catch {
    res.json({});
  }
});

router.get("/content/:key", async (req, res) => {
  try {
    const [row] = await db.select().from(contentSectionsTable).where(eq(contentSectionsTable.key, req.params.key));
    res.json(row?.value ?? null);
  } catch {
    res.json(null);
  }
});

router.get("/admin/content", async (_req, res) => {
  try {
    const rows = await db.select().from(contentSectionsTable);
    const map: Record<string, unknown> = {};
    for (const row of rows) map[row.key] = row.value;
    res.json(map);
  } catch {
    res.json({});
  }
});

/* Resolve a custom URL slug → locationCode by searching seo:country:* entries */
router.get("/content/resolve-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await pool.query<{ key: string }>(
      `SELECT key FROM content_sections WHERE key LIKE 'seo:country:%' AND value->>'urlSlug' = $1 LIMIT 1`,
      [slug]
    );
    if (rows.rows.length) {
      const locationCode = rows.rows[0].key.replace("seo:country:", "");
      res.json({ locationCode });
    } else {
      res.json(null);
    }
  } catch {
    res.json(null);
  }
});

router.put("/admin/content/:key", async (req, res) => {
  const { key } = req.params;
  const value = req.body as Record<string, unknown>;
  try {
    const [row] = await db
      .insert(contentSectionsTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: contentSectionsTable.key, set: { value, updatedAt: new Date() } })
      .returning();
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
