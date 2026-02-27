// controllers/userController.js
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const sendMail = require("../utils/mailer");
const jwt = require('jsonwebtoken');

// Get all users
exports.getAllUsers = (req, res) => {
  db.all("SELECT id, email, role, status FROM users", [], (err, rows) => {
    if (err) return res.status(400).json({ message: "Error getting users", error: err.message });
    res.status(200).json({ message: "All users coming", users: rows });
  });
};

// Get user by id
exports.getUserById = (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(400).json({ message: "Error getting user", error: err.message });
    if (!row) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User is coming", data: row });
  });
};
// Get user by id
exports.EditUserById = (req, res) => {
  const { id } = req.params; // only id from params
  const { email, password } = req.body; // data from body

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(400).json({ message: "Error getting user", error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });

    let hash = user.password_hash; // default keep old password
    if (password && password.trim() !== "") {
      hash = bcrypt.hashSync(password, 10);
    }

    db.run(
      "UPDATE users SET password_hash = ?, email = ? WHERE id = ?",
      [hash, email || user.email, id],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(200).json({ message: "User updated successfully" });
      }
    );
  });
};

// Register user (no email verification, no OTP)
exports.userSignup = (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (email, password_hash, role, is_verified) VALUES (?, ?, ?, ?)",
    [email, hash, role || "user", 1], // mark as verified directly
    function (err) {
      if (err) return res.status(403).json({ message: "User already exists", error: err.message });

      db.get("SELECT id, email, role FROM users WHERE id = ?", [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Sign token
        const token = jwt.sign(
          { id: row.id, email: row.email, role: row.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(200).json({
          message: "User registered successfully",
          user: row,
          token
        });
      });
    }
  );
};

// Login (no JWT)
exports.userLogin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // Login Block for paused users
    if (user.status === 'paused') {
      return res.status(403).json({ message: "Your account is paused. Please contact administrator." });
    }

    // Sign token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`User Login: ${user.email} (ID: ${user.id})`);

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  });
};

// Forgot password (send reset link by email, needs internet)
exports.userForgotPassword = (req, res) => {
  const { email } = req.body;

  // Look up user by email
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Simple reset token (not JWT, just timestamp hash)
    const token = bcrypt.hashSync(Date.now().toString(), 5);
    const resetLink = `http://localhost:5173/reset/${encodeURIComponent(token)}`;

    try {
      await sendMail(email, "Reset Your Password", `
        <div style="font-family: sans-serif; background:#f3f4f6; padding:20px;">
          <div style="background:#fff; max-width:600px; margin:auto; padding:20px; border-radius:8px;">
            <h2>Password Reset</h2>
            <p>Hello,</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}" style="display:inline-block; background:#22c55e; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">
              Reset Password
            </a>
            <p>If you did not request this, ignore this email.</p>
          </div>
        </div>
      `);

      // Save token temporarily in DB for verification
      db.run("UPDATE users SET reset_token = ?, reset_expiration = ? WHERE id = ?",
        [token, Date.now() + 5 * 60 * 1000, user.id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(200).json({ message: "Reset link sent" });
        }
      );

    } catch (error) {
      res.status(500).json({ message: "Error sending email", error: error.message });
    }
  });
};

// Reset password
exports.userResetPassword = (req, res) => {
  const { Token, newpassword } = req.body;
  if (!Token || !newpassword) return res.status(400).json({ message: "Missing fields" });

  db.get("SELECT * FROM users WHERE reset_token = ?", [Token], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    if (Date.now() > user.reset_expiration) {
      return res.status(400).json({ message: "Token expired" });
    }

    const hash = bcrypt.hashSync(newpassword, 10);

    db.run(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_expiration = NULL WHERE id = ?",
      [hash, user.id],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(200).json({ message: "Password reset successfully" });
      }
    );
  });
};

// Toggle User Status (Admin only)
exports.toggleUserStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'paused'

  db.run("UPDATE users SET status = ? WHERE id = ?", [status, id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to update status", error: err.message });
    res.status(200).json({ message: `User status updated to ${status}` });
  });
};

// Delete User (Admin only)
exports.deleteUserById = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete user", error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  });
};
