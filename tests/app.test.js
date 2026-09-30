const {
    getShifts,
    addShift,
    findEmployeeShift,
    getShiftCount
} = require("../src/app");

test("should return factory shifts", () => {
    const shifts = getShifts();

    expect(shifts.length).toBeGreaterThan(0);
});

test("should add a new shift", () => {
    const shift = addShift(
        "Rahul",
        "Production",
        "Morning",
        "6:00 AM - 2:00 PM"
    );

    expect(shift.employee).toBe("Rahul");
});

test("should find employee shift", () => {
    const shift = findEmployeeShift("Kabilan");

    expect(shift).toBeDefined();
    expect(shift.employee).toBe("Kabilan");
});
test('returns total number of shifts', () => {
    expect(getShiftCount()).toBeGreaterThan(0);
});