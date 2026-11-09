import { GameEngine } from './game/Engine';
import { Gear } from './game/Physics';
import { SupercarBrand } from './game/Supercars';
import { MissionType } from './game/Missions';
import { sounds } from './game/Audio';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const engine = new GameEngine(container);

  // UI Elements
  const speedVal = document.getElementById('speed-val')!;
  const steerPill = document.getElementById('steer-pill')!;
  const wheelImg = document.getElementById('wheel-img')!;
  const pedalGas = document.getElementById('pedal-gas')!;
  const gasImg = document.getElementById('gas-img')!;
  const pedalBrake = document.getElementById('pedal-brake')!;
  const blinkL = document.getElementById('btn-blink-l')!;
  const blinkR = document.getElementById('btn-blink-r')!;
  const btnHorn = document.getElementById('btn-horn')!;
  const gearSlots = document.querySelectorAll('.gear-slot');

  const hudMTitle = document.getElementById('hud-m-title')!;
  const hudMDesc = document.getElementById('hud-m-desc')!;
  const hudMProgress = document.getElementById('hud-m-progress')!;

  const btnCam = document.getElementById('btn-cam')!;
  const btnAudio = document.getElementById('btn-audio')!;
  const btnMenu = document.getElementById('btn-menu')!;
  const modalScreen = document.getElementById('modal-screen')!;
  const btnStart = document.getElementById('btn-start')!;

  // Steering wheel state
  let isDraggingWheel = false;
  let currentWheelAngle = 0;
  let lastTouchAngle = 0;
  const maxWheelDegrees = 450;

  // Key states
  const keys: Record<string, boolean> = {};

  // Turn signal state
  let activeBlinker: 'LEFT' | 'RIGHT' | null = null;
  let blinkerTimer: number | null = null;

  // 1. Steering Wheel Rotation
  function getCenter(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function getAngle(x: number, y: number, cx: number, cy: number) {
    return Math.atan2(y - cy, x - cx) * (180 / Math.PI);
  }

  wheelImg.addEventListener('pointerdown', (e: PointerEvent) => {
    isDraggingWheel = true;
    sounds.init();
    sounds.resume();
    const c = getCenter(wheelImg);
    lastTouchAngle = getAngle(e.clientX, e.clientY, c.x, c.y);
    wheelImg.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDraggingWheel) return;
    const c = getCenter(wheelImg);
    const angle = getAngle(e.clientX, e.clientY, c.x, c.y);
    let delta = angle - lastTouchAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    currentWheelAngle = Math.max(-maxWheelDegrees, Math.min(maxWheelDegrees, currentWheelAngle + delta));
    lastTouchAngle = angle;
    updateWheelDisplay();
  });

  const stopWheelDrag = (e?: PointerEvent) => {
    if (isDraggingWheel && e && wheelImg.hasPointerCapture(e.pointerId)) {
      wheelImg.releasePointerCapture(e.pointerId);
    }
    isDraggingWheel = false;
  };

  wheelImg.addEventListener('pointerup', stopWheelDrag);
  wheelImg.addEventListener('pointercancel', stopWheelDrag);

  function updateWheelDisplay() {
    wheelImg.style.transform = `rotate(${currentWheelAngle}deg)`;
    steerPill.innerText = `${Math.round(currentWheelAngle)}°`;
    engine.physics.steerInput = currentWheelAngle / maxWheelDegrees;
  }

  // 2. Gas & Brake Pedals
  pedalGas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sounds.init();
    sounds.resume();
    gasImg.classList.add('pressed');
    engine.physics.throttle = 1.0;
  });

  const releaseGas = () => {
    gasImg.classList.remove('pressed');
    if (!keys['KeyW'] && !keys['ArrowUp']) engine.physics.throttle = 0;
  };
  pedalGas.addEventListener('pointerup', releaseGas);
  pedalGas.addEventListener('pointerleave', releaseGas);
  pedalGas.addEventListener('pointercancel', releaseGas);

  pedalBrake.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sounds.init();
    sounds.resume();
    pedalBrake.classList.add('pressed');
    engine.physics.brake = 1.0;
    sounds.playBrakeScreech();
  });

  const releaseBrake = () => {
    pedalBrake.classList.remove('pressed');
    if (!keys['KeyS'] && !keys['ArrowDown']) engine.physics.brake = 0;
  };
  pedalBrake.addEventListener('pointerup', releaseBrake);
  pedalBrake.addEventListener('pointerleave', releaseBrake);
  pedalBrake.addEventListener('pointercancel', releaseBrake);

  // 3. Transmission Shifter (P - R - N - D)
  function setGear(g: Gear) {
    sounds.init();
    sounds.resume();
    engine.physics.shiftGear(g);
    gearSlots.forEach(slot => {
      const val = slot.getAttribute('data-gear');
      slot.classList.remove('active', 'reverse');
      if (val === g) {
        slot.classList.add('active');
        if (g === 'R') slot.classList.add('reverse');
      }
    });
  }

  gearSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      const g = slot.getAttribute('data-gear') as Gear;
      if (g) setGear(g);
    });
  });

  // 4. Indian Desi Musical Horn
  btnHorn.addEventListener('click', () => {
    sounds.init();
    sounds.resume();
    sounds.playIndianHorn();
  });

  // 5. Turn Signals
  function toggleBlinker(side: 'LEFT' | 'RIGHT') {
    sounds.init();
    sounds.resume();
    if (activeBlinker === side) {
      activeBlinker = null;
      if (blinkerTimer) clearInterval(blinkerTimer);
      blinkerTimer = null;
      blinkL.classList.remove('active');
      blinkR.classList.remove('active');
    } else {
      activeBlinker = side;
      if (blinkerTimer) clearInterval(blinkerTimer);
      blinkL.classList.remove('active');
      blinkR.classList.remove('active');

      let state = true;
      const btn = side === 'LEFT' ? blinkL : blinkR;
      btn.classList.add('active');
      sounds.playBlinker();

      blinkerTimer = window.setInterval(() => {
        state = !state;
        btn.classList.toggle('active', state);
        sounds.playBlinker();
      }, 480);
    }
  }

  blinkL.addEventListener('click', () => toggleBlinker('LEFT'));
  blinkR.addEventListener('click', () => toggleBlinker('RIGHT'));

  // 6. Camera & Audio Buttons
  btnCam.addEventListener('click', () => {
    sounds.init();
    sounds.resume();
    const v = engine.cycleCameraView();
    btnCam.innerText = `CAM: ${v}`;
  });

  btnAudio.addEventListener('click', () => {
    sounds.init();
    sounds.resume();
    const muted = sounds.toggleMute();
    btnAudio.innerText = `AUDIO: ${muted ? 'OFF' : 'ON'}`;
  });

  btnMenu.addEventListener('click', () => {
    modalScreen.style.display = 'flex';
    engine.pause();
  });

  // 7. Keyboard Controls
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    sounds.init();
    sounds.resume();

    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      engine.physics.throttle = 1.0;
      gasImg.classList.add('pressed');
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      engine.physics.brake = 1.0;
      pedalBrake.classList.add('pressed');
      sounds.playBrakeScreech();
    }
    if (e.code === 'KeyP') setGear('P');
    if (e.code === 'KeyR') setGear('R');
    if (e.code === 'KeyN') setGear('N');
    if (e.code === 'KeyD') setGear('D');
    if (e.code === 'KeyH') sounds.playIndianHorn();
    if (e.code === 'KeyC') {
      const v = engine.cycleCameraView();
      btnCam.innerText = `CAM: ${v}`;
    }
    if (e.code === 'KeyM') {
      const muted = sounds.toggleMute();
      btnAudio.innerText = `AUDIO: ${muted ? 'OFF' : 'ON'}`;
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      engine.physics.throttle = 0;
      gasImg.classList.remove('pressed');
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      engine.physics.brake = 0;
      pedalBrake.classList.remove('pressed');
    }
  });

  // 8. Garage Supercar Selection
  let selectedBrand: SupercarBrand = 'FERRARI';
  document.querySelectorAll('.car-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.car-opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedBrand = btn.getAttribute('data-brand') as SupercarBrand;
      engine.selectSupercar(selectedBrand);
    });
  });

  // 9. Mission Selection
  let selectedMission: MissionType = 'VIP_PARKING';
  document.querySelectorAll('.m-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMission = btn.getAttribute('data-mission') as MissionType;
    });
  });

  btnStart.addEventListener('click', () => {
    sounds.init();
    sounds.resume();
    engine.missions.setMission(selectedMission);
    engine.reset(3.6, -60, 0);
    modalScreen.style.display = 'none';
    engine.start();
  });

  // 10. Main Telemetry & HUD Update Loop
  function updateHUD() {
    requestAnimationFrame(updateHUD);

    const t = engine.physics.getTelemetry();
    speedVal.innerText = `${t.speedKmh}`;

    // Spring return for steering wheel
    const isKeySteering = keys['KeyA'] || keys['KeyD'] || keys['ArrowLeft'] || keys['ArrowRight'];
    if (isKeySteering) {
      if (keys['KeyA'] || keys['ArrowLeft']) currentWheelAngle = Math.max(-maxWheelDegrees, currentWheelAngle - 20);
      if (keys['KeyD'] || keys['ArrowRight']) currentWheelAngle = Math.min(maxWheelDegrees, currentWheelAngle + 20);
      updateWheelDisplay();
    } else if (!isDraggingWheel) {
      if (Math.abs(currentWheelAngle) > 0.5) {
        currentWheelAngle *= 0.88;
        updateWheelDisplay();
      } else if (currentWheelAngle !== 0) {
        currentWheelAngle = 0;
        updateWheelDisplay();
      }
    }

    // Mission HUD
    const m = engine.missions.currentMission;
    hudMTitle.innerText = `${m.title} (${Math.ceil(m.timeRemaining)}s)`;
    hudMDesc.innerText = m.description;
    const progress = Math.min(100, Math.max(0, (m.currentValue / m.targetValue) * 100));
    hudMProgress.style.width = `${progress}%`;

    // Victory / Game Over Modal
    if (m.isComplete) {
      engine.pause();
      modalScreen.style.display = 'flex';
      btnStart.innerText = 'MISSION CLEAR! DRIVE AGAIN';
      const sub = document.querySelector('.modal-subtitle') as HTMLElement;
      if (sub) {
        sub.innerHTML = `<span style="color:#00ff66;font-size:20px;">MISSION ACCOMPLISHED!</span><br/>Supercar speed in Indian Village! Re-engineered by <strong>Abhijeet kangane</strong>`;
      }
    } else if (m.isFailed) {
      engine.pause();
      modalScreen.style.display = 'flex';
      btnStart.innerText = 'RETRY MISSION';
      const sub = document.querySelector('.modal-subtitle') as HTMLElement;
      if (sub) {
        sub.innerHTML = `<span style="color:#ff2244;font-size:20px;">FAILED: ${m.failReason}</span><br/>Re-engineered by <strong>Abhijeet kangane</strong>`;
      }
    }
  }

  updateHUD();
});
