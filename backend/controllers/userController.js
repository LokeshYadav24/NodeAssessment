const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { User, Leave } = require("../database/db");
const {
  encryptData,
  decryptData,
  decryptePass,
} = require("./hashingController");

const secretKey =
  "6e97deb2f832bbaa0ceadcbd8f94abb053da76fe4f695392bf0012c646921ca3";

const toMongoLike = (userInstance) => {
  if (!userInstance) return null;
  const plain = userInstance.toJSON ? userInstance.toJSON() : userInstance;
  const leaveArray = (plain.leaveDate || []).map((l) => ({
    _id: l.id,
    startDate: l.startDate,
    leaveDate: l.leaveDate,
    leave_status: l.leave_status,
    leaveDays: l.leaveDays,
  }));
  return {
    _id: plain.id,
    email: plain.email,
    password: plain.password,
    joiningDate: plain.joiningDate,
    position: plain.position,
    name: plain.name,
    aadhar: plain.aadhar,
    panNo: plain.panNo,
    isSuperUser: plain.isSuperUser,
    image: plain.image,
    address: plain.address,
    linkedInId: plain.linkedInId,
    phone: plain.phone,
    githubId: plain.githubId,
    dateOfBirth: plain.dateOfBirth,
    leaveDate: leaveArray,
  };
};

const getUserById = async (req, res, next) => {
  const uid = req.params.uid;
  let user;
  try {
    user = await User.findByPk(uid, { include: [{ model: Leave, as: 'leaveDate' }] });
    if (!user) return res.status(404).send({ message: "User not found", success: false });
    const mapped = toMongoLike(user);
    const { decPass, decAadhar, decPan } = decryptData(
      mapped.password,
      mapped.aadhar,
      mapped.panNo,
      secretKey
    );
    mapped.password = decPass;
    mapped.aadhar = decAadhar;
    mapped.panNo = decPan;
    return res.status(200).send({ message: "User Found!", success: true, user: mapped });
  } catch (error) {
    return res.status(500).send({ message: `${error.message}`, success: false });
  }
};

const newUser = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new Error("Invalid Data"));
  }
  const {
    email,
    password,
    joiningDate,
    position,
    name,
    aadhar,
    panNo,
    isSuperUser,
    address,
    dateOfBirth,
    githubId,
    linkedIn,
    phone,
  } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(500)
        .json({ message: "User already exists with this email", success: false });
    }

    const { encPass, encAadhar, encPan } = encryptData(
      password,
      aadhar,
      panNo,
      secretKey
    );

    const created = await User.create({
      email,
      password: encPass,
      joiningDate,
      position,
      name,
      aadhar: encAadhar,
      panNo: encPan,
      isSuperUser: !!isSuperUser,
      address,
      dateOfBirth,
      githubId,
      linkedInId: linkedIn,
      phone,
      image: "uploads\\images\\user-default.jpg",
    });

    res.status(201).send({ message: "Register Success", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `${error.message}`, success: false });
  }
};

const loginUser = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new Error("Invalid Data"));
  }

  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (!existingUser) {
      return res
        .status(404)
        .send({ message: "User not found with this email.", success: false });
    }

    const { decPass } = decryptePass(existingUser.password, secretKey);
    if (decPass !== password) {
      return res
        .status(404)
        .send({ message: "Invalid Password", success: false });
    }

    let token;
    try {
      token = jwt.sign(
        {
          email: existingUser.email,
          userId: existingUser.id,
        },
        "secret_secret",
        { expiresIn: "1h" }
      );
    } catch (error) {
      return res
        .status(404)
        .send({ message: "Could not set token", success: false });
    }

    const mapped = toMongoLike(existingUser);

    return res.status(200).send({
      message: "Login Successfull",
      success: true,
      user: mapped,
      token: token,
    });
  } catch (error) {
    return res.status(500).send({ message: `${error.message}`, success: false });
  }
};

const displayUser = async (req, res, next) => {
  try {
    const users = await User.findAll({ include: [{ model: Leave, as: 'leaveDate' }] });
    const mapped = users.map(toMongoLike);
    return res.status(200).send({ user: mapped, success: true });
  } catch (error) {
    return res
      .status(404)
      .send({ message: "Did not find any user", success: false });
  }
};

const editEmployee = async (req, res, next) => {
  const { email, name, position, phone, address, aadhar, panNo } = req.body;
  const uid = req.params.uid;

  try {
    const user = await User.findByPk(uid);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Could not find the user", success: false });
    }

    user.name = name;
    user.email = email;
    user.position = position;
    user.phone = phone;
    user.address = address;
    user.aadhar = aadhar;
    user.panNo = panNo;
    user.image = (req?.file?.path) || "uploads\\images\\user-default.jpg";

    await user.save();

    return res
      .status(200)
      .send({ message: "User detail updated successfully!", success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Could not update the user details", success: false });
  }
};

module.exports = {
  newUser,
  loginUser,
  displayUser,
  editEmployee,
  getUserById,
};
