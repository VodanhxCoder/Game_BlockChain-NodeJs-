// scripts/seedTestUser.js

const { User } = require('../models');
const { sequelize } = require('../config/sequelize');

(async () => {
  try {
    // Ensure the database connection is established
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Create (or find) a test user
    const testUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // SHA-256 of "password123"
      playername: 'Test User',
      role: 'player',
      status: 'active',
      highScore: 0,
    };

    const [user, created] = await User.findOrCreate({ where: { username: testUser.username }, defaults: testUser });
    if (created) console.log('Test user created:', user.toJSON());
    else console.log('Test user already exists:', user.username);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
})();