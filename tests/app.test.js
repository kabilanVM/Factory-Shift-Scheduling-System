
const {
    getShifts,
    addShift,
    findEmployeeShift,
    getDepartmentShifts,
    getShiftById,
    getShiftCount
} = require("../src/app");

test("should return factory shifts", () => {
    expect(getShifts().length).toBeGreaterThan(0);
});

test("should add a new shift", () => {
    const shift = addShift(
        "Rahul",
        "Production",
        "Morning",
        "6:00 AM - 2:00 PM"
    );

    expect(shift.employee).toBe("Rahul");
    expect(shift.department).toBe("Production");
});

test("should reject shift with missing details", () => {
    const result = addShift(
        "",
        "Production",
        "Morning",
        "6:00 AM - 2:00 PM"
    );

    expect(result).toBeNull();
});

test("should find employee shift", () => {
    const shift = findEmployeeShift("Kabilan");

    expect(shift).toBeDefined();
    expect(shift.employee).toBe("Kabilan");
});

test("should find employee regardless of letter case", () => {
    const shift = findEmployeeShift("kAbIlAn");

    expect(shift).toBeDefined();
    expect(shift.employee).toBe("Kabilan");
});

test("should return undefined for unknown employee", () => {
    expect(findEmployeeShift("Unknown")).toBeUndefined();
});

test("should return shifts for a department", () => {
    const result = getDepartmentShifts("Quality");

    expect(result.length).toBeGreaterThan(0);
    expect(result.every(s => s.department === "Quality")).toBe(true);
});

test("should return empty list for unknown department", () => {
    expect(getDepartmentShifts("Unknown")).toEqual([]);
});

test("should find shift by ID", () => {
    const shift = getShiftById(1);

    expect(shift).toBeDefined();
    expect(shift.employee).toBe("Kabilan");
});

test("should return undefined for unknown shift ID", () => {
    expect(getShiftById(-1)).toBeUndefined();
});

test("should return total number of shifts", () => {
    expect(getShiftCount()).toBe(getShifts().length);
});
