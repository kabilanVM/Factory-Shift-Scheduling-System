
const shifts = [
    {
        id: 1,
        employee: "Kabilan",
        department: "Production",
        shift: "Morning",
        time: "6:00 AM - 2:00 PM"
    },
    {
        id: 2,
        employee: "Arun",
        department: "Quality",
        shift: "Evening",
        time: "2:00 PM - 10:00 PM"
    },
    {
        id: 3,
        employee: "Vijay",
        department: "Maintenance",
        shift: "Night",
        time: "10:00 PM - 6:00 AM"
    }
];

function getShifts() {
    return shifts;
}

function addShift(employee, department, shift, time) {
    if (
        typeof employee !== "string" ||
        typeof department !== "string" ||
        typeof shift !== "string" ||
        typeof time !== "string" ||
        !employee.trim() ||
        !department.trim() ||
        !shift.trim() ||
        !time.trim()
    ) {
        return null;
    }

    const newId = shifts.length
        ? Math.max(...shifts.map(item => item.id)) + 1
        : 1;

    const newShift = {
        id: newId,
        employee: employee.trim(),
        department: department.trim(),
        shift: shift.trim(),
        time: time.trim()
    };

    shifts.push(newShift);

    return newShift;
}

function getEmployeeShifts(employee) {
    const name = String(employee || "").trim().toLowerCase();

    return shifts.filter(
        item => item.employee.trim().toLowerCase() === name
    );
}

function getDepartmentShifts(department) {
    const name = String(department || "").trim().toLowerCase();

    return shifts.filter(
        item => item.department.trim().toLowerCase() === name
    );
}

function getShiftById(id) {
    const shiftId = Number(id);

    return shifts.find(item => item.id === shiftId);
}

function updateShift(id, details) {
    const shift = getShiftById(id);

    if (!shift || !details || typeof details !== "object") {
        return null;
    }

    const fields = ["employee", "department", "shift", "time"];

    for (const field of fields) {
        if (
            typeof details[field] !== "string" ||
            !details[field].trim()
        ) {
            return null;
        }
    }

    shift.employee = details.employee.trim();
    shift.department = details.department.trim();
    shift.shift = details.shift.trim();
    shift.time = details.time.trim();

    return shift;
}

function deleteShift(id) {
    const index = shifts.findIndex(
        item => item.id === Number(id)
    );

    if (index === -1) {
        return null;
    }

    const removed = shifts.splice(index, 1);

    return removed[0];
}

function getShiftCount() {
    return shifts.length;
}

module.exports = {
    getShifts,
    addShift,
    getEmployeeShifts,
    getDepartmentShifts,
    getShiftById,
    updateShift,
    deleteShift,
    getShiftCount
};
