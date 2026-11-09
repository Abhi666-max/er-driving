import * as THREE from 'three';
import { VehiclePhysics } from './Physics';

export type SupercarBrand = 'FERRARI' | 'BUGATTI' | 'BMW' | 'MERCEDES' | 'AUDI';

export interface CarSpecs {
  name: string;
  brand: SupercarBrand;
  colorName: string;
  paintColor: number;
  secondaryColor: number;
  maxSpeedKmh: number;
  acceleration: number; // multiplier
  handling: number;
}

export const CAR_CATALOG: Record<SupercarBrand, CarSpecs> = {
  FERRARI: {
    name: 'Ferrari SF90 Stradale',
    brand: 'FERRARI',
    colorName: 'Rosso Corsa Red',
    paintColor: 0xd40000,
    secondaryColor: 0x111111,
    maxSpeedKmh: 240,
    acceleration: 1.45,
    handling: 1.2
  },
  BUGATTI: {
    name: 'Bugatti Chiron Super Sport',
    brand: 'BUGATTI',
    colorName: 'French Racing Blue / Black',
    paintColor: 0x0055ff,
    secondaryColor: 0x08080c,
    maxSpeedKmh: 280,
    acceleration: 1.6,
    handling: 1.1
  },
  BMW: {
    name: 'BMW M4 Competition',
    brand: 'BMW',
    colorName: 'Isle of Man Green',
    paintColor: 0x006644,
    secondaryColor: 0x1a1a1a,
    maxSpeedKmh: 215,
    acceleration: 1.25,
    handling: 1.3
  },
  MERCEDES: {
    name: 'Mercedes-AMG GT Black Series',
    brand: 'MERCEDES',
    colorName: 'Solarbeam Gold / Carbon',
    paintColor: 0xffaa00,
    secondaryColor: 0x141418,
    maxSpeedKmh: 230,
    acceleration: 1.35,
    handling: 1.25
  },
  AUDI: {
    name: 'Audi R8 V10 Performance',
    brand: 'AUDI',
    colorName: 'Suzuka Pearl White',
    paintColor: 0xf4f6fa,
    secondaryColor: 0x222228,
    maxSpeedKmh: 225,
    acceleration: 1.3,
    handling: 1.28
  }
};

export class SupercarRenderer {
  public group: THREE.Group = new THREE.Group();
  public currentBrand: SupercarBrand = 'FERRARI';

  private wheelFL: THREE.Group = new THREE.Group();
  private wheelFR: THREE.Group = new THREE.Group();
  private wheelRL: THREE.Group = new THREE.Group();
  private wheelRR: THREE.Group = new THREE.Group();

  private headlightBeamL: THREE.SpotLight | null = null;
  private headlightBeamR: THREE.SpotLight | null = null;
  private brakeLightMaterial: THREE.MeshStandardMaterial | null = null;

  constructor(brand: SupercarBrand = 'FERRARI') {
    this.currentBrand = brand;
    this.buildSupercar(brand);
  }

  public setBrand(brand: SupercarBrand) {
    this.currentBrand = brand;
    // Clear existing
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.buildSupercar(brand);
  }

  private buildSupercar(brand: SupercarBrand) {
    const specs = CAR_CATALOG[brand];

    // 1. High-End PBR Materials
    const bodyPaint = new THREE.MeshPhysicalMaterial({
      color: specs.paintColor,
      metalness: 0.85,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.95
    });

    const carbonFiber = new THREE.MeshStandardMaterial({
      color: specs.secondaryColor,
      roughness: 0.45,
      metalness: 0.8
    });

    const windshieldGlass = new THREE.MeshPhysicalMaterial({
      color: 0x1a2634,
      transmission: 0.75,
      opacity: 1,
      transparent: true,
      roughness: 0.02,
      ior: 1.55
    });

    const chromeTrim = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.04
    });

    const brakeCaliperMat = new THREE.MeshStandardMaterial({
      color: 0xff1100,
      metalness: 0.8,
      roughness: 0.2
    });

    const ledHeadlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xddeeff,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });

    this.brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });

    // 2. Chassis Dimensions (Length: 4.6m, Width: 2.05m, Height: 1.22m)
    const baseChassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.98, 0.38, 4.5),
      bodyPaint
    );
    baseChassis.position.y = 0.38;
    baseChassis.castShadow = true;
    baseChassis.receiveShadow = true;
    this.group.add(baseChassis);

    // Front Aerodynamic Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.08, 0.6), carbonFiber);
    splitter.position.set(0, 0.18, -2.25);
    this.group.add(splitter);

    // Rear Aerodynamic Diffuser
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.16, 0.5), carbonFiber);
    diffuser.position.set(0, 0.22, 2.22);
    this.group.add(diffuser);

    // 3. Cabin, Roof & Windows
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.52, 2.2),
      bodyPaint
    );
    cabin.position.set(0, 0.78, 0.15);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Sloped Windshield
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(1.58, 0.78),
      windshieldGlass
    );
    windshield.position.set(0, 0.82, -0.92);
    windshield.rotation.x = Math.PI / 3.2;
    this.group.add(windshield);

    // Rear Engine Cover / Glass
    const rearGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.58, 0.82),
      windshieldGlass
    );
    rearGlass.position.set(0, 0.82, 1.25);
    rearGlass.rotation.x = -Math.PI / 3.0;
    this.group.add(rearGlass);

    // 4. Distinct Brand Elements
    if (brand === 'BUGATTI') {
      // Signature Horseshoe Grille
      const horseshoe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.12, 24, 1, false, 0, Math.PI),
        chromeTrim
      );
      horseshoe.rotation.z = Math.PI;
      horseshoe.rotation.x = Math.PI / 2;
      horseshoe.position.set(0, 0.42, -2.28);
      this.group.add(horseshoe);

      // Distinct Bugatti C-line side scoops
      const scoopL = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 24, Math.PI), chromeTrim);
      scoopL.position.set(-1.01, 0.65, 0.2);
      scoopL.rotation.y = Math.PI / 2;
      this.group.add(scoopL);

      const scoopR = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 24, Math.PI), chromeTrim);
      scoopR.position.set(1.01, 0.65, 0.2);
      scoopR.rotation.y = -Math.PI / 2;
      this.group.add(scoopR);

      // Active Rear Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.4), carbonFiber);
      wing.position.set(0, 0.95, 2.15);
      this.group.add(wing);

    } else if (brand === 'BMW') {
      // Iconic BMW Double Kidney Grilles
      const kidneyL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.08), carbonFiber);
      kidneyL.position.set(-0.24, 0.45, -2.28);
      this.group.add(kidneyL);

      const kidneyR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.08), carbonFiber);
      kidneyR.position.set(0.24, 0.45, -2.28);
      this.group.add(kidneyR);

      // Power Dome Hood Bulge
      const dome = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 1.4), bodyPaint);
      dome.position.set(0, 0.6, -1.2);
      this.group.add(dome);

    } else if (brand === 'FERRARI') {
      // Aerodynamic Hood S-Duct Vent
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.8), carbonFiber);
      vent.position.set(0, 0.58, -1.2);
      this.group.add(vent);

      // Round Ferrari Twin Taillights
      [-0.65, 0.65].forEach(x => {
        const tLight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), this.brakeLightMaterial!);
        tLight.rotation.x = Math.PI / 2;
        tLight.position.set(x, 0.62, 2.27);
        this.group.add(tLight);
      });

    } else if (brand === 'MERCEDES') {
      // Panamericana Slotted Grille
      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.08), chromeTrim);
      grille.position.set(0, 0.45, -2.28);
      this.group.add(grille);

      // High Performance GT Rear Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.35), carbonFiber);
      wing.position.set(0, 1.05, 2.15);
      this.group.add(wing);

    } else if (brand === 'AUDI') {
      // Singleframe Hexagonal Grille
      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 0.08), carbonFiber);
      grille.position.set(0, 0.42, -2.28);
      this.group.add(grille);

      // Signature Audi Carbon Sideblades
      [-1.01, 1.01].forEach(x => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 0.7), carbonFiber);
        blade.position.set(x, 0.68, 0.7);
        this.group.add(blade);
      });
    }

    // 5. Headlights & Taillights
    [-0.72, 0.72].forEach(x => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.12), ledHeadlightMat);
      hl.position.set(x, 0.52, -2.24);
      this.group.add(hl);
    });

    // Continuous Full-Width Rear LED Tailstrip
    const rearLightBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.82, 0.08, 0.08),
      this.brakeLightMaterial
    );
    rearLightBar.position.set(0, 0.62, 2.26);
    this.group.add(rearLightBar);

    // Real Headlight Spotlights for Indian Night / Golden Sun illumination
    this.headlightBeamL = new THREE.SpotLight(0xfff5e6, 15, 60, Math.PI / 6.5, 0.3, 1.4);
    this.headlightBeamL.position.set(-0.72, 0.52, -2.3);
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.72, 0, -35);
    this.group.add(this.headlightBeamL);
    this.group.add(targetL);
    this.headlightBeamL.target = targetL;

    this.headlightBeamR = new THREE.SpotLight(0xfff5e6, 15, 60, Math.PI / 6.5, 0.3, 1.4);
    this.headlightBeamR.position.set(0.72, 0.52, -2.3);
    const targetR = new THREE.Object3D();
    targetR.position.set(0.72, 0, -35);
    this.group.add(this.headlightBeamR);
    this.group.add(targetR);
    this.headlightBeamR.target = targetR;

    // 6. Luxury Sport Wheels with Alloy Rims and Red Brake Calipers
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.88 });

    const createSportWheel = () => {
      const wGroup = new THREE.Group();

      // Rubber Tire
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.28, 28),
        tireMat
      );
      tire.rotateZ(Math.PI / 2);
      tire.castShadow = true;
      wGroup.add(tire);

      // Alloy Rim
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.29, 20),
        chromeTrim
      );
      rim.rotateZ(Math.PI / 2);
      wGroup.add(rim);

      // Red Brake Caliper
      const caliper = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.14),
        brakeCaliperMat
      );
      caliper.position.set(0, 0.15, 0);
      wGroup.add(caliper);

      return wGroup;
    };

    this.wheelFL = createSportWheel();
    this.wheelFL.position.set(-1.05, 0.36, -1.38);

    this.wheelFR = createSportWheel();
    this.wheelFR.position.set(1.05, 0.36, -1.38);

    this.wheelRL = createSportWheel();
    this.wheelRL.position.set(-1.05, 0.36, 1.38);

    this.wheelRR = createSportWheel();
    this.wheelRR.position.set(1.05, 0.36, 1.38);

    this.group.add(this.wheelFL);
    this.group.add(this.wheelFR);
    this.group.add(this.wheelRL);
    this.group.add(this.wheelRR);

    // Number Plate: "MH 12 AK 0007" honoring Abhijeet kangane
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.18, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    plate.position.set(0, 0.36, 2.27);
    this.group.add(plate);
  }

  public update(physics: VehiclePhysics) {
    this.group.position.copy(physics.position);
    this.group.rotation.copy(physics.rotation);

    // Front wheel steering
    this.wheelFL.rotation.y = physics.frontWheelSteerAngle;
    this.wheelFR.rotation.y = physics.frontWheelSteerAngle;

    // Wheel spin
    this.wheelFL.children[0].rotation.x = physics.wheelRotationAngle;
    this.wheelFR.children[0].rotation.x = -physics.wheelRotationAngle;
    this.wheelRL.children[0].rotation.x = physics.wheelRotationAngle;
    this.wheelRR.children[0].rotation.x = -physics.wheelRotationAngle;

    // Brake lights glow
    if (this.brakeLightMaterial) {
      if (physics.brake > 0.05 || physics.gear === 'R') {
        this.brakeLightMaterial.emissiveIntensity = 3.5;
      } else {
        this.brakeLightMaterial.emissiveIntensity = 0.8;
      }
    }
  }
}

