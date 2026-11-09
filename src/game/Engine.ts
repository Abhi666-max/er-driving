import * as THREE from 'three';
import { SupercarRenderer, SupercarBrand } from './Supercars';
import { VehiclePhysics } from './Physics';
import { IndianVillageEnvironment } from './IndianVillage';
import { IndianTrafficSystem } from './IndianTraffic';
import { MissionManager } from './Missions';
import { sounds } from './Audio';

export type CameraView = 'CHASE' | 'COCKPIT' | 'HOOD';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public car: SupercarRenderer;
  public physics: VehiclePhysics;
  public village: IndianVillageEnvironment;
  public traffic: IndianTrafficSystem;
  public missions: MissionManager;

  public currentCameraView: CameraView = 'CHASE';
  private cameraSmoothPos: THREE.Vector3 = new THREE.Vector3(3.6, 3.5, 12);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();

  private isRunning: boolean = false;
  private lastTime: number = 0;

  constructor(canvasContainer: HTMLElement) {
    // 1. Scene setup: Vibrant Indian Sunny Sky
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5ca5e8); // Indian Golden-Hour Sky Blue
    this.scene.fog = new THREE.FogExp2(0xcde0f4, 0.0022); // Warm horizon haze

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.2,
      1200
    );

    // 3. WebGL Renderer with High Dynamic Range & Crisp Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25; // Bright sunny exposure
    canvasContainer.appendChild(this.renderer.domElement);

    // 4. Bright Indian Daytime Sun
    this.setupIndianSunlight();

    // 5. Game Subsystems
    this.physics = new VehiclePhysics();
    this.car = new SupercarRenderer('FERRARI');
    this.scene.add(this.car.group);

    this.village = new IndianVillageEnvironment();
    this.scene.add(this.village.group);

    this.traffic = new IndianTrafficSystem(15);
    this.scene.add(this.traffic.group);

    this.missions = new MissionManager('VIP_PARKING');

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupIndianSunlight() {
    // Warm Skylight Ambient
    const hemiLight = new THREE.HemisphereLight(0xfff6df, 0x887755, 1.1);
    this.scene.add(hemiLight);

    // Bright Tropical Sunshine
    const sunLight = new THREE.DirectionalLight(0xfffaea, 2.4);
    sunLight.position.set(60, 110, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 240;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0003;
    this.scene.add(sunLight);

    const groundBounce = new THREE.AmbientLight(0xffeedd, 0.5);
    this.scene.add(groundBounce);
  }

  public selectSupercar(brand: SupercarBrand) {
    this.car.setBrand(brand);
  }

  public setCameraView(view: CameraView) {
    this.currentCameraView = view;
  }

  public cycleCameraView(): CameraView {
    if (this.currentCameraView === 'CHASE') this.currentCameraView = 'COCKPIT';
    else if (this.currentCameraView === 'COCKPIT') this.currentCameraView = 'HOOD';
    else this.currentCameraView = 'CHASE';
    return this.currentCameraView;
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isRunning = false;
  }

  public reset(spawnX: number = 3.6, spawnZ: number = -60, spawnHeading: number = 0) {
    this.physics.reset(spawnX, spawnZ, spawnHeading);
    this.car.update(this.physics);
    this.missions.setMission(this.missions.currentMission.type);
    this.cameraSmoothPos.set(spawnX, 3.5, spawnZ - 8.5);
  }

  private loop(time: number) {
    if (!this.isRunning) return;
    requestAnimationFrame(this.loop.bind(this));

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.render();
  }

  private update(dt: number) {
    // 1. Update Physics
    this.physics.update(dt);

    // 2. Collision checks against Village huts, trees, Dhaba
    const playerBox = this.physics.getBoundingBox();

    for (const obs of this.village.collisionObstacles) {
      if (playerBox.intersectsBox(obs)) {
        if (!this.physics.isCollided) {
          this.physics.isCollided = true;
          sounds.playCrash();
        }
      }
    }

    // Check Indian Traffic collisions (Tuk-Tuk, Desi Truck, Tractor)
    const hitVehicle = this.traffic.checkPlayerCollision(playerBox);
    if (hitVehicle) {
      if (!this.physics.isCollided) {
        this.physics.isCollided = true;
        sounds.playCrash();
      }
    }

    // 3. Update Car 3D Model
    this.car.update(this.physics);

    // 4. Update Village & Indian Traffic
    this.village.update(dt);
    this.traffic.update(dt, this.physics.position);

    // 5. Update Mission Logic
    this.updateVillageMission(dt);

    // 6. Update Dynamic Camera
    this.updateCamera(dt);
  }

  private updateVillageMission(dt: number) {
    const m = this.missions.currentMission;
    if (m.isComplete || m.isFailed) return;

    m.timeRemaining -= dt;
    if (m.timeRemaining <= 0) {
      m.isFailed = true;
      m.failReason = 'TIME OUT';
      return;
    }

    if (this.physics.isCollided) {
      m.isFailed = true;
      m.failReason = 'VEHICLE CRASHED';
      return;
    }

    // VIP Parking outside Dhaba
    if (m.type === 'VIP_PARKING' && this.village.parkingBays.length > 0) {
      const bay = this.village.parkingBays[0];
      const dist = this.physics.position.distanceTo(bay.center);
      if (dist < 4.0) {
        const isStopped = Math.abs(this.physics.speedKmh) < 0.5;
        const isParkGear = this.physics.gear === 'P';

        if (isStopped && isParkGear) {
          m.currentValue = 100;
          m.isComplete = true;
          sounds.playSuccessChime();
        } else {
          m.currentValue = Math.min(90, Math.round((1 - dist / 4.0) * 90));
        }
      } else {
        m.currentValue = 0;
      }
    } else if (m.type === 'HIGHWAY_SPEED') {
      if (this.physics.speedKmh >= 70) {
        m.currentValue += dt;
        if (m.currentValue >= 15) {
          m.isComplete = true;
          sounds.playSuccessChime();
        }
      }
    } else if (m.type === 'COMFORT_DRIVE') {
      m.currentValue = Math.round(this.physics.passengerComfort);
      if (this.physics.passengerComfort < 60) {
        m.isFailed = true;
        m.failReason = 'VIOLENT DRIVING / SICK PASSENGER';
      } else if (m.timeRemaining <= 0.2) {
        m.isComplete = true;
        sounds.playSuccessChime();
      }
    }
  }

  private updateCamera(dt: number) {
    const heading = this.physics.heading;
    const forward = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
    const up = new THREE.Vector3(0, 1, 0);

    if (this.currentCameraView === 'CHASE') {
      // Dynamic High-Speed Supercar Chase Camera
      const speedFactor = Math.min(Math.abs(this.physics.speedKmh) / 200, 1);
      const cameraDistance = 6.8 + speedFactor * 1.8;
      const cameraHeight = 2.4 + speedFactor * 0.4;

      const targetPos = this.physics.position.clone()
        .sub(forward.clone().multiplyScalar(cameraDistance))
        .add(up.clone().multiplyScalar(cameraHeight));

      this.cameraSmoothPos.lerp(targetPos, Math.min(dt * 10, 1));
      this.camera.position.copy(this.cameraSmoothPos);

      this.cameraLookTarget.copy(this.physics.position).add(up.clone().multiplyScalar(1.0));
      this.camera.lookAt(this.cameraLookTarget);

    } else if (this.currentCameraView === 'COCKPIT') {
      // Cockpit View looking across the highway
      const driverPos = this.physics.position.clone()
        .add(up.clone().multiplyScalar(1.02))
        .add(forward.clone().multiplyScalar(0.1));

      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      driverPos.add(right.clone().multiplyScalar(-0.4));

      this.camera.position.copy(driverPos);
      const lookAhead = driverPos.clone().add(forward.clone().multiplyScalar(18)).add(up.clone().multiplyScalar(-0.1));
      this.camera.lookAt(lookAhead);

    } else if (this.currentCameraView === 'HOOD') {
      // Low Ground Bumper Cam
      const hoodPos = this.physics.position.clone()
        .add(up.clone().multiplyScalar(0.68))
        .add(forward.clone().multiplyScalar(1.8));

      this.camera.position.copy(hoodPos);
      const lookAhead = hoodPos.clone().add(forward.clone().multiplyScalar(24));
      this.camera.lookAt(lookAhead);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
