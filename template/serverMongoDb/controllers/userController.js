const bcrypt=require("bcrypt");
const User = require("../models/User");
const sendMail = require("../utils/mailer");
const jwt = require('jsonwebtoken');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'email role status');
    res.status(200).json({ message: "All users coming", users });
  } catch (err) {
    res.status(400).json({ message: "Error getting users", error: err.message });
  }
};

// Get user by id
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User is coming", data: user });
  } catch (err) {
    res.status(400).json({ message: "Error getting user", error: err.message });
  }
};
// Edit user by id
exports.EditUserById = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email) user.email = email;
    if (password && password.trim() !== "") {
      user.password_hash = bcrypt.hashSync(password, 10);
    }

    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register user (no email verification, no OTP)
exports.userSignup = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(403).json({ message: "User already exists" });

    const hash = bcrypt.hashSync(password, 10);
    const newUser = new User({
      email,
      password_hash: hash,
      role: role || "user",
      is_verified: true
    });

    await newUser.save();

    // Sign token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: "User registered successfully",
      user: newUser,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.userLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (user.status === 'paused') {
      return res.status(403).json({ message: "Your account is paused. Please contact administrator." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Forgot password
exports.userForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = bcrypt.hashSync(Date.now().toString(), 5);
    const resetLink = `http://localhost:5173/reset/${encodeURIComponent(token)}`;

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

    user.reset_token = token;
    user.reset_expiration = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    res.status(200).json({ message: "Reset link sent" });
  } catch (error) {
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

// Reset password
exports.userResetPassword = async (req, res) => {
  const { Token, newpassword } = req.body;
  if (!Token || !newpassword) return res.status(400).json({ message: "Missing fields" });

  try {
    const user = await User.findOne({
      reset_token: Token,
      reset_expiration: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password_hash = bcrypt.hashSync(newpassword, 10);
    user.reset_token = null;
    user.reset_expiration = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle User Status (Admin only)
exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: `User status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};

// Delete User (Admin only)
exports.deleteUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await User.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};
