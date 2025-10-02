const { sequelize, User } = require('../database/db');
const { encryptData } = require('../controllers/hashingController');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = 'admin@ems.local';
    const password = 'Admin@12345';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const secretKey = '6e97deb2f832bbaa0ceadcbd8f94abb053da76fe4f695392bf0012c646921ca3';
    const { encPass, encAadhar, encPan } = encryptData(password, '0000-0000-0000', 'AAAAA0000A', secretKey);

    await User.create({
      email,
      password: encPass,
      joiningDate: new Date(),
      position: 'Super Admin',
      name: 'Admin',
      aadhar: encAadhar,
      panNo: encPan,
      isSuperUser: true,
      address: 'N/A',
      dateOfBirth: new Date('1990-01-01'),
      githubId: 'admin',
      linkedInId: 'admin',
      phone: '0000000000',
      image: 'uploads\\images\\user-default.jpg',
    });

    console.log('Seeded default super admin: admin@ems.local / Admin@12345');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();