/**
 * main.js
 * 포즈 인식과 게임 로직을 초기화하고 서로 연결하는 진입점
 *
 * PoseEngine, GameEngine, Stabilizer를 조합하여 애플리케이션을 구동
 */

// 전역 변수
let authManager;
let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;

// 1. AuthManager 초기화
authManager = new AuthManager();

/**
 * Auth UI Helpers
 */
function showAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
}

function handleLogin() {
  const user = document.getElementById('login-username').value;
  const pass = document.getElementById('login-password').value;
  if (authManager.login(user, pass)) {
    finishAuth();
  }
}

function handleSignup() {
  const user = document.getElementById('signup-username').value;
  const pass = document.getElementById('signup-password').value;
  if (authManager.register(user, pass)) {
    showAuthTab('login');
  }
}

function finishAuth() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('logoutBtn').classList.remove('hidden');
  // Initialize game components after login
  initializeGame();
}

/**
 * 애플리케이션 초기화
 */
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let lastTime = 0;
let animationFrameId;

function initializeGame() {
  // 1. GameEngine 초기화 (Pre-initialize for Store access)
  gameEngine = new GameEngine();
}

// Auto-login check
window.onload = () => {
  if (authManager.currentUser) {
    finishAuth();
  }
};

async function init() {
  if (!authManager.currentUser) {
    alert("Please login first!");
    return;
  }

  startBtn.disabled = true;

  try {
    gameEngine.start();

    // 2. 키보드 이벤트 리스너 -> GameEngine에 연결
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 3. 게임 루프 시작
    lastTime = performance.now();
    gameLoop(lastTime);

    stopBtn.disabled = false;

  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("초기화에 실패했습니다. 콘솔을 확인하세요.");
    startBtn.disabled = false;
  }
}

function stop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function handleKeyDown(event) {
  if (gameEngine) gameEngine.handleInput(event.key, true);
}

function handleKeyUp(event) {
  if (gameEngine) gameEngine.handleInput(event.key, false);
}

function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  if (gameEngine) {
    gameEngine.update(deltaTime);
    gameEngine.draw();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Global exposure for HTML onclick
window.showAuthTab = showAuthTab;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.authManager = authManager;
window.init = init;
