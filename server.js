import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();

const SHOP = "d0d784-3a.myshopify.com";
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const APP_SECRET = process.env.SHOPIFY_APP_SECRET;

function verifyShopifyRequest(query) {
  const { signature, ...params } = query;

  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("");

  const digest = crypto
    .createHmac("sha256", APP_SECRET)
    .update(message)
    .digest("hex");

  return digest === signature;
}

app.get("/wch-customer", async (req, res) => {
  try {
    if (!verifyShopifyRequest(req.query)) {
      return res.status(403).json({ error: "Invalid signature" });
    }

    const customerId = req.query.logged_in_customer_id;

    if (!customerId) {
      return res.json({ tags: [] });
    }

    const response = await fetch(
      `https://${SHOP}/admin/api/2024-04/customers/${customerId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": ADMIN_API_TOKEN
        }
      }
    );

    const data = await response.json();

    const tags = data.customer?.tags
      ? data.customer.tags.split(",").map(t => t.trim())
      : [];

    res.json({ tags });

  } catch (err) {
    console.error(err);
    res.status(500).json({ tags: [] });
  }
});

app.get("/", (req, res) => {
  res.send("WCH Stepper Proxy Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
