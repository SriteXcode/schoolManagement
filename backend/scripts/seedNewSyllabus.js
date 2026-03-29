const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Syllabus = require("../models/syllabusSchema");
const Class = require("../models/classSchema");
const Teacher = require("../models/teacherSchema");

dotenv.config({ path: path.join(__dirname, "../.env") });

const sampleChapters = [
  {
    title: "Introduction to the Fundamentals",
    topics: ["Historical Overview", "Core Concepts", "Standard Definitions"],
    resources: [
      { title: "Intro Video", url: "https://youtube.com/watch?v=sample1", type: "Video" },
      { title: "Syllabus PDF", url: "https://sample.com/syllabus.pdf", type: "PDF" }
    ]
  },
  {
    title: "Advanced Theoretical Frameworks",
    topics: ["Quantum Logic", "Neural Structures", "System Dynamics", "Ethical Implications"],
    resources: [
      { title: "Research Paper", url: "https://arxiv.org/sample", type: "Document" }
    ]
  },
  {
    title: "Practical Applications & Lab Work",
    topics: ["Environment Setup", "First Experiment", "Data Analysis", "Reporting Results"],
    resources: [
      { title: "Lab Manual", url: "https://sample.com/lab.pdf", type: "PDF" }
    ]
  },
  {
    title: "Semester Review & Project Preparation",
    topics: ["Q&A Session", "Mock Test", "Project Guidelines"],
    resources: []
  }
];

const calculateProgress = (syllabus) => {
    let totalTopics = 0;
    let completedTopics = 0;

    syllabus.chapters.forEach(chapter => {
        if (chapter.topics && chapter.topics.length > 0) {
            const chapterTotal = chapter.topics.length;
            const chapterCompleted = chapter.topics.filter(t => t.status === 'Completed').length;
            
            totalTopics += chapterTotal;
            completedTopics += chapterCompleted;

            if (chapterCompleted === chapterTotal) {
                chapter.status = 'Completed';
            } else if (chapterCompleted > 0) {
                chapter.status = 'In Progress';
            } else {
                chapter.status = 'Not Started';
            }
        } else {
            totalTopics += 1;
            if (chapter.status === 'Completed') completedTopics += 1;
        }
    });

    syllabus.totalProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return syllabus;
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/school_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to DB. Flushing old syllabus data...");

    await Syllabus.deleteMany({});

    const classes = await Class.find().populate("subjects.teacher");
    
    if (classes.length === 0) {
        console.log("No classes found. Please seed classes first.");
        process.exit(1);
    }

    const syllabusData = [];

    for (const cls of classes) {
        for (const sub of cls.subjects) {
            if (!sub.teacher) continue;

            const chapters = sampleChapters.map((ch, index) => ({
                chapterNo: index + 1,
                title: ch.title,
                description: `Comprehensive study of ${ch.title} for ${sub.subName}.`,
                status: index === 0 ? "Completed" : index === 1 ? "In Progress" : "Not Started",
                plannedDate: new Date(Date.now() + (index * 7 * 24 * 60 * 60 * 1000)),
                completionDate: index === 0 ? new Date() : null,
                topics: ch.topics.map(t => ({
                    title: t,
                    status: index === 0 ? "Completed" : "Pending",
                    completionDate: index === 0 ? new Date() : null
                })),
                resources: ch.resources
            }));

            let record = {
                sClass: cls._id,
                subject: sub.subName,
                teacher: sub.teacher._id,
                academicYear: "2023-2024",
                description: `Official ${sub.subName} curriculum for ${cls.grade}-${cls.section}.`,
                chapters
            };

            record = calculateProgress(record);
            syllabusData.push(record);
        }
    }

    await Syllabus.insertMany(syllabusData);
    console.log(`Successfully seeded ${syllabusData.length} records with correct initial progress! 🚀`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seed();
