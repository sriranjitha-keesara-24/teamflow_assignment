const User = require("../models/User");
const { getUploadUrl } = require("./atachmentController");

// @route   GET /api/v1/users?search=name-or-email
// @access  Private
// Used for pickers like "add member to project" - returns basic public fields only
const searchUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = { isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email avatar role")
      .limit(20);

    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, phone, skills, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()).filter(Boolean);
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        skills: user.skills
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/users/profile/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image file" });
    }

    const url = await getUploadUrl(req.file);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.avatar = url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        skills: user.skills
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/users/admin/list
// @access  Private (Admin only)
const adminGetUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("name email avatar role isActive createdAt");
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/users/:id/status
// @access  Private (Admin only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.isActive ? "active" : "inactive"}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers, updateProfile, updateAvatar, adminGetUsers, toggleUserStatus };