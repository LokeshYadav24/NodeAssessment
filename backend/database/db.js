const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize SQLite database via Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false,
});

// Define User model (mirrors previous Mongoose schema as closely as possible)
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.TEXT, allowNull: false },
  joiningDate: { type: DataTypes.DATE, allowNull: false },
  position: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  aadhar: { type: DataTypes.TEXT, allowNull: false },
  panNo: { type: DataTypes.TEXT, allowNull: false },
  isSuperUser: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  image: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: false },
  linkedInId: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  githubId: { type: DataTypes.STRING, allowNull: false },
  dateOfBirth: { type: DataTypes.DATE, allowNull: false },
});

// Define Leave model to replace embedded array
const Leave = sequelize.define('Leave', {
  startDate: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  leaveDate: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  leave_status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  leaveDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

User.hasMany(Leave, { foreignKey: 'userId', as: 'leaveDate' });
Leave.belongsTo(User, { foreignKey: 'userId' });

const connectDb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('SQLite database connected and synced');
  } catch (error) {
    console.log(`SQLite connection failed: ${error}`);
  }
};

module.exports = { sequelize, connectDb, User, Leave };
