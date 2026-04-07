const express = require("express");
const router = express.Router();
const { register, login, updateProfile } = require("../controllers/authController");
const { auth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/register", register); 
router.post("/login", login);
router.put("/update-profile", auth, updateProfile);
router.post("/upload", auth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    // If Cloudinary wasn't configured, req.file.path won't exist (using memoryStorage)
    if (!req.file.path) {
        return res.status(503).json({ 
            message: "Cloudinary is not configured on the server. Please add your keys to the .env file." 
        });
    }

    res.status(200).json({ 
        url: req.file.path,
        public_id: req.file.filename
    });
});

module.exports = router;
