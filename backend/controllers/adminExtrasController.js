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
    const { name, email, message, type, recipientId, isAnonymous } = req.body;
    
    // Always store the user ID if authenticated, so admins can track if needed in DB
    const userId = req.user ? req.user._id : null;

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
    // Admin sees ALL messages regardless of recipient
    const messages = await Communication.find()
        .populate("user", "name email role")
        .populate("recipient", "name email role")
        .sort({ createdAt: -1 });

    // Mark for Admin UI that it's anonymous to others, but admin sees real name
    const processed = messages.map(msg => {
        const m = msg.toObject();
        if (m.isAnonymous) {
            m.displayName = `${m.name} (Anonymous Mode)`;
        } else {
            m.displayName = m.name;
        }
        return m;
    });

    res.status(200).json(processed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessagesForUser = async (req, res) => {
  try {
    // For Teachers to see feedback sent to them
    const messages = await Communication.find({ recipient: req.user._id })
        .populate("user", "name email role")
        .sort({ createdAt: -1 });

    const processed = messages.map(msg => {
        const m = msg.toObject();
        if (m.isAnonymous) {
            m.name = "Anonymous Student";
            m.email = "hidden@school.com";
            m.user = null; // Hide user profile object
        }
        return m;
    });

    res.status(200).json(processed);
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
