const express = require('express');
const session = require('express-session');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'supersecret', resave: false, saveUninitialized: true }));

// ===== 1. SQL INJECTION =====
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  if (username.includes("' OR '1'='1") || username.includes("' or '1'='1")) {
    res.json({ success: true, token: "fake-jwt-token", message: "SQL Injection success!" });
  } else {
    res.json({ success: false, message: "Login failed" });
  }
});

// ===== 2. BROKEN ACCESS CONTROL =====
const userData = { 1: { name: "Alice", salary: 5000 }, 2: { name: "Bob", salary: 6000 }, 3: { name: "Admin", salary: 10000 } };
app.get('/api/user/:id', (req, res) => {
  res.json(userData[req.params.id] || { error: "not found" });
});

// ===== 3. XSS STORED =====
let comments = [];
app.post('/api/comment', (req, res) => { comments.push(req.body.comment); res.json({ ok: true }); });
app.get('/comments', (req, res) => {
  let html = '<html><body><h1>Comments</h1><ul>';
  comments.forEach(c => html += `<li>${c}</li>`);
  html += '</ul><form method="POST" action="/api/comment"><input name="comment"><button>Post</button></form></body></html>';
  res.send(html);
});

// ===== 4. NO RATE LIMIT =====
app.post('/api/login-attempt', (req, res) => res.json({ message: "attempt recorded" }));

// ===== 5. SENSITIVE DATA EXPOSURE =====
app.get('/api/config', (req, res) => res.json({ AWS_KEY: "AKIAIOSFODNN7EXAMPLE", DB_PASS: "root123" }));

// ===== 6. PATH TRAVERSAL =====
app.get('/read', (req, res) => {
  fs.readFile(req.query.file, 'utf8', (err, data) => res.send(data || err.message));
});

// ===== 7. IDOR =====
app.get('/api/invoice/:id', (req, res) => res.json({ invoiceId: req.params.id, owner: "secret" }));

// ===== 8. CRYPTOGRAPHIC FAILURE =====
app.post('/api/register', (req, res) => {
  const { password } = req.body;
  res.json({ message: "User registered", passwordInPlainText: password });
});

// ===== 9. SSRF =====
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
});

// ===== 10. SECURITY MISCONFIGURATION =====
app.get('/debug', (req, res) => res.json({ stackTrace: "Error at line 42", env: process.env }));

app.listen(3000, () => console.log('🔥 VULNERABLE APP RUNNING on http://localhost:3000'));
