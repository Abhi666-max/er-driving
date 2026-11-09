import * as THREE from 'three';

export interface TrafficEntity {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: number;
  laneX: number;
  direction: 1 | -1;
  length: number;
  width: number;
  type: 'AUTO_RICKSHAW' | 'INDIAN_TRUCK' | 'TRACTOR';
}

export class IndianTrafficSystem {
  public group: THREE.Group = new THREE.Group();
  public vehicles: TrafficEntity[] = [];

  constructor(count: number = 14) {
    this.spawnIndianTraffic(count);
  }

  private spawnIndianTraffic(count: number) {
    this.group = new THREE.Group();
    this.vehicles = [];

    // Highway Lanes (Center at X=0, Road width=14m)
    // Forward lane (+Z): X = 3.6
    // Backward lane (-Z): X = -3.6
    for (let i = 0; i < count; i++) {
      const isForward = Math.random() > 0.5;
      const direction: 1 | -1 = isForward ? 1 : -1;
      const laneX = isForward ? 3.6 : -3.6;
      const initialZ = (Math.random() * 500) - 250;

      const rand = Math.random();
      let entity: TrafficEntity;

      if (rand < 0.45) {
        // Auto-Rickshaw (Tuk-Tuk)
        entity = this.createAutoRickshaw(laneX, initialZ, direction);
      } else if (rand < 0.8) {
        // Desi Indian Truck
        entity = this.createDesiTruck(laneX, initialZ, direction);
      } else {
        // Farm Tractor with Trolley
        entity = this.createTractor(laneX, initialZ, direction);
      }

      this.group.add(entity.mesh);
      this.vehicles.push(entity);
    }
  }

  private createAutoRickshaw(x: number, z: number, direction: 1 | -1): TrafficEntity {
    const rickshaw = new THREE.Group();

    // Bottom Body (Iconic Dark Green)
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x005522, roughness: 0.4 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3 }); // Yellow Roof
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9 });

    // Lower chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 2.6), greenMat);
    body.position.y = 0.5;
    body.castShadow = true;
    rickshaw.add(body);

    // Front Nose / Hood (Tapered front)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 4), greenMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.6, -1.5);
    rickshaw.add(nose);

    // Yellow Canopy Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.45, 2.4), yellowMat);
    roof.position.set(0, 1.45, 0.1);
    roof.castShadow = true;
    rickshaw.add(roof);

    // Pillars supporting roof
    [-0.65, 0.65].forEach(px => {
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), blackMat);
      p1.position.set(px, 1.05, -0.9);
      rickshaw.add(p1);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), blackMat);
      p2.position.set(px, 1.05, 1.1);
      rickshaw.add(p2);
    });

    // Single Front Wheel
    const fWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), blackMat);
    fWheel.rotateZ(Math.PI / 2);
    fWheel.position.set(0, 0.24, -1.35);
    rickshaw.add(fWheel);

    // Dual Rear Wheels
    [-0.72, 0.72].forEach(wx => {
      const rWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.16, 16), blackMat);
      rWheel.rotateZ(Math.PI / 2);
      rWheel.position.set(wx, 0.25, 0.8);
      rickshaw.add(rWheel);
    });

    // Single Round Chrome Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), chromeMat);
    headlight.position.set(0, 0.62, -1.9);
    rickshaw.add(headlight);

    if (direction === -1) {
      rickshaw.rotation.y = Math.PI;
    }
    rickshaw.position.set(x, 0, z);

    return {
      mesh: rickshaw,
      position: rickshaw.position,
      velocity: 9 + Math.random() * 4, // 32 - 46 km/h
      laneX: x,
      direction,
      length: 3.2,
      width: 1.6,
      type: 'AUTO_RICKSHAW'
    };
  }

  private createDesiTruck(x: number, z: number, direction: 1 | -1): TrafficEntity {
    const truck = new THREE.Group();

    // Vibrant Indian Truck Colors (Deep Red/Orange Cabin + Colorful Wooden Cargo)
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xd9381e, roughness: 0.35 });
    const cargoWoodMat = new THREE.MeshStandardMaterial({ color: 0x3377aa, roughness: 0.8 }); // Sky Blue Painted Cargo
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.9 });
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 }); // Yellow & Black Bumper

    // Driver Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 2.4), cabinMat);
    cabin.position.set(0, 1.6, -2.6);
    cabin.castShadow = true;
    truck.add(cabin);

    // High Wooden Cargo Bed (With authentic high wooden side panels)
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 5.2), cargoWoodMat);
    cargo.position.set(0, 1.8, 1.3);
    cargo.castShadow = true;
    truck.add(cargo);

    // Famous Indian "HORN OK PLEASE" Painted Backboard
    const backSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.4, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    backSign.position.set(0, 1.8, 3.95);
    truck.add(backSign);

    // Front Grill & Bumpers
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.3), bumperMat);
    bumper.position.set(0, 0.6, -3.85);
    truck.add(bumper);

    // 6 Big Heavy Truck Tires
    const wheelPositions = [
      { x: -1.2, z: -2.4 }, { x: 1.2, z: -2.4 },
      { x: -1.2, z: 1.0 }, { x: 1.2, z: 1.0 },
      { x: -1.2, z: 2.8 }, { x: 1.2, z: 2.8 }
    ];

    wheelPositions.forEach(wp => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 18), tireMat);
      w.rotateZ(Math.PI / 2);
      w.position.set(wp.x, 0.48, wp.z);
      truck.add(w);
    });

    if (direction === -1) {
      truck.rotation.y = Math.PI;
    }
    truck.position.set(x, 0, z);

    return {
      mesh: truck,
      position: truck.position,
      velocity: 11 + Math.random() * 4, // 40 - 54 km/h
      laneX: x,
      direction,
      length: 8.2,
      width: 2.5,
      type: 'INDIAN_TRUCK'
    };
  }

  private createTractor(x: number, z: number, direction: 1 | -1): TrafficEntity {
    const tractor = new THREE.Group();

    const redPaint = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 }); // Classic Massey/Sonalika Red
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x775533, roughness: 0.9 });

    // Tractor Engine Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 2.0), redPaint);
    hood.position.set(0, 0.95, -0.6);
    hood.castShadow = true;
    tractor.add(hood);

    // Vertical Exhaust Chimney (Silencer pipe)
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
    );
    exhaust.position.set(0.45, 1.8, -1.2);
    tractor.add(exhaust);

    // Giant Rear Drive Wheels
    [-0.95, 0.95].forEach(wx => {
      const bigWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.38, 20), tireMat);
      bigWheel.rotateZ(Math.PI / 2);
      bigWheel.position.set(wx, 0.72, 0.5);
      tractor.add(bigWheel);
    });

    // Small Front Wheels
    [-0.7, 0.7].forEach(wx => {
      const smallWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), tireMat);
      smallWheel.rotateZ(Math.PI / 2);
      smallWheel.position.set(wx, 0.32, -1.4);
      tractor.add(smallWheel);
    });

    // Wooden Trolley (Traali) attached behind
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 3.8), woodMat);
    trolley.position.set(0, 1.0, 3.4);
    trolley.castShadow = true;
    tractor.add(trolley);

    // Trolley Wheels
    [-1.05, 1.05].forEach(wx => {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 16), tireMat);
      tw.rotateZ(Math.PI / 2);
      tw.position.set(wx, 0.44, 3.6);
      tractor.add(tw);
    });

    if (direction === -1) {
      tractor.rotation.y = Math.PI;
    }
    tractor.position.set(x, 0, z);

    return {
      mesh: tractor,
      position: tractor.position,
      velocity: 7 + Math.random() * 3, // 25 - 36 km/h
      laneX: x,
      direction,
      length: 6.8,
      width: 2.2,
      type: 'TRACTOR'
    };
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    this.vehicles.forEach((veh, idx) => {
      let desiredSpeed = veh.velocity;

      // Distance checking against vehicles ahead
      for (let j = 0; j < this.vehicles.length; j++) {
        if (idx === j) continue;
        const other = this.vehicles[j];
        if (Math.abs(other.laneX - veh.laneX) < 1.4) {
          const distZ = (other.position.z - veh.position.z) * veh.direction;
          if (distZ > 0 && distZ < 18) {
            desiredSpeed = Math.min(desiredSpeed, other.velocity * 0.85);
          }
        }
      }

      // Check distance to player
      if (Math.abs(playerPos.x - veh.laneX) < 1.8) {
        const distToPlayer = (playerPos.z - veh.position.z) * veh.direction;
        if (distToPlayer > 0 && distToPlayer < 20) {
          desiredSpeed = 0;
        }
      }

      veh.position.z += veh.direction * desiredSpeed * dt;

      // World recycle
      if (veh.position.z > 350) veh.position.z = -350;
      else if (veh.position.z < -350) veh.position.z = 350;
    });
  }

  public checkPlayerCollision(playerBox: THREE.Box3): TrafficEntity | null {
    for (const veh of this.vehicles) {
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(veh.position.x, 1.2, veh.position.z),
        new THREE.Vector3(veh.width, 2.2, veh.length)
      );
      if (playerBox.intersectsBox(box)) {
        return veh;
      }
    }
    return null;
  }
}

