const { sequelize, User } = require('../database/db');
const { encryptData } = require('../controllers/hashingController');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = 'user@ems.local';
    const password = 'User@12345';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Normal user already exists.');
      process.exit(0);
    }

    const secretKey = '6e97deb2f832bbaa0ceadcbd8f94abb053da76fe4f695392bf0012c646921ca3';
    const { encPass, encAadhar, encPan } = encryptData(password, '1111-2222-3333', 'BBBBB1111B', secretKey);

    await User.create({
      email,
      password: encPass,
      joiningDate: new Date(),
      position: 'Engineer',
      name: 'Normal User',
      aadhar: encAadhar,
      panNo: encPan,
      isSuperUser: false,
      address: 'N/A',
      dateOfBirth: new Date('1995-05-05'),
      githubId: 'normaluser',
      linkedInId: 'normaluser',
      phone: '9999999999',
      image: 'uploads\\images\\user-default.jpg',
    });

    console.log('Seeded normal user: user@ems.local / User@12345');
    process.exit(0);
  } catch (err) {
    console.error('Seeding normal user failed:', err);
    process.exit(1);
  }
})();