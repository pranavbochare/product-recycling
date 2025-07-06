const express = require("express");
const bodyParser = require("body-parser");

const cors = require("cors");
const { connect, getConnection, TABLE_NAMES } = require("./database");
const { registerAdmin, loginAdmin, verifyAdmin } = require("./admin");

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

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

app.listen(port, () => {
  console.log(`app is listening on the port ${port}`);
});
