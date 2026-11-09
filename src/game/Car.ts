import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { VehiclePhysics } from './Physics';

export class CarModel {
  public group: THREE.Group = new THREE.Group();
  private carBodyMesh: THREE.Object3D | null = null;
  private wheelFL: THREE.Group = new THREE.Group();
  private wheelFR: THREE.Group = new THREE.Group();
  private wheelRL: THREE.Group = new THREE.Group();
  private wheelRR: THREE.Group = new THREE.Group();
  private tireMeshPrototype: THREE.Object3D | null = null;

  private headlightSpotL: THREE.SpotLight | null = null;
  private headlightSpotR: THREE.SpotLight | null = null;

  public isLoaded: boolean = false;

  constructor() {
    this.initCar();
  }

  private async initCar() {
    this.group = new THREE.Group();
    const objLoader = new OBJLoader();
    const texLoader = new THREE.TextureLoader();

    // 1. Load authentic Dr. Driving car texture & OBJ model
    try {
      const carTexture = await texLoader.loadAsync('/assets/cars/car00.png');
      carTexture.flipY = false;
      carTexture.colorSpace = THREE.SRGBColorSpace;

      const carMaterial = new THREE.MeshStandardMaterial({
        map: carTexture,
        roughness: 0.4,
        metalness: 0.2
      });

      const carObj = await objLoader.loadAsync('/assets/cars/car00.obj');
      carObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = carMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.carBodyMesh = carObj;
      this.carBodyMesh.position.set(0, 0, 0);
      this.group.add(this.carBodyMesh);

      // 2. Load authentic Dr. Driving tire texture & OBJ model
      const tireTexture = await texLoader.loadAsync('/assets/envi/tire.png');
      tireTexture.flipY = false;
      tireTexture.colorSpace = THREE.SRGBColorSpace;

      const tireMaterial = new THREE.MeshStandardMaterial({
        map: tireTexture,
        roughness: 0.8,
        metalness: 0.1
      });

      const tireObj = await objLoader.loadAsync('/assets/envi/tire.obj');
      tireObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = tireMaterial;
          child.castShadow = true;
        }
      });

      // Tire scale relative to car00.obj (approx 0.38x)
      tireObj.scale.set(0.38, 0.38, 0.38);
      this.tireMeshPrototype = tireObj;

      // 3. Mount 4 wheels at the exact wheel wells of car00.obj
      const createWheelMount = (isRight: boolean) => {
        const mount = new THREE.Group();
        const tireInstance = this.tireMeshPrototype!.clone();
        if (isRight) {
          tireInstance.rotation.y = Math.PI;
        }
        mount.add(tireInstance);
        return mount;
      };

      // Car00 bounds: width: 2.78, length: 3.99, height: 1.40
      this.wheelFL = createWheelMount(false);
      this.wheelFL.position.set(-1.18, 0.36, -1.25);

      this.wheelFR = createWheelMount(true);
      this.wheelFR.position.set(1.18, 0.36, -1.25);

      this.wheelRL = createWheelMount(false);
      this.wheelRL.position.set(-1.18, 0.36, 1.25);

      this.wheelRR = createWheelMount(true);
      this.wheelRR.position.set(1.18, 0.36, 1.25);

      this.group.add(this.wheelFL);
      this.group.add(this.wheelFR);
      this.group.add(this.wheelRL);
      this.group.add(this.wheelRR);

      // 4. Headlights Spotlights
      this.headlightSpotL = new THREE.SpotLight(0xfff8ee, 8, 40, Math.PI / 7, 0.3, 1.5);
      this.headlightSpotL.position.set(-0.8, 0.55, -2.0);
      const targetL = new THREE.Object3D();
      targetL.position.set(-0.8, 0, -25);
      this.group.add(this.headlightSpotL);
      this.group.add(targetL);
      this.headlightSpotL.target = targetL;

      this.headlightSpotR = new THREE.SpotLight(0xfff8ee, 8, 40, Math.PI / 7, 0.3, 1.5);
      this.headlightSpotR.position.set(0.8, 0.55, -2.0);
      const targetR = new THREE.Object3D();
      targetR.position.set(0.8, 0, -25);
      this.group.add(this.headlightSpotR);
      this.group.add(targetR);
      this.headlightSpotR.target = targetR;

      this.isLoaded = true;
    } catch (e) {
      console.warn("Failed loading official car models, fallback active:", e);
      this.buildFallbackCar();
    }
  }

  private buildFallbackCar() {
    const geo = new THREE.BoxGeometry(1.8, 0.6, 4.0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xee2222 });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = 0.5;
    this.group.add(m);
  }

  public update(physics: VehiclePhysics) {
    this.group.position.copy(physics.position);
    this.group.rotation.copy(physics.rotation);

    if (this.isLoaded) {
      // Front wheel steering
      this.wheelFL.rotation.y = physics.frontWheelSteerAngle;
      this.wheelFR.rotation.y = physics.frontWheelSteerAngle;

      // Wheel rotation with forward speed
      this.wheelFL.children[0]?.rotation.set(physics.wheelRotationAngle, 0, 0);
      this.wheelFR.children[0]?.rotation.set(-physics.wheelRotationAngle, Math.PI, 0);
      this.wheelRL.children[0]?.rotation.set(physics.wheelRotationAngle, 0, 0);
      this.wheelRR.children[0]?.rotation.set(-physics.wheelRotationAngle, Math.PI, 0);
    }
  }
}
