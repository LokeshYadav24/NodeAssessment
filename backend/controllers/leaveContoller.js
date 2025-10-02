const { User, Leave } = require("../database/db");

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

const applyForLeave = async (req, res, next) => {
  const { leaveDays, leaveStartDate, leaveEndDate } = req.body.leaveDate || {};
  const uid = req.params.uid;

  try {
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(404).json({ message: "Could not find the user!" });
    }

    await Leave.create({
      userId: uid,
      startDate: leaveStartDate,
      leaveDate: leaveEndDate,
      leave_status: "pending",
      leaveDays: leaveDays,
    });

    return res.status(200).json({ success: true, message: 'Leave applied' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const leaveEmployee = async (req, res, next) => {
  try {
    const users = await User.findAll({ include: [{ model: Leave, as: 'leaveDate' }] });
    const withPending = users
      .map(toMongoLike)
      .filter((u) => (u.leaveDate || []).some((l) => l.leave_status === 'pending'));
    return res.status(200).send({ message: "User Found", user: withPending });
  } catch (error) {
    return res
      .status(404)
      .json({ message: "Could not find any user!", success: false });
  }
};

const approveLeave = async (req, res, next) => {
  const { applyForLeave } = req.body;
  const permission = applyForLeave ? "approved" : "rejected";

  const leave_id = req.params.leaveId;
  try {
    const leave = await Leave.findOne({ where: { id: leave_id, leave_status: 'pending' } });
    if (!leave) {
      return res
        .status(404)
        .json({ message: "Could not find the user or leave is not pending!" });
    }
    leave.leave_status = permission;
    await leave.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getLeaveData = async (req, res, next) => {
  const uid = req.params.uid;
  try {
    const user = await User.findByPk(uid, { include: [{ model: Leave, as: 'leaveDate' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user: toMongoLike(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  applyForLeave,
  leaveEmployee,
  approveLeave,
  getLeaveData,
};
