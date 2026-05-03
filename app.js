const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== VULNERABILITY 1: SQL INJECTION ==========
// Login: username = admin' OR '1'='1' , password = anything
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // BAHYA! Query langsung digabung tanpa parameterized query
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  console.log('Running query:', query);
  // Simulasi: jika query mengandung OR '1'='1, kita anggap sukses
  if (username.includes("' OR '1'='1") || username.includes("' or '1'='1")) {
    res.json({ success: true, message: "Login bypassed with SQL Injection!" });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// ========== VULNERABILITY 2: BROKEN ACCESS CONTROL ==========
// Siapapun bisa akses /user/:id tanpa auth
const users = { 1: "Alice", 2: "Bob", 3: "Admin Secret" };
app.get('/user/:id', (req, res) => {
  const id = req.params.id;
  res.json({ userId: id, name: users[id] || "Not found" });
});

// ========== VULNERABILITY 3: XSS (STORED) ==========
let comments = [];
app.post('/comment', (req, res) => {
  const { comment } = req.body;
  comments.push(comment);
  res.json({ success: true, comments: comments });
});
app.get('/comments', (req, res) => {
  // Langsung tampilkan tanpa sanitasi!
  let html = '<h1>Comments</h1><ul>';
  comments.forEach(c => { html += `<li>${c}</li>`; });
  html += '</ul><form method="POST" action="/comment"><input name="comment"><button>Post</button></form>';
  res.send(html);
});

app.listen(3000, () => console.log('VULNERABLE app running on port 3000'));

// ========== VULNERABILITY 4: NO RATE LIMITING ==========
// Bisa brute force unlimited kali
app.post('/bruteforce-me', (req, res) => {
  // Tidak ada pembatasan percobaan login
  res.json({ message: "Try again, no limit!" });
});

// ========== VULNERABILITY 5: SENSITIVE DATA EXPOSURE ==========
app.get('/api/config', (req, res) => {
  // API key dan password terlihat jelas!
  res.json({ 
    apiKey: "sk-1234567890abcdef",
    dbPassword: "admin123",
    internalIp: "192.168.1.100"
  });
});

// ========== VULNERABILITY 6: PATH TRAVERSAL ==========
const fs = require('fs');
app.get('/read-file', (req, res) => {
  const filename = req.query.file;
  // Bisa akses ../../etc/passwd
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) res.send("Error");
    else res.send(data);
  });
});

// ========== VULNERABILITY 7: INSECURE DIRECT OBJECT REFERENCE (IDOR) ==========
app.get('/invoice/:invoiceId', (req, res) => {
  // Tidak cek apakah invoice milik user yang login
  res.json({ invoiceId: req.params.invoiceId, amount: 1000 });
});