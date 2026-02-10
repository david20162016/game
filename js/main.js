/**
 * main.js
 * 포즈 인식과 게임 로직을 초기화하고 서로 연결하는 진입점
 *
 * PoseEngine, GameEngine, Stabilizer를 조합하여 애플리케이션을 구동
 */

// 전역 변수
let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;

/**
 * 애플리케이션 초기화
 */
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// gameEngine is already declared globally
let lastTime = 0;
let animationFrameId;

async function init() {
  startBtn.disabled = true;

  try {
    // 1. GameEngine 초기화
    gameEngine = new GameEngine();

    // 2. 키보드 이벤트 리스너 -> GameEngine에 연결
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 3. 게임 루프 시작
    lastTime = performance.now();
    gameLoop(lastTime);

    stopBtn.disabled = false;

    // PoseEngine related setup (ignored for now as per rules)
    // If needed, can added back here later.

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

  if (gameEngine) {
    // maybe added stop method if needed
  }

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
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Unused prediction callback logic for now
function handlePrediction(predictions, pose) { }
function drawPose(pose) { }
