const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const env = require('../config/env');

class AuthController {
  static async signUp(req, res) {
    try {
      const { email, name, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      // Create new user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          isActive: true,
        },
      });
   console.log(user);
      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({ message: 'User created successfully', token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials or user inactive' });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });

      res.status(200).json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, preferences: true },
      });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { name, preferences } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name, preferences: preferences ? JSON.parse(JSON.stringify(preferences)) : undefined },
      });
      res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async logout(req, res) {
    // In a real implementation, you might invalidate the token on the server or client-side
    res.status(200).json({ message: 'Logged out successfully' });
  }
}

module.exports = AuthController;
