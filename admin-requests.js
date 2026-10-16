
const adminRequests = document.getElementById("adminRequests");

async function adminApi(url, options = {}) {
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
        throw new Error("Please log in.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

function adminText(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
}

async function loadAdminRequests() {
    try {
        const status = await adminApi("/api/login/status");

        if (!status.loggedIn || status.user.role !== "admin") {
            window.location.href = "/login.html";
            return;
        }

        const requests = await adminApi("/api/shift-requests");
        adminRequests.replaceChildren();

        if (!requests.length) {
            adminRequests.textContent = "No shift-change requests yet.";
            return;
        }

        requests.slice().reverse().forEach(request => {
            const card = document.createElement("article");
            card.className = "request-card";

            card.append(
                adminText("h3", request.employee + " — Request #" + request.id),
                adminText("p", "Department: " + request.department),
                adminText("p", "Current: " +
                    request.currentShift + " (" + request.currentTime + ")"),
                adminText("p", "Requested: " +
                    request.requestedShift + " (" + request.requestedTime + ")"),
                adminText("p", "Reason: " + request.reason),
                adminText("p", "Status: " + request.status)
            );

            if (request.adminResponse) {
                card.append(
                    adminText("p", "Previous response: " + request.adminResponse)
                );
            }

            if (request.status === "Pending") {
                const responseInput = document.createElement("input");
                responseInput.type = "text";
                responseInput.placeholder = "Optional response to employee";
                responseInput.className = "admin-response-input";

                const approve = document.createElement("button");
                approve.type = "button";
                approve.textContent = "Approve";
                approve.className = "btn-primary";

                const reject = document.createElement("button");
                reject.type = "button";
                reject.textContent = "Reject";
                reject.className = "btn-secondary";

                approve.addEventListener("click", () =>
                    reviewRequest(request.id, "Approved", responseInput.value)
                );

                reject.addEventListener("click", () =>
                    reviewRequest(request.id, "Rejected", responseInput.value)
                );

                const actions = document.createElement("div");
                actions.className = "request-actions";
                actions.append(approve, reject);

                card.append(responseInput, actions);
            }

            adminRequests.appendChild(card);
        });
    } catch (error) {
        adminRequests.textContent = error.message;
    }
}

async function reviewRequest(id, status, adminResponse) {
    try {
        await adminApi("/api/shift-requests/" + id, {
            method: "PATCH",
            body: JSON.stringify({ status, adminResponse })
        });

        await loadAdminRequests();
        alert("Request " + status.toLowerCase() + ".");
    } catch (error) {
        alert(error.message);
    }
}

loadAdminRequests();
