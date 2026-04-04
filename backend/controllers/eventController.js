const Event = require("../models/eventSchema");
const { validateSessionDate } = require("../middleware/sessionMiddleware");

exports.createEvent = async (req, res) => {
  try {
    const { date, title, description, type, instructions, time } = req.body;

    // Academic Session Validation
    try {
        await validateSessionDate(date);
    } catch (sessionError) {
        return res.status(400).json({ message: sessionError.message });
    }

    const event = await Event.create({
      date,
      title,
      description,
      type,
      instructions,
      time
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
    try {
        const { date, title, description, type, instructions, time } = req.body;

        // Academic Session Validation
        try {
            await validateSessionDate(date);
        } catch (sessionError) {
            return res.status(400).json({ message: sessionError.message });
        }

        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, {
            date, title, description, type, instructions, time
        }, { new: true });
        res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
