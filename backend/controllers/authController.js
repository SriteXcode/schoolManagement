const User = require("../models/userSchema");

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Block Student registration via public endpoint
    if (role === "Student") {
      return res.status(400).json({ 
        message: "Students cannot register publicly. Please ask your Admin to add you." 
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Teachers need approval
    const status = role === "Teacher" ? "Pending" : "Approved";

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      status
    });

    // If teacher, also create the Teacher profile linked to it immediately?
    // Or wait for approval? Better to create the User first. 
    // If we want them to appear in "Teachers" list only after approval, 
    // we should create the Teacher profile only then. 
    // But for simplicity, let's create the User. The Admin can approve the User.
    // However, if we don't create the Teacher model, we can't assign classes.
    // Let's create the Teacher model too but the user can't login.
    
    if (role === "Teacher") {
        const Teacher = require("../models/teacherSchema");
        await Teacher.create({
            user: user._id,
            name: user.name,
            email: user.email,
            gender: "Male", // Default, can be updated
            qualification: "Not Specified"
        });
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "Pending") {
        return res.status(403).json({ message: "Your account is pending approval from the Admin." });
    }
    
    if (user.status === "Rejected") {
        return res.status(403).json({ message: "Your account request was rejected." });
    }

    const token = user.getJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        schoolCell: user.schoolCell
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Role-based restrictions
    if (user.role === "Student") {
      // Students can ONLY update profileImage and password
      if (profileImage) user.profileImage = profileImage;
      if (password) user.password = password;
      
      // If they try to change name or phone, we simply ignore it (or could throw error)
    } else {
      // Admin and Teacher can update everything
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (profileImage) user.profileImage = profileImage;
      if (password) user.password = password;
    }

    const updatedUser = await user.save();
    
    // Sync to Teacher model if role is Teacher
    if (updatedUser.role === "Teacher") {
        const Teacher = require("../models/teacherSchema");
        await Teacher.findOneAndUpdate(
            { user: updatedUser._id },
            { email: updatedUser.email, name: updatedUser.name }
        );
    }
    
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
      schoolCell: updatedUser.schoolCell
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
