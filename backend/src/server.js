const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connect, getConnection, TABLE_NAMES } = require("./database");
const { registerAdmin, loginAdmin, verifyAdmin } = require("./admin");

const app = express();
const port = 8080;

// ✅ Increase request size limits here
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

connect();
const connection = getConnection();

// Routes
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
  const sql = "SELECT image FROM photos WHERE id = ?";
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

  const sql = `
    INSERT INTO products (admin_id, name, category, weight, age_days, condition_text, recommendation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  connection.query(
    sql,
    [admin_id, name, category, weight, age_days, condition_text, recommendation],
    (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }
      res.json({ message: "Product saved successfully", productId: result.insertId });
    }
  );
});

app.listen(port, () => {
  console.log(`app is listening on the port ${port}`);
});
