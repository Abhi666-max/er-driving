import * as THREE from 'three';

export interface ParkingBay {
  bounds: THREE.Box3;
  center: THREE.Vector3;
  rotationY: number;
  mesh: THREE.Group;
  isOccupied: boolean;
}

export class IndianVillageEnvironment {
  public group: THREE.Group = new THREE.Group();
  public collisionObstacles: THREE.Box3[] = [];
  public parkingBays: ParkingBay[] = [];

  constructor() {
    this.buildVillage();
  }

  private buildVillage() {
    this.group = new THREE.Group();

    // 1. Natural Materials & Textures
    const asphaltRoadMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.9,
      metalness: 0.05
    });

    const dirtShoulderMat = new THREE.MeshStandardMaterial({
      color: 0x9e7247, // Indian red/brown soil (mitti)
      roughness: 0.95
    });

    const mustardFieldMat = new THREE.MeshStandardMaterial({
      color: 0xc8aa22, // Sarson ke khet (Golden Yellow mustard crops)
      roughness: 0.85
    });

    const lushGrassMat = new THREE.MeshStandardMaterial({
      color: 0x3d7028,
      roughness: 0.88
    });

    const brickHutMat = new THREE.MeshStandardMaterial({
      color: 0xa84e32, // Terracotta baked brick/clay
      roughness: 0.75
    });

    const roofTileMat = new THREE.MeshStandardMaterial({
      color: 0xb53c1d, // Desi red clay roof tiles (khaprail)
      roughness: 0.7
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d28,
      roughness: 0.85
    });

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2d631e,
      roughness: 0.65
    });

    // 2. Vast Indian Ground Plane (Fields & Terrain)
    const worldSize = 800; // 800m x 800m
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(worldSize, worldSize),
      mustardFieldMat
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Patchy green grass fields alongside mustard fields
    for (let i = 0; i < 20; i++) {
      const px = (Math.random() - 0.5) * 600;
      const pz = (Math.random() - 0.5) * 600;
      if (Math.abs(px) < 30) continue; // Keep clear of main highway
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(60 + Math.random() * 80, 60 + Math.random() * 80), lushGrassMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(px, 0.01, pz);
      patch.receiveShadow = true;
      this.group.add(patch);
    }

    // 3. Indian Highway / Village Road (North-South Avenue)
    const roadWidth = 14; // 2 lanes + shoulders
    const roadLength = worldSize;

    // Road asphalt
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, roadLength),
      asphaltRoadMat
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.group.add(road);

    // Muddy / Sandy Road Shoulders (Kaccha Raasta on both edges)
    [-roadWidth / 2 - 2.5, roadWidth / 2 + 2.5].forEach(sx => {
      const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(5.0, roadLength), dirtShoulderMat);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.set(sx, 0.01, 0);
      shoulder.receiveShadow = true;
      this.group.add(shoulder);
    });

    // Road Markings: Dashed white center line & solid yellow edge lines
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xefefef });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    for (let z = -worldSize / 2; z <= worldSize / 2; z += 12) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 6.0), whiteLineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, z);
      this.group.add(dash);
    }

    [-roadWidth / 2 + 0.4, roadWidth / 2 - 0.4].forEach(ex => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roadLength), yellowLineMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(ex, 0.03, 0);
      this.group.add(edge);
    });

    // 4. Authentic Indian Speed Breakers (Rumble Bumps with warning stripes)
    const speedBreakerPositions = [-120, 60, 240];
    speedBreakerPositions.forEach(sbZ => {
      const bump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, roadWidth - 1, 12, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.8 })
      );
      bump.rotation.z = Math.PI / 2;
      bump.position.set(0, 0.08, sbZ);
      this.group.add(bump);
    });

    // 5. Traditional Indian Highway Milestones (Yellow & White Pillars)
    const milestoneMatYellow = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const milestoneMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let z = -250; z <= 250; z += 90) {
      const mGroup = new THREE.Group();
      // White lower cylinder base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.7, 16), milestoneMatWhite);
      base.position.y = 0.35;
      mGroup.add(base);

      // Yellow curved dome top
      const topDome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), milestoneMatYellow);
      topDome.position.y = 0.7;
      mGroup.add(topDome);

      mGroup.position.set(roadWidth / 2 + 1.8, 0, z);
      this.group.add(mGroup);
    }

    // 6. Roadside Trees (Lush Banyan / Neem / Mango trees)
    for (let z = -worldSize / 2 + 20; z <= worldSize / 2 - 20; z += 35) {
      [-roadWidth / 2 - 6.5, roadWidth / 2 + 6.5].forEach(tx => {
        const treeGroup = new THREE.Group();

        // Thick Trunk
        const trunkHeight = 3.5 + Math.random() * 1.5;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.55, trunkHeight, 10),
          woodMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Expansive Green Canopy
        const canopyRadius = 3.2 + Math.random() * 1.8;
        const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(canopyRadius, 1), leafMat);
        canopy1.position.set(0, trunkHeight + 1.8, 0);
        canopy1.castShadow = true;
        treeGroup.add(canopy1);

        const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(canopyRadius * 0.75, 1), leafMat);
        canopy2.position.set(canopyRadius * 0.4, trunkHeight + 2.6, 0);
        canopy2.castShadow = true;
        treeGroup.add(canopy2);

        treeGroup.position.set(tx + (Math.random() - 0.5) * 3, 0, z + (Math.random() - 0.5) * 8);
        this.group.add(treeGroup);

        this.collisionObstacles.push(
          new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(treeGroup.position.x, 2, treeGroup.position.z),
            new THREE.Vector3(1.4, 4, 1.4)
          )
        );
      });
    }

    // 7. Iconic Indian Dhaba / Chai Tapri ("KANGANE DHABA - SPECIAL CHAI")
    this.buildDhaba(roadWidth / 2 + 14, 45, woodMat, brickHutMat, roofTileMat);

    // 8. Traditional Indian Village Huts & Houses
    this.buildVillageClusters(brickHutMat, roofTileMat, woodMat);

    // 9. Village Temple (Mandir with Saffron Dhwaja flag)
    this.buildTemple(-roadWidth / 2 - 22, -80);

    // 10. Desi VIP Parking Zone (Outside Dhaba)
    this.buildParkingZone(roadWidth / 2 + 7.5, 45);
  }

  private buildDhaba(x: number, z: number, woodMat: THREE.Material, wallMat: THREE.Material, roofMat: THREE.Material) {
    const dhabaGroup = new THREE.Group();

    // Main Dhaba Kitchen & Dining hall
    const building = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 12), wallMat);
    building.position.set(0, 2.25, 0);
    building.castShadow = true;
    dhabaGroup.add(building);

    // Sloped Clay Tile Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(12, 3.2, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 5.8, 0);
    roof.castShadow = true;
    dhabaGroup.add(roof);

    // Front Open Veranda / Shed Canopy
    const verandaRoof = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x3366bb, roughness: 0.6 }) // Blue tarpaulin sheet
    );
    verandaRoof.position.set(0, 3.6, -8);
    verandaRoof.rotation.x = 0.12;
    dhabaGroup.add(verandaRoof);

    // Wooden Pillars holding shed
    [-7.5, 7.5].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.6, 8), woodMat);
      pillar.position.set(px, 1.8, -10.5);
      dhabaGroup.add(pillar);
    });

    // Traditional Indian Charpai (Cots/Khatia) for relaxing
    [-4, 4].forEach(cx => {
      const charpai = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xaa7744, roughness: 0.9 })
      );
      charpai.position.set(cx, 0.25, -7.5);
      dhabaGroup.add(charpai);
    });

    // Giant Colorful Dhaba Billboard: "KANGANE DHABA - HORN OK PLEASE"
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    board.position.set(0, 5.0, -5.2);
    dhabaGroup.add(board);

    dhabaGroup.position.set(x, 0, z);
    this.group.add(dhabaGroup);

    this.collisionObstacles.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, 2.5, z),
        new THREE.Vector3(18, 5, 14)
      )
    );
  }

  private buildVillageClusters(wallMat: THREE.Material, roofMat: THREE.Material, woodMat: THREE.Material) {
    const hutPositions = [
      { x: -35, z: 80, rot: 0.2 },
      { x: -45, z: 120, rot: -0.4 },
      { x: -38, z: 160, rot: 0.1 },
      { x: 42, z: -140, rot: -0.3 },
      { x: 50, z: -180, rot: 0.5 },
      { x: 38, z: -220, rot: -0.1 }
    ];

    hutPositions.forEach(pos => {
      const hut = new THREE.Group();

      // House Walls
      const houseW = 8 + Math.random() * 3;
      const houseL = 7 + Math.random() * 2;
      const walls = new THREE.Mesh(new THREE.BoxGeometry(houseW, 3.2, houseL), wallMat);
      walls.position.y = 1.6;
      walls.castShadow = true;
      hut.add(walls);

      // Khaprail Clay Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(houseW * 0.75, 2.5, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 4.2;
      roof.castShadow = true;
      hut.add(roof);

      // Wooden Door
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x3d2616 })
      );
      door.position.set(0, 1.2, houseL / 2 + 0.05);
      hut.add(door);

      hut.position.set(pos.x, 0, pos.z);
      hut.rotation.y = pos.rot;
      this.group.add(hut);

      this.collisionObstacles.push(
        new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(pos.x, 2, pos.z),
          new THREE.Vector3(houseW + 1, 4, houseL + 1)
        )
      );
    });
  }

  private buildTemple(x: number, z: number) {
    const templeGroup = new THREE.Group();

    // White marble platform
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.0, 14),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3 })
    );
    platform.position.y = 0.5;
    templeGroup.add(platform);

    // Temple Sanctum (Garbhagriha)
    const sanctum = new THREE.Mesh(
      new THREE.BoxGeometry(9, 4.5, 9),
      new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.4 })
    );
    sanctum.position.y = 3.25;
    templeGroup.add(sanctum);

    // Shikhara (Towering Temple Spire)
    const shikhara = new THREE.Mesh(
      new THREE.ConeGeometry(5.5, 8.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xe88a22, roughness: 0.5 })
    );
    shikhara.position.y = 9.5;
    templeGroup.add(shikhara);

    // Saffron Dhwaja (Orange Temple Flag fluttering on top)
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8),
      new THREE.MeshBasicMaterial({ color: 0xdddddd })
    );
    flagPole.position.y = 14.5;
    templeGroup.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.4, 3),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    flag.rotation.z = Math.PI / 2;
    flag.position.set(0.6, 14.8, 0);
    templeGroup.add(flag);

    templeGroup.position.set(x, 0, z);
    this.group.add(templeGroup);

    this.collisionObstacles.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, 4, z),
        new THREE.Vector3(15, 8, 15)
      )
    );
  }

  private buildParkingZone(x: number, z: number) {
    const pGroup = new THREE.Group();

    // Marked Parking Bay (Paved dirt & white stones)
    const bayMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 8.5),
      new THREE.MeshStandardMaterial({ color: 0x3d3024, roughness: 0.9 })
    );
    bayMesh.rotation.x = -Math.PI / 2;
    bayMesh.position.y = 0.03;
    pGroup.add(bayMesh);

    // Glowing Yellow Border
    const borderGeo = new THREE.RingGeometry(3.2, 3.4, 4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.05;
    pGroup.add(border);

    pGroup.position.set(x, 0, z);
    this.group.add(pGroup);

    this.parkingBays.push({
      bounds: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, 1.5, z),
        new THREE.Vector3(5.5, 3.0, 8.5)
      ),
      center: new THREE.Vector3(x, 0, z),
      rotationY: 0,
      mesh: pGroup,
      isOccupied: false
    });
  }

  public update(dt: number) {
    // Soft animation on parking indicator
    const time = performance.now() * 0.003;
    if (this.parkingBays.length > 0) {
      this.parkingBays[0].mesh.children[1].rotation.z = time * 0.5;
    }
  }
}

