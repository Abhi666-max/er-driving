import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export interface ParkingBay {
  bounds: THREE.Box3;
  center: THREE.Vector3;
  rotationY: number;
  mesh: THREE.Object3D;
  isOccupied: boolean;
}

export class CityEnvironment {
  public group: THREE.Group = new THREE.Group();
  public collisionObstacles: THREE.Box3[] = [];
  public parkingBays: ParkingBay[] = [];

  public chunkSize = 140; // 140 meters per Dr. Driving road tile

  constructor() {
    this.buildCity();
  }

  private async buildCity() {
    this.group = new THREE.Group();
    const objLoader = new OBJLoader();
    const texLoader = new THREE.TextureLoader();

    try {
      // 1. Sky Dome (sky.obj + sky.jpg)
      const skyTex = await texLoader.loadAsync('/assets/envi/sky.jpg');
      skyTex.colorSpace = THREE.SRGBColorSpace;
      const skyMat = new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide
      });
      const skyObj = await objLoader.loadAsync('/assets/envi/sky.obj');
      skyObj.traverse((c) => {
        if (c instanceof THREE.Mesh) c.material = skyMat;
      });
      skyObj.scale.set(6, 6, 6);
      skyObj.position.set(0, -20, 0);
      this.group.add(skyObj);

      // 2. Road Tile (road_road.obj + road_road.jpg)
      const roadTex = await texLoader.loadAsync('/assets/envi/road_road.jpg');
      roadTex.colorSpace = THREE.SRGBColorSpace;
      const roadMat = new THREE.MeshStandardMaterial({
        map: roadTex,
        roughness: 0.8,
        metalness: 0.1
      });
      const roadObjPrototype = await objLoader.loadAsync('/assets/envi/road_road.obj');
      roadObjPrototype.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.material = roadMat;
          c.receiveShadow = true;
        }
      });

      // 3. City Buildings (road_block.obj + road_block_1.png)
      const blockTex = await texLoader.loadAsync('/assets/envi/road_block_1.png');
      blockTex.colorSpace = THREE.SRGBColorSpace;
      const blockMat = new THREE.MeshStandardMaterial({
        map: blockTex,
        roughness: 0.6,
        metalness: 0.2
      });
      const blockObjPrototype = await objLoader.loadAsync('/assets/envi/road_block.obj');
      blockObjPrototype.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.material = blockMat;
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });

      // 4. VIP Parking Zone (parking_on.obj + parking_box.png)
      const parkingTex = await texLoader.loadAsync('/assets/envi/parking_box.png');
      parkingTex.colorSpace = THREE.SRGBColorSpace;
      const parkingMat = new THREE.MeshBasicMaterial({
        map: parkingTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const parkingObjPrototype = await objLoader.loadAsync('/assets/envi/parking_on.obj');
      parkingObjPrototype.traverse((c) => {
        if (c instanceof THREE.Mesh) c.material = parkingMat;
      });

      // 5. Build 3x3 Grid of 140m chunks (420m x 420m world)
      for (let gx = -1; gx <= 1; gx++) {
        for (let gz = -1; gz <= 1; gz++) {
          const posX = gx * this.chunkSize;
          const posZ = gz * this.chunkSize;

          // Road
          const roadInstance = roadObjPrototype.clone();
          roadInstance.position.set(posX, 0, posZ);
          this.group.add(roadInstance);

          // Buildings
          const blockInstance = blockObjPrototype.clone();
          blockInstance.position.set(posX, 0, posZ);
          this.group.add(blockInstance);

          // Building Collision Boundaries (Curbs and blocks on both sides of avenues)
          // Inner blocks sit outside the roadway
          this.collisionObstacles.push(
            new THREE.Box3(
              new THREE.Vector3(posX - 68, 0, posZ - 68),
              new THREE.Vector3(posX - 18, 18, posZ - 18)
            ),
            new THREE.Box3(
              new THREE.Vector3(posX + 18, 0, posZ - 68),
              new THREE.Vector3(posX + 68, 18, posZ - 18)
            ),
            new THREE.Box3(
              new THREE.Vector3(posX - 68, 0, posZ + 18),
              new THREE.Vector3(posX - 18, 18, posZ + 68)
            ),
            new THREE.Box3(
              new THREE.Vector3(posX + 18, 0, posZ + 18),
              new THREE.Vector3(posX + 68, 18, posZ + 68)
            )
          );
        }
      }

      // 6. Spawn Official Dr. Driving Parking Bay at designated target
      const targetBay = parkingObjPrototype.clone();
      const targetCenter = new THREE.Vector3(8.5, 0.05, 55.0);
      targetBay.position.copy(targetCenter);
      targetBay.scale.set(1.4, 1.4, 1.4);
      this.group.add(targetBay);

      this.parkingBays.push({
        bounds: new THREE.Box3().setFromCenterAndSize(
          targetCenter,
          new THREE.Vector3(4.0, 2.0, 6.0)
        ),
        center: targetCenter,
        rotationY: 0,
        mesh: targetBay,
        isOccupied: false
      });

    } catch (e) {
      console.warn("Failed loading official city models, fallback active:", e);
    }
  }

  public update(dt: number) {
    // Pulse parking bay marker
    const time = performance.now() * 0.003;
    if (this.parkingBays.length > 0) {
      const p = this.parkingBays[0].mesh;
      p.position.y = 0.05 + Math.sin(time * 3) * 0.02;
    }
  }
}
