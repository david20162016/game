/**
 * authManager.js
 * Handles local user authentication using localStorage
 */

class AuthManager {
    constructor() {
        this.USERS_KEY = "circleSurvivor_users";
        this.CURRENT_USER_KEY = "circleSurvivor_currentUser";
        this.loadUsers();
    }

    loadUsers() {
        this.users = JSON.parse(localStorage.getItem(this.USERS_KEY) || "{}");
        this.currentUser = localStorage.getItem(this.CURRENT_USER_KEY) || null;
    }

    /**
     * Register a new user
     * @param {string} username 
     * @param {string} password 
     * @returns {boolean}
     */
    register(username, password) {
        this.loadUsers();
        if (this.users[username]) {
            alert("Username already exists!");
            return false;
        }

        this.users[username] = {
            password: password,
            coins: 0,
            inventory: {},
            highScore: 0,
            level: 1,
            color: "#00ffff"
        };

        this.saveUsers();
        alert("Signup successful! Please login.");
        return true;
    }

    /**
     * Login a user
     * @param {string} username 
     * @param {string} password 
     * @returns {boolean}
     */
    login(username, password) {
        this.loadUsers();
        const user = this.users[username];
        if (user && user.password === password) {
            this.currentUser = username;
            localStorage.setItem(this.CURRENT_USER_KEY, username);
            return true;
        }
        alert("Invalid username or password!");
        return false;
    }

    /**
     * Logout current user
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.CURRENT_USER_KEY);
        window.location.reload(); // Simple way to reset game state
    }

    /**
     * Save game data for the current user
     * @param {object} data 
     */
    saveUserData(data) {
        if (!this.currentUser) return;
        this.loadUsers();
        this.users[this.currentUser] = {
            ...this.users[this.currentUser],
            ...data
        };
        this.saveUsers();
    }

    /**
     * Get current user's data
     * @returns {object|null}
     */
    getUserData() {
        if (!this.currentUser) return null;
        return this.users[this.currentUser];
    }

    saveUsers() {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));
    }
}

window.AuthManager = AuthManager;
