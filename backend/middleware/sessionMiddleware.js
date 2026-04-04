const School = require("../models/schoolSchema");

const validateSessionDate = async (date) => {
    if (!date) return true; // If no date provided, skip validation (or handle as error if required)
    
    const school = await School.findOne();
    if (!school || !school.sessionStart || !school.sessionEnd) {
        return true; // If no session defined, allow all (or block all depending on school policy)
    }

    const checkDate = new Date(date);
    const start = new Date(school.sessionStart);
    const end = new Date(school.sessionEnd);

    // Normalize dates to start of day for comparison
    checkDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (checkDate < start || checkDate > end) {
        throw new Error(`Date ${checkDate.toLocaleDateString()} is outside the current academic session (${start.toLocaleDateString()} to ${end.toLocaleDateString()}).`);
    }

    return true;
};

module.exports = { validateSessionDate };
