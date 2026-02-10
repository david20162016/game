/**
 * gameEngine.js
 * Implements the fishing game state machine and physics.
 */

class GameEngine {
  constructor() {
    this.state = "IDLE"; // IDLE, READY, CAST, PLAYING, RESULT
    this.gauge = 0; // 0 to 100
    this.gaugeVelocity = 0;
    this.targetZone = { min: 40, max: 60 };
    this.catchTimer = 0;
    this.catchDuration = 10.0; // Seconds to win
    this.timeElapsed = 0;

    // Config
    this.gravity = 15; // % per second (slower falling)
    this.reelSpeed = 40; // % per second when reeling (faster rising)
    this.isReeling = false;

    // DOM Elements
    this.ui = {
      message: document.getElementById("message-area"),
      targetZone: document.getElementById("target-zone"),
      currentBar: document.getElementById("current-bar"),
      time: document.getElementById("time"),
      score: document.getElementById("score")
    };

    this.setMessage("Press 'R' to Start");
  }

  setMessage(msg) {
    if (this.ui.message) this.ui.message.textContent = msg;
  }

  handleInput(key, isPressed) {
    if (!isPressed) {
      if (key === "PageUp") this.isReeling = false;
      return;
    }

    // Key Down events
    switch (this.state) {
      case "IDLE":
        if (key.toLowerCase() === "r") {
          this.transitionTo("READY");
        }
        break;
      case "READY":
        if (key.toLowerCase() === "c") {
          this.transitionTo("CAST");
        }
        break;
      case "PLAYING":
        if (key === "PageUp") {
          this.isReeling = true;
        }
        break;
      case "RESULT":
        // Wait for timer to go back to IDLE
        break;
    }
  }

  transitionTo(newState) {
    this.state = newState;
    console.log("State changed to:", newState);

    switch (newState) {
      case "IDLE":
        this.setMessage("Press 'R' to Start");
        this.resetGame();
        break;
      case "READY":
        this.setMessage("Ready... Press 'C' to Cast!");
        this.gauge = 0;
        break;
      case "CAST":
        this.setMessage("Casting...");
        // Simulate casting delay
        setTimeout(() => {
          this.transitionTo("PLAYING");
        }, 2000);
        break;
      case "PLAYING":
        this.setMessage("Fish On! Keep the Red Line in Green Zone! (PageUp to Reel)");
        // Fixed target zone: 40-60%
        // this.randomizeTargetZone();
        this.gauge = 30; // Start at 30%
        this.catchTimer = 0;
        break;
      case "RESULT":
        // Message set by win/loss logic
        setTimeout(() => {
          this.transitionTo("IDLE");
        }, 3000);
        break;
    }
  }

  // randomizeTargetZone removed

  update(deltaTime) {
    if (this.state === "PLAYING") {
      // Physics
      if (this.isReeling) {
        this.gauge += this.reelSpeed * deltaTime;
      } else {
        this.gauge -= this.gravity * deltaTime;
      }

      // Constraints check (Win/Loss)
      if (this.gauge <= 0 || this.gauge >= 100) {
        this.gameResult(false, "Line Snapped!");
        return;
      }

      // Target Zone Check
      if (this.gauge >= this.targetZone.min && this.gauge <= this.targetZone.max) {
        this.catchTimer += deltaTime;
      }

      // Win Check
      if (this.catchTimer >= this.catchDuration) {
        this.gameResult(true, "Fish Caught!");
      }

      // UI Update
      if (this.ui.currentBar) {
        this.ui.currentBar.style.height = `${this.gauge}%`;
        // Change color based on tension?
      }
      if (this.ui.time) {
        this.ui.time.textContent = this.catchTimer.toFixed(1);
      }
    }
  }

  gameResult(isSuccess, reason) {
    if (isSuccess) {
      this.setMessage(`SUCCESS: ${reason}`);
      if (this.ui.score) this.ui.score.textContent = parseInt(this.ui.score.textContent) + 1;
    } else {
      this.setMessage(`FAILED: ${reason}`);
    }
    this.transitionTo("RESULT");
  }

  resetGame() {
    this.gauge = 0;
    this.catchTimer = 0;
    if (this.ui.currentBar) this.ui.currentBar.style.height = "0%";
    if (this.ui.time) this.ui.time.textContent = "0.0";
  }
}

// Export
window.GameEngine = GameEngine;
