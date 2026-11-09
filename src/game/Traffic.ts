import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export interface TrafficCar {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: number; // m/s
  laneX: number;
  direction: 1 | -1;
  length: number;
  width: number;
}

export class TrafficSystem {
  public group: THREE.Group = new THREE.Group();
  public cars: TrafficCar[] = [];
  public isLoaded: boolean = false;

  constructor() {
    this.initTraffic();
  }

  private async initTraffic() {
    this.group = new THREE.Group();
    const objLoader = new OBJLoader();
    const texLoader = new THREE.TextureLoader();

    try {
      // 1. Load AI Car 1 (Sedan)
      const tex1 = await texLoader.loadAsync('/assets/cars/AI_car01.png');
      tex1.colorSpace = THREE.SRGBColorSpace;
      const mat1 = new THREE.MeshStandardMaterial({ map: tex1, roughness: 0.5 });
      const obj1 = await objLoader.loadAsync('/assets/cars/AI_car01.obj');
      obj1.traverse((c) => {
        if (c instanceof THREE.Mesh) c.material = mat1;
      });

      // 2. Load AI Car 2 (Van)
      const tex2 = await texLoader.loadAsync('/assets/cars/AI_car02.png');
      tex2.colorSpace = THREE.SRGBColorSpace;
      const mat2 = new THREE.MeshStandardMaterial({ map: tex2, roughness: 0.5 });
      const obj2 = await objLoader.loadAsync('/assets/cars/AI_car02.obj');
      obj2.traverse((c) => {
        if (c instanceof THREE.Mesh) c.material = mat2;
      });

      // 3. Load Tires
      const tireTex = await texLoader.loadAsync('/assets/envi/tire.png');
      tireTex.colorSpace = THREE.SRGBColorSpace;
      const tireMat = new THREE.MeshStandardMaterial({ map: tireTex, roughness: 0.8 });
      const tireObj = await objLoader.loadAsync('/assets/envi/tire.obj');
      tireObj.traverse((c) => {
        if (c instanceof THREE.Mesh) c.material = tireMat;
      });
      tireObj.scale.set(0.42, 0.42, 0.42);

      const prototypes = [obj1, obj2];

      // Lane configurations on Dr. Driving avenue (Avenue road spans from -16 to +16)
      // Lanes traveling forward (+Z): X = 4.2, 8.5
      // Lanes traveling backward (-Z): X = -4.2, -8.5
      const forwardLanes = [4.2, 8.5];
      const backwardLanes = [-4.2, -8.5];

      for (let i = 0; i < 14; i++) {
        const isForward = Math.random() > 0.5;
        const direction: 1 | -1 = isForward ? 1 : -1;
        const lanes = isForward ? forwardLanes : backwardLanes;
        const laneX = lanes[Math.floor(Math.random() * lanes.length)];
        const initialZ = (Math.random() * 300) - 150;

        const carGroup = new THREE.Group();
        const baseProto = prototypes[i % prototypes.length].clone();
        carGroup.add(baseProto);

        // Mount wheels
        [-1.2, 1.2].forEach(wx => {
          [-1.5, 1.5].forEach(wz => {
            const t = tireObj.clone();
            t.position.set(wx, 0.38, wz);
            carGroup.add(t);
          });
        });

        if (direction === -1) {
          carGroup.rotation.y = Math.PI;
        }

        carGroup.position.set(laneX, 0, initialZ);
        this.group.add(carGroup);

        this.cars.push({
          mesh: carGroup,
          position: carGroup.position,
          velocity: 11 + Math.random() * 6, // ~40 - 60 km/h
          laneX,
          direction,
          length: 4.8,
          width: 2.2
        });
      }

      this.isLoaded = true;
    } catch (e) {
      console.warn("Failed loading official traffic cars, fallback active:", e);
    }
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    if (!this.isLoaded) return;

    this.cars.forEach((car, idx) => {
      let desiredSpeed = car.velocity;
      let shouldBrake = false;

      // Check distance to car ahead
      for (let j = 0; j < this.cars.length; j++) {
        if (idx === j) continue;
        const other = this.cars[j];
        if (Math.abs(other.laneX - car.laneX) < 1.5) {
          const distZ = (other.position.z - car.position.z) * car.direction;
          if (distZ > 0 && distZ < 16) {
            desiredSpeed = Math.min(desiredSpeed, other.velocity * 0.8);
            shouldBrake = true;
          }
        }
      }

      // Check distance to player
      if (Math.abs(playerPos.x - car.laneX) < 1.8) {
        const distToPlayer = (playerPos.z - car.position.z) * car.direction;
        if (distToPlayer > 0 && distToPlayer < 18) {
          desiredSpeed = 0;
          shouldBrake = true;
        }
      }

      const actualSpeed = shouldBrake ? Math.max(0, desiredSpeed) : car.velocity;
      car.position.z += car.direction * actualSpeed * dt;

      // Loop recycle
      if (car.position.z > 210) car.position.z = -210;
      else if (car.position.z < -210) car.position.z = 210;
    });
  }

  public checkPlayerCollision(playerBox: THREE.Box3): TrafficCar | null {
    if (!this.isLoaded) return null;
    for (const car of this.cars) {
      const carBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(car.position.x, 1.0, car.position.z),
        new THREE.Vector3(car.width, 1.8, car.length)
      );
      if (playerBox.intersectsBox(carBox)) {
        return car;
      }
    }
    return null;
  }
}
