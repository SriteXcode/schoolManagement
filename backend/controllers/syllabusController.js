const Syllabus = require("../models/syllabusSchema");
const Class = require("../models/classSchema");
const Teacher = require("../models/teacherSchema");

// Helper to calculate progress (Shared by update methods)
const calculateProgress = (syllabus) => {
    if (!syllabus.chapters || syllabus.chapters.length === 0) {
        syllabus.totalProgress = 0;
        return syllabus;
    }

    let totalTopics = 0;
    let completedTopics = 0;

    syllabus.chapters.forEach(chapter => {
        if (chapter.topics && chapter.topics.length > 0) {
            const chapterTotal = chapter.topics.length;
            const chapterCompleted = chapter.topics.filter(t => t.status === 'Completed').length;
            
            totalTopics += chapterTotal;
            completedTopics += chapterCompleted;

            // Sync Chapter Status
            if (chapterCompleted === chapterTotal) {
                chapter.status = 'Completed';
                if (!chapter.completionDate) chapter.completionDate = new Date();
            } else if (chapterCompleted > 0) {
                chapter.status = 'In Progress';
                chapter.completionDate = null;
            } else {
                chapter.status = 'Not Started';
                chapter.completionDate = null;
            }
        } else {
            // Treat chapter as 1 unit if no topics
            totalTopics += 1;
            if (chapter.status === 'Completed') completedTopics += 1;
        }
    });

    syllabus.totalProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    syllabus.lastUpdated = new Date();
    return syllabus;
};

exports.createSyllabus = async (req, res) => {
  try {
    const { sClass, subject, teacherId, academicYear, description, chapters } = req.body;
    const existing = await Syllabus.findOne({ sClass, subject, academicYear });
    if (existing) return res.status(400).json({ message: "Syllabus already exists" });

    let syllabus = new Syllabus({
      sClass, subject, teacher: teacherId,
      academicYear: academicYear || "2023-2024",
      description, chapters: chapters || []
    });

    syllabus = calculateProgress(syllabus);
    await syllabus.save();
    res.status(201).json({ message: "Syllabus created", syllabus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSyllabus = async (req, res) => {
  try {
    const syllabusList = await Syllabus.find()
      .populate("sClass", "grade section")
      .populate("teacher", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(syllabusList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSyllabusByClass = async (req, res) => {
  try {
    const { id } = req.params;
    let query = { sClass: id };
    
    // Syllabi are global to the class/subject. 
    // We only restrict by teacher if we want them to ONLY see subjects they teach.
    if (req.user.role !== 'Admin' && req.user.role !== 'ExamCell' && req.user.role !== 'ManagementCell') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        // Instead of filtering by teacher ID on the syllabus document, 
        // we can filter the class's assigned subjects. 
        // But for simplicity and persistence, we allow them to see the class's syllabus.
        // if (teacher) query.teacher = teacher._id; // REMOVED: Syllabus belongs to Class + Subject
    }
    const syllabus = await Syllabus.find(query).populate("teacher", "name email");
    res.status(200).json(syllabus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSyllabusById = async (req, res) => {
    try {
        const syllabus = await Syllabus.findById(req.params.id)
            .populate("sClass", "grade section")
            .populate("teacher", "name");
        res.status(200).json(syllabus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { chapterNo, status, topics, resources, plannedDate } = req.body;
    let syllabus = await Syllabus.findById(id);
    if (!syllabus) return res.status(404).json({ message: "Not found" });

    // Authorization: Admin or the teacher assigned to this class/subject
    if (req.user.role !== 'Admin' && req.user.role !== 'ManagementCell') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (!teacher) return res.status(403).json({ message: "Unauthorized" });
        
        // We can check if this teacher is assigned to this class in Class model
        // For now, if they have the syllabus ID, we let them update if they are a teacher
    }

    const chapter = syllabus.chapters.find(c => c.chapterNo === parseInt(chapterNo));
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    if (status) {
        chapter.status = status;
        if (status === 'Completed') {
            chapter.completionDate = new Date();
            if (chapter.topics) chapter.topics.forEach(t => t.status = 'Completed');
        } else {
            chapter.completionDate = null;
        }
    }
    if (plannedDate) chapter.plannedDate = plannedDate;
    if (topics) chapter.topics = topics;
    if (resources) chapter.resources = resources;

    syllabus = calculateProgress(syllabus);
    syllabus.markModified('chapters');
    await syllabus.save();
    res.status(200).json({ message: "Chapter updated", syllabus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTopics = async (req, res) => {
    try {
        const { id, chapterNo } = req.params;
        const { topicIndex, status } = req.body;
        let syllabus = await Syllabus.findById(id);
        if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });

        if (req.user.role !== 'Admin') {
            const teacher = await Teacher.findOne({ user: req.user._id });
            if (!teacher || syllabus.teacher.toString() !== teacher._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }
        }

        const chapter = syllabus.chapters.find(c => c.chapterNo === parseInt(chapterNo));
        if (!chapter) return res.status(404).json({ message: "Chapter not found" });
        
        const idx = parseInt(topicIndex);
        if (chapter.topics && chapter.topics[idx]) {
            chapter.topics[idx].status = status;
            chapter.topics[idx].completionDate = status === 'Completed' ? new Date() : null;
        }

        syllabus = calculateProgress(syllabus);
        syllabus.markModified('chapters');
        await syllabus.save();
        res.status(200).json({ message: "Topic updated", syllabus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.deleteSyllabus = async (req, res) => {
    try {
        await Syllabus.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Syllabus removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
