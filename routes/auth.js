const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Replace with the correct import
const config = require('../config'); // Replace with the correct import

const router = express.Router();

// User Registration
// User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate an email verification token and set expiration
    const emailVerificationToken = crypto.randomBytes(20).toString('hex');
    const emailVerificationTokenExpires = Date.now() + 3600000; // Token expires in 1 hour

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    await newUser.save();

    // Send an email to the user with a verification link that includes the token
    const verificationLink = `${config.clientURL}/verify-email?token=${emailVerificationToken}`;
    sendEmail(newUser.email, 'Email Verification', verificationLink);

    // Return the email verification token in the response
    res.status(201).json({ message: 'User registered successfully', token: emailVerificationToken });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Verify Email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Verify if the token is valid and not expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    // Mark the user as email verified and remove the verification token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email successfully verified.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot Password - Request Password Reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    // Generate a password reset token and set expiration
    const passwordResetToken = crypto.randomBytes(20).toString('hex');
    const passwordResetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour

    // Save the token and expiration in the user document
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;
    await user.save();

    // Send an email to the user with a password reset link that includes the token
    const resetLink = `http://localhost:3000/api/auth/reset-password?token=${passwordResetToken}`;
    sendEmail(user.email, 'Password Reset Request', resetLink);

    res.status(200).json({ message: 'Password reset link sent successfully.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify if the token is valid and not expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    // Update the user's password and clear the reset token fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password successfully reset.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to send emails
function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., 'Gmail'
    auth: {
      user: 'mattaparthideepika@gmail.com',
      pass: 'tvhbzbezqjvqmecy',
    },
  });

  const mailOptions = {
    from: 'mattaparthideepika26@gmail.com',
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('Email sending error:', error);
    }
  });
}

module.exports = router;
