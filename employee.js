
const myShifts = document.getElementById("myShifts");
const shiftSelect = document.getElementById("shiftId");
const requestForm = document.getElementById("requestForm");
const requestMessage = document.getElementById("requestMessage");
const myRequests = document.getElementById("myRequests");

async function api(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        window.location.href = "/login.html";
        throw new Error("Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function makeElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) element.className = className;

    return element;
}

async function loadDashboard() {
    try {
        const status = await api("/api/login/status");

        if (!status.loggedIn || status.user.role !== "employee") {
            window.location.href = "/login.html";
            return;
        }

        document.getElementById("employeeName").textContent =
            status.user.name;

        const shifts = await api("/api/shifts");
        myShifts.replaceChildren();
        shiftSelect.replaceChildren(
            new Option("Select a shift", "")
        );

        if (!shifts.length) {
            myShifts.textContent =
                "No shifts are currently assigned to your account.";
        }

        shifts.forEach(shift => {
            const card = document.createElement("article");
            card.className = "shift-card";

            card.append(
                makeElement("h3", shift.shift),
                makeElement("p", "Department: " + shift.department),
                makeElement("p", "Time: " + shift.time)
            );

            myShifts.appendChild(card);

            const option = new Option(
                shift.shift + " — " + shift.time,
                String(shift.id)
            );

            shiftSelect.appendChild(option);
        });

        await loadRequests();
    } catch (error) {
        myShifts.textContent = error.message;
    }
}

async function loadRequests() {
    const requests = await api("/api/shift-requests");
    myRequests.replaceChildren();

    if (!requests.length) {
        myRequests.textContent = "You have not submitted any requests yet.";
        return;
    }

    requests.slice().reverse().forEach(request => {
        const card = document.createElement("article");
        card.className = "request-card";

        card.append(
            makeElement("h3", "Request #" + request.id),
            makeElement("p", "Current shift: " +
                request.currentShift + " (" + request.currentTime + ")"),
            makeElement("p", "Requested shift: " +
                request.requestedShift + " (" + request.requestedTime + ")"),
            makeElement("p", "Reason: " + request.reason),
            makeElement("p", "Status: " + request.status, "status-label")
        );

        if (request.adminResponse) {
            card.append(
                makeElement("p", "Admin response: " + request.adminResponse)
            );
        }

        myRequests.appendChild(card);
    });
}

requestForm.addEventListener("submit", async event => {
    event.preventDefault();
    requestMessage.textContent = "Submitting request...";

    try {
        await api("/api/shift-requests", {
            method: "POST",
            body: JSON.stringify({
                shiftId: Number(shiftSelect.value),
                requestedShift: document.getElementById("requestedShift").value,
                requestedTime: document.getElementById("requestedTime").value.trim(),
                reason: document.getElementById("reason").value.trim()
            })
        });

        requestMessage.textContent = "Request submitted successfully.";
        requestForm.reset();

        await loadRequests();
    } catch (error) {
        requestMessage.textContent = error.message;
    }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
        await api("/api/logout", { method: "POST", body: "{}" });
    } finally {
        window.location.href = "/login.html";
    }
});

loadDashboard();

async function loadDashboard() {
    try {
        const status = await api("/api/login/status");

        if (!status.loggedIn || status.user.role !== "employee") {
            window.location.href = "/login.html";
            return;
        }

        const name = status.user.name || "Employee";

        document.getElementById("employeeName").textContent = name;
        document.getElementById("topEmployeeName").textContent = name;
        document.getElementById("profileAvatar").textContent =
            name.charAt(0).toUpperCase();

        const shifts = await api("/api/shifts");

        myShifts.replaceChildren();
        shiftSelect.replaceChildren(
            new Option("Select your shift", "")
        );

        document.getElementById("assignedShiftCount").textContent =
            shifts.length;

        document.getElementById("workingHours").textContent =
            shifts.length ? "8 hrs" : "0 hrs";

        if (!shifts.length) {
            myShifts.appendChild(
                makeElement(
                    "p",
                    "No shifts are currently assigned to your account.",
                    "empty-state"
                )
            );
        }

        shifts.forEach(shift => {
            const card = document.createElement("article");
            card.className = "shift-card";

            card.append(
                makeElement("h3", shift.shift + " Shift"),
                makeElement("p", "Department: " + shift.department),
                makeElement("p", "Working Hours: " + shift.time)
            );

            myShifts.appendChild(card);

            shiftSelect.appendChild(
                new Option(
                    shift.shift + " — " + shift.time,
                    String(shift.id)
                )
            );
        });

        await loadRequests();
    } catch (error) {
        myShifts.textContent = error.message;
    }
}
