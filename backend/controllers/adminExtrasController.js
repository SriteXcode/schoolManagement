const User = require("../models/userSchema");
const Communication = require("../models/commSchema");

// --- User Approval Logic ---
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "Pending" });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id, status } = req.body; // status: 'Approved' or 'Rejected'
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json({ message: `User ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Communication Logic ---
exports.sendMessage = async (req, res) => {
  try {
    let { name, email, message, type, recipientId, isAnonymous } = req.body;
    
    // If authenticated, we can attach user ID (ONLY if NOT anonymous)
    let userId = null;
    if (req.user && !isAnonymous) {
        userId = req.user._id;
    }

    // Mask for UI if anonymous
    if (isAnonymous) {
        name = "Anonymous Student";
        email = "anonymous@school.com";
    }

    await Communication.create({
      name,
      email,
      message,
      type,
      user: userId,
      recipient: recipientId || null, // null = Admin
      isAnonymous: isAnonymous || false,
    });
    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    // Admin sees ALL messages (where recipient is null or Admin's User ID)
    const messages = await Communication.find({ 
        $or: [
            { recipient: null },
            { recipient: req.user._id }
        ]
    }).populate("user", "name email").sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessagesForUser = async (req, res) => {
  try {
    // For Teachers to see feedback sent to them
    const messages = await Communication.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMessageStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        // Verify ownership? Or just allow updates. 
        // Ideally check if req.user is admin OR recipient of message.
        await Communication.findByIdAndUpdate(id, { status });
        res.status(200).json({ message: "Status updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
