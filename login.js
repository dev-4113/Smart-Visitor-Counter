
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {
        const response = await fetch("http://localhost:5000/api/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.message || "Login failed");
        }

        // Store the short-lived token for this browser session
        sessionStorage.setItem("adminToken", data.token);
        sessionStorage.setItem("adminEmail", data.admin.email);

        message.style.color = "#4ade80";
        message.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 700);

    } catch (error) {
        message.style.color = "#f87171";
        message.textContent = error.message;

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});
