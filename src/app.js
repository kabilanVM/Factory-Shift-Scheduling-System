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
    const newShift = {
        id: shifts.length + 1,
        employee,
        department,
        shift,
        time
    };

    shifts.push(newShift);
    return newShift;
}

function findEmployeeShift(employee) {
    return shifts.find(
        shift => shift.employee.toLowerCase() === employee.toLowerCase()
    );
}
function getDepartmentShifts(department) {
    return shifts.filter(shift => shift.department === department);
}

module.exports = {
    getShifts,
    addShift,
    findEmployeeShift,
    getDepartmentShifts
};