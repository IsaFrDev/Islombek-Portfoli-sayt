const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
app.use(express.json());

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, "db", "projects.json");
const MSG_PATH = path.join(ROOT, "db", "messages.json");
const SITE_PATH = path.join(ROOT, "db", "site.json");

const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";
const BOT_TOKEN = "8386006626:AAHw3V1BzjETgGI11OH_4imfslfz_r5BTSY";
const CHAT_ID = "554103742";

async function readDB(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeDB(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch {}
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ ok: true, token: "fake-jwt-token-isa-dev" });
  } else {
    res.status(401).json({ ok: false, error: "Username yoki parol noto'g'ri" });
  }
});

app.get("/api/projects", async (req, res) => {
  const projects = await readDB(DB_PATH);
  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const newProject = req.body;
  const projects = await readDB(DB_PATH);
  newProject.id = Date.now();
  projects.push(newProject);
  await writeDB(DB_PATH, projects);
  res.json({ ok: true, project: newProject });
});

app.put("/api/projects/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  let projects = await readDB(DB_PATH);
  const index = projects.findIndex((p) => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...req.body };
    await writeDB(DB_PATH, projects);
    res.json({ ok: true, project: projects[index] });
  } else {
    res.status(404).json({ ok: false, error: "Project not found" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  let projects = await readDB(DB_PATH);
  projects = projects.filter((p) => p.id !== id);
  await writeDB(DB_PATH, projects);
  res.json({ ok: true });
});

app.get("/api/messages", async (req, res) => {
  const messages = await readDB(MSG_PATH);
  res.json(messages);
});

app.get("/api/site", async (req, res) => {
  const site = await readDB(SITE_PATH);
  if (!site || Object.keys(site).length === 0) {
    return res.json({ testimonials: [], certificates: [], contact: {} });
  }
  res.json(site);
});

app.put("/api/site", async (req, res) => {
  await writeDB(SITE_PATH, req.body || {});
  res.json({ ok: true });
});

app.delete("/api/messages/:date", async (req, res) => {
  const date = decodeURIComponent(req.params.date);
  let messages = await readDB(MSG_PATH);
  messages = messages.filter((m) => m.date !== date);
  await writeDB(MSG_PATH, messages);
  res.json({ ok: true });
});

app.post("/send", async (req, res) => {
  const { name, email, phone, subject } = req.body;
  if (!name || !email || !phone || !subject) {
    return res.status(400).json({ ok: false, error: "Barcha maydonlar to'ldirilishi kerak" });
  }

  const messages = await readDB(MSG_PATH);
  messages.push({ id: Date.now(), name, email, phone, subject, date: new Date().toISOString() });
  await writeDB(MSG_PATH, messages);

  const text = `📩 Yangi xabar:\n👤 Ism: ${name}\n📧 Email: ${email}\n📱 Telefon: ${phone}\n📝 Mavzu: ${subject}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
      }
    );
    const data = await response.json();
    if (data.ok) {
      res.json({ ok: true, message: "Xabar yuborildi!" });
    } else {
      res.status(500).json({ ok: false, error: "Telegram xatosi" });
    }
  } catch {
    res.status(500).json({ ok: false, error: "Xabar yuborilmadi" });
  }
});

module.exports = app;
