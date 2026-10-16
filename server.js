
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const {
    getShifts,
    addShift,
    getEmployeeShifts,
    getDepartmentShifts,
    getShiftById,
    updateShift,
    deleteShift,
    getShiftCount
} = require("./src/app");

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, "users.json");
const REQUESTS_FILE = path.join(__dirname, "shift-requests.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: "fss.sid",
    secret: process.env.SESSION_SECRET || "change-this-fss-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 60 * 1000
    }
}));

function readJson(file, fallback) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
            return fallback;
        }

        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        console.error("Could not read " + path.basename(file), error.message);
        throw error;
    }
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function readUsers() {
    return readJson(USERS_FILE, []);
}

function readRequests() {
    return readJson(REQUESTS_FILE, []);
}

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please log in first." });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please log in first." });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            message: "Only administrators can perform this action."
        });
    }

    next();
}

function requireEmployee(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please log in first." });
    }

    if (req.session.user.role !== "employee") {
        return res.status(403).json({
            message: "This feature is for employee accounts."
        });
    }

    next();
}

function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
}

// Create the default admin if it does not already exist.
async function setupAdmin() {
    const users = readUsers();

    if (!users.some(user => user.username === "admin")) {
        users.push({
            name: "Administrator",
            username: "admin",
            passwordHash: await bcrypt.hash(
                process.env.ADMIN_PASSWORD || "Admin@123",
                10
            ),
            role: "admin"
        });

        writeJson(USERS_FILE, users);
        console.log("Default administrator created.");
    }

    readRequests();
}

// Login page and dashboards
app.get("/", (req, res) => {
    if (!req.session.user) return res.redirect("/login.html");

    return res.redirect(
        req.session.user.role === "admin" ? "/index.html" : "/employee.html"
    );
});

app.get("/index.html", (req, res) => {
    if (!req.session.user) return res.redirect("/login.html");

    if (req.session.user.role !== "admin") {
        return res.redirect("/employee.html");
    }

    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/employee.html", (req, res) => {
    if (!req.session.user) return res.redirect("/login.html");

    if (req.session.user.role !== "employee") {
        return res.redirect("/index.html");
    }

    res.sendFile(path.join(__dirname, "employee.html"));
});

// Registration: all self-registered accounts are employees.
app.post("/api/register", async (req, res) => {
    try {
        const { name, username, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof username !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !username.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: "Enter your name, username, and a password of at least 8 characters."
            });
        }

        const users = readUsers();
        const normalizedUsername = username.trim().toLowerCase();

        if (users.some(user => user.username === normalizedUsername)) {
            return res.status(409).json({
                message: "Username already exists."
            });
        }

        users.push({
            name: name.trim(),
            username: normalizedUsername,
            passwordHash: await bcrypt.hash(password, 10),
            role: "employee"
        });

        writeJson(USERS_FILE, users);

        res.status(201).json({
            message: "Registration successful. Please log in."
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ message: "Registration failed." });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !["admin", "employee"].includes(role)
        ) {
            return res.status(400).json({
                message: "Enter valid login details and select a role."
            });
        }

        const user = readUsers().find(
            item => item.username === username.trim().toLowerCase()
        );

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        if (user.role !== role) {
            return res.status(403).json({
                message: "This account is not registered as " + role + "."
            });
        }

        req.session.regenerate(error => {
            if (error) {
                return res.status(500).json({ message: "Could not start session." });
            }

            req.session.user = {
                username: user.username,
                name: user.name,
                role: user.role
            };

            req.session.save(saveError => {
                if (saveError) {
                    return res.status(500).json({ message: "Could not save session." });
                }

                res.json({
                    message: "Login successful.",
                    user: req.session.user
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Login failed." });
    }
});

app.get("/api/login/status", (req, res) => {
    res.json({
        loggedIn: Boolean(req.session.user),
        user: req.session.user || null
    });
});

app.post("/api/logout", requireLogin, (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({ message: "Logout failed." });
        }

        res.clearCookie("fss.sid");
        res.json({ message: "Logged out successfully." });
    });
});

// Admin sees all shifts; employees see their own shifts only.
app.get("/api/shifts", requireLogin, (req, res) => {
    if (req.session.user.role === "admin") {
        return res.json(getShifts());
    }

    return res.json(getEmployeeShifts(req.session.user.name));
});

app.get("/api/shifts/count", requireAdmin, (req, res) => {
    res.json({ count: getShiftCount() });
});

app.get("/api/shifts/department/:department", requireAdmin, (req, res) => {
    res.json(getDepartmentShifts(req.params.department));
});

app.get("/api/shifts/id/:id", requireLogin, (req, res) => {
    const shift = getShiftById(Number(req.params.id));

    if (!shift) {
        return res.status(404).json({ message: "Shift not found." });
    }

    if (
        req.session.user.role !== "admin" &&
        normalizeName(shift.employee) !== normalizeName(req.session.user.name)
    ) {
        return res.status(403).json({ message: "You cannot view this shift." });
    }

    res.json(shift);
});

// Admin can add shifts.
app.post("/api/shifts", requireAdmin, (req, res) => {
    const { employee, department, shift, time } = req.body;

    if (![employee, department, shift, time].every(
        value => typeof value === "string" && value.trim()
    )) {
        return res.status(400).json({ message: "Enter all shift details." });
    }

    const created = addShift(employee, department, shift, time);

    if (!created) {
        return res.status(400).json({ message: "Could not add shift." });
    }

    res.status(201).json(created);
});

// Admin can edit shifts.
app.put("/api/shifts/:id", requireAdmin, (req, res) => {
    const updated = updateShift(Number(req.params.id), req.body);

    if (!updated) {
        return res.status(400).json({
            message: "Shift not found or shift details are invalid."
        });
    }

    res.json(updated);
});

// Admin can delete shifts.
app.delete("/api/shifts/:id", requireAdmin, (req, res) => {
    const removed = deleteShift(Number(req.params.id));

    if (!removed) {
        return res.status(404).json({ message: "Shift not found." });
    }

    res.json({ message: "Shift deleted.", shift: removed });
});

// Employee: submit a request for one of their own shifts.
app.post("/api/shift-requests", requireEmployee, (req, res) => {
    const { shiftId, requestedShift, requestedTime, reason } = req.body;

    if (
        !Number.isInteger(Number(shiftId)) ||
        typeof requestedShift !== "string" ||
        typeof requestedTime !== "string" ||
        typeof reason !== "string" ||
        !requestedShift.trim() ||
        !requestedTime.trim() ||
        !reason.trim()
    ) {
        return res.status(400).json({
            message: "Select a shift, requested shift/time, and enter a reason."
        });
    }

    const shift = getShiftById(Number(shiftId));

    if (
        !shift ||
        normalizeName(shift.employee) !== normalizeName(req.session.user.name)
    ) {
        return res.status(403).json({
            message: "You can request changes only for your own assigned shifts."
        });
    }

    const requests = readRequests();

    const pendingExists = requests.some(request =>
        request.shiftId === shift.id &&
        request.status === "Pending" &&
        request.username === req.session.user.username
    );

    if (pendingExists) {
        return res.status(409).json({
            message: "You already have a pending request for this shift."
        });
    }

    const newRequest = {
        id: Date.now(),
        shiftId: shift.id,
        employee: req.session.user.name,
        username: req.session.user.username,
        department: shift.department,
        currentShift: shift.shift,
        currentTime: shift.time,
        requestedShift: requestedShift.trim(),
        requestedTime: requestedTime.trim(),
        reason: reason.trim(),
        status: "Pending",
        adminResponse: "",
        createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    writeJson(REQUESTS_FILE, requests);

    res.status(201).json({
        message: "Shift-change request submitted.",
        request: newRequest
    });
});

// Employees see only their own requests; admin sees all requests.
app.get("/api/shift-requests", requireLogin, (req, res) => {
    const requests = readRequests();

    if (req.session.user.role === "admin") {
        return res.json(requests);
    }

    res.json(requests.filter(
        request => request.username === req.session.user.username
    ));
});

// Admin approves or rejects a request.
app.patch("/api/shift-requests/:id", requireAdmin, (req, res) => {
    const { status, adminResponse } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
            message: "Status must be Approved or Rejected."
        });
    }

    const requests = readRequests();
    const request = requests.find(
        item => item.id === Number(req.params.id)
    );

    if (!request) {
        return res.status(404).json({ message: "Request not found." });
    }

    if (request.status !== "Pending") {
        return res.status(409).json({
            message: "This request has already been reviewed."
        });
    }

    if (status === "Approved") {
        const shift = getShiftById(request.shiftId);

        if (
            !shift ||
            normalizeName(shift.employee) !== normalizeName(request.employee)
        ) {
            return res.status(409).json({
                message: "The original shift no longer exists or has changed."
            });
        }

        const updated = updateShift(request.shiftId, {
            employee: shift.employee,
            department: shift.department,
            shift: request.requestedShift,
            time: request.requestedTime
        });

        if (!updated) {
            return res.status(500).json({
                message: "Could not update the shift."
            });
        }
    }

    request.status = status;
    request.adminResponse =
        typeof adminResponse === "string" ? adminResponse.trim() : "";
    request.reviewedAt = new Date().toISOString();

    writeJson(REQUESTS_FILE, requests);

    res.json({
        message: "Request " + status.toLowerCase() + ".",
        request
    });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "Server is running" });
});

// Never expose user credentials or saved requests as public static files.
app.use((req, res, next) => {
    if (["/users.json", "/shift-requests.json"].includes(req.path)) {
        return res.sendStatus(404);
    }
    next();
});

app.use(express.static(__dirname, {
    index: false,
    dotfiles: "ignore"
}));

setupAdmin()
    .then(() => {
        app.listen(PORT, () => {
            console.log("FSS server running at http://localhost:" + PORT);
        });
    })
    .catch(error => {
        console.error("FSS startup error:", error.message);
        process.exit(1);
    });
