const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connect, getConnection, TABLE_NAMES } = require("./database");
const { registerAdmin, loginAdmin, verifyAdmin } = require("./admin");
require("dotenv").config();

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

connect();
const connection = getConnection();

app.get("/", (req, res) => {
  res.status(200).json({ status: "running" });
});

app.post("/admin/login", async (req, res) => {
  try {
    console.log("POST admin/login: started");
    const { email, password } = req.body;
    const { data, status, error } = await loginAdmin(connection, email, password);
    console.log("POST admin/login: completed");
    res.status(status).json({ data, error });
  } catch (err) {
    console.error("POST admin/login: error --- ", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/admin/register", async (req, res) => {
  try {
    console.log("POST admin/register: started");
    const { email, password } = req.body;
    const { data, status, error } = await registerAdmin(connection, email, password);
    console.log("POST admin/register: completed");
    res.status(status).json({ data, error });
  } catch (err) {
    console.error("POST admin/register: error --- ", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/upload-photos", async (req, res) => {
  const { photos, admin_id, product_id } = req.body;

  if (!photos || !Array.isArray(photos) || photos.length === 0 || !admin_id || !product_id) {
    return res.status(400).send("Missing photos, admin_id, or product_id");
  }

  const sql = "INSERT INTO photos (image, admin_id, product_id) VALUES (?, ?, ?)";

  try {
    for (let photo of photos) {
      const base64Image = photo.split(";base64,").pop();
      const buffer = Buffer.from(base64Image, "base64");

      await new Promise((resolve, reject) => {
        connection.query(sql, [buffer, admin_id, product_id], (err) => {
          if (err) {
            console.error("DB insert error:", err);
            return reject(err);
          }
          resolve();
        });
      });
    }

    res.send("All photos linked to product saved successfully");
  } catch (error) {
    console.error("Photo insert error:", error);
    res.status(500).send("Failed to insert photos");
  }
});

app.get("/photo/:id", (req, res) => {
  console.log("server product id : ", req.params.id);
  const product_id = req.params.id;
  const sql = `SELECT image FROM photos WHERE product_id =${product_id}`;
  connection.query(sql, [req.params.id], (err, result) => {
    if (err || result.length === 0) return res.status(404).send("Not found");

    res.setHeader("Content-Type", "image/png");
    res.send(result[0].image);
  });
});

app.post("/add-product", (req, res) => {
  const { admin_id, name, category, weight, age_days, condition_text, recommendation } = req.body;

  if (
    !admin_id ||
    !name ||
    !category ||
    !weight ||
    !age_days ||
    !condition_text ||
    !recommendation
  ) {
    return res.status(400).json({ error: "Missing fields" });
  }

  let co2_units = 0;

  if (recommendation === "Reuse") co2_units = +weight * 0.5;
  else if (recommendation === "Repair") co2_units = +weight * 0.4;
  else if (recommendation === "Recycle") co2_units = +weight * 0.3;
  else co2_units = +weight * 1;

  const sql = `
    INSERT INTO products (admin_id, name, category, weight, age_days, condition_text, recommendation,co2_units)
    VALUES (?, ?, ?, ?, ?, ?, ?,?)
  `;
  connection.query(
    sql,
    [admin_id, name, category, weight, age_days, condition_text, recommendation, co2_units],
    (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }

      if (recommendation === "Recycle") {
        connection.query("UPDATE admin SET coins = coins + 100 WHERE id = ?", [admin_id], (e) => {
          if (e) console.error("Coin update error:", e);
        });
      }

      res.json({ message: "Product saved successfully", productId: result.insertId });
    }
  );
});

app.get("/admin-coins", (req, res) => {
  const adminId = req.query.admin_id;
  console.log("coins : ", adminId);
  if (!adminId) return res.status(400).json({ error: "admin_id required" });

  const sql = "SELECT coins FROM admin WHERE id = ?";
  connection.query(sql, [adminId], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    const coins = rows.length ? rows[0].coins : 0;
    res.json({ coins });
  });
});

app.get("/admin-co2", (req, res) => {
  const adminId = req.query.admin_id;
  if (!adminId) return res.status(400).json({ error: "admin_id required" });

  const sql = `SELECT COALESCE(SUM(co2_units), 0) AS total_co2 FROM products WHERE admin_id = ?`;

  connection.query(sql, [adminId], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const total = rows[0]?.total_co2 || 0;
    res.json({ total_co2: total });
  });
});

app.get("/products", (req, res) => {
  const admin_id = req.query.admin_id;
  if (!admin_id) return res.status(400).json({ error: "Missing admin_id" });

  const sql = `
    select * from products where admin_id=${admin_id}
  `;

  connection.query(sql, [admin_id], (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

app.delete("/product/:id", (req, res) => {
  const product_id = req.params.id;

  const deletePhotos = "DELETE FROM photos WHERE product_id = ?";
  connection.query(deletePhotos, [product_id], (err) => {
    if (err) {
      console.error("Photo delete error:", err);
      return res.status(500).json({ error: "Server error" });
    }

    const deleteProduct = "DELETE FROM products WHERE id = ?";
    connection.query(deleteProduct, [product_id], (err, result) => {
      if (err) {
        console.error("Product delete error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({ success: true });
    });
  });
});

const { GoogleGenerativeAI } = require("@google/generative-ai");
const gemini = new GoogleGenerativeAI(process.env.OPENAI_API_KEY).getGenerativeModel({
  model: "gemini-1.5-flash",
});

app.use(express.json({ limit: "20mb" })); // allow base‑64 photos

app.post("/predict-condition", async (req, res) => {
  const {
    name,
    category,
    weight,
    age_days,
    condition_text,
    photos = [], // optional array of data‑URL strings
  } = req.body;

  const prompt = `
You are an expert in reverse logistics.
Decide if the item should be **Reuse**, **Repair**, or **Recycle**.
Reply with ONE word only.`;

  const metaBlock = `
Returned product details:
• Name: ${name}
• Category: ${category}
• Weight: ${weight} kg
• Age: ${age_days} days
• Declared condition: ${condition_text}`;

  const imageParts = photos.slice(0, 3).map((url) => ({
    inlineData: {
      data: url.split(",")[1],
      mimeType: url.match(/^data:(.*?);/)?.[1] || "image/jpeg",
    },
  }));

  const userParts = [{ text: metaBlock }, ...imageParts];

  try {
    const result = await gemini.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "user", parts: userParts },
      ],
      generationConfig: { maxOutputTokens: 2 },
    });

    const reply = result.response.text().trim();
    console.log("respnse from gemini backend : ", reply);
    const label = ["Reuse", "Repair", "Recycle"].includes(reply) ? reply : "Recycle";

    res.json({ recommendation: label, confidence: 0.9 });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: "Prediction failed" });
  }
});

app.listen(port, () => {
  console.log(`app is listening on the port ${port}`);
});
