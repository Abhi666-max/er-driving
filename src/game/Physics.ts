import * as THREE from 'three';
import { sounds } from './Audio';

export type Gear = 'P' | 'R' | 'N' | 'D';

export interface VehicleTelemetry {
  speedKmh: number;
  rpm: number;
  currentGear: Gear;
  steerAngle: number;
  throttle: number;
  brake: number;
  slipRatio: number;
  engineRpmNormalized: number;
  passengerComfort: number; // 0 to 100%
}

export class VehiclePhysics {
  // World transforms
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.45, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  public heading: number = 0; // Radians, around Y axis

  // Input states
  public throttle: number = 0; // 0 to 1
  public brake: number = 0;    // 0 to 1
  public steerInput: number = 0; // -1 (left) to +1 (right)
  public gear: Gear = 'P';

  // Physical specs
  public mass: number = 1350; // kg
  public maxDriveForce: number = 4200; // N
  public maxBrakeForce: number = 8500; // N
  public dragCoeff: number = 0.32;
  public rollingResistanceCoeff: number = 0.015;
  public maxSpeedForward: number = 125; // km/h
  public maxSpeedReverse: number = 32; // km/h
  public maxSteerAngleRad: number = Math.PI / 6.5; // ~28 degrees
  public wheelbase: number = 2.65; // m

  // Wheel angles
  public frontWheelSteerAngle: number = 0;
  public wheelRotationAngle: number = 0;

  // Telemetry & metrics
  public speedKmh: number = 0;
  public rpm: number = 800; // Idle
  public lateralG: number = 0;
  public passengerComfort: number = 100; // Decreases with violent turns / harsh braking
  public isCollided: boolean = false;

  // Collision boundary
  public length: number = 4.4;
  public width: number = 1.95;
  public height: number = 1.45;

  constructor() {
    this.reset();
  }

  public reset(spawnX: number = 0, spawnZ: number = 0, spawnHeading: number = 0) {
    this.position.set(spawnX, 0.45, spawnZ);
    this.velocity.set(0, 0, 0);
    this.heading = spawnHeading;
    this.rotation.set(0, spawnHeading, 0);
    this.speedKmh = 0;
    this.gear = 'P';
    this.throttle = 0;
    this.brake = 0;
    this.steerInput = 0;
    this.rpm = 800;
    this.frontWheelSteerAngle = 0;
    this.passengerComfort = 100;
    this.isCollided = false;
  }

  public shiftGear(newGear: Gear) {
    if (this.gear !== newGear) {
      this.gear = newGear;
      sounds.playGearShift();
      if (this.gear === 'P') {
        this.velocity.set(0, 0, 0);
      }
    }
  }

  public update(dt: number) {
    if (this.isCollided) {
      // In crash state, dampen velocity quickly
      this.velocity.multiplyScalar(0.92);
      this.position.addScaledVector(this.velocity, dt);
      sounds.updateEngine(0, 0, false);
      sounds.setTireScreech(0);
      return;
    }

    // 1. Calculate steering angle based on speed (understeer stability at speed)
    const speedRatio = Math.min(Math.abs(this.speedKmh) / 100, 1);
    const speedAdjustedMaxSteer = this.maxSteerAngleRad * (1 - speedRatio * 0.45);
    const targetSteer = this.steerInput * speedAdjustedMaxSteer;
    // Smooth wheel turn interpolation
    this.frontWheelSteerAngle += (targetSteer - this.frontWheelSteerAngle) * Math.min(dt * 12, 1);

    // 2. Determine forward acceleration force based on gear
    let driveForce = 0;
    let forwardSpeed = this.velocity.dot(new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading)));

    if (this.gear === 'D') {
      const speedCap = this.maxSpeedForward / 3.6; // m/s
      if (forwardSpeed < speedCap) {
        driveForce = this.throttle * this.maxDriveForce * (1 - Math.max(0, forwardSpeed / speedCap));
      }
    } else if (this.gear === 'R') {
      const speedCapReverse = this.maxSpeedReverse / 3.6;
      if (forwardSpeed > -speedCapReverse) {
        driveForce = -this.throttle * (this.maxDriveForce * 0.7) * (1 - Math.max(0, -forwardSpeed / speedCapReverse));
      }
    } else if (this.gear === 'P') {
      driveForce = 0;
      this.brake = 1.0; // Park locks wheels
    } else if (this.gear === 'N') {
      driveForce = 0; // Neutral coasts
    }

    // 3. Braking force
    let brakeForce = 0;
    if (this.brake > 0) {
      brakeForce = this.brake * this.maxBrakeForce;
      if (Math.abs(forwardSpeed) > 0.05) {
        driveForce -= Math.sign(forwardSpeed) * brakeForce;
      } else {
        forwardSpeed = 0;
        driveForce = 0;
      }
    }

    // 4. Resistance forces (Aerodynamic drag + Rolling resistance)
    const airResistance = 0.5 * 1.225 * this.dragCoeff * 2.2 * (forwardSpeed * forwardSpeed) * Math.sign(forwardSpeed);
    const rollingResistance = this.mass * 9.81 * this.rollingResistanceCoeff * Math.sign(forwardSpeed);

    const totalForwardForce = driveForce - airResistance - rollingResistance;
    const forwardAcceleration = totalForwardForce / this.mass;

    // Apply forward speed change
    forwardSpeed += forwardAcceleration * dt;

    if (this.gear === 'P' || (this.brake > 0.8 && Math.abs(forwardSpeed) < 0.2)) {
      forwardSpeed = 0;
    }

    // 5. Angular turning velocity (Bicycle Kinematic Model)
    let angularVelocity = 0;
    if (Math.abs(forwardSpeed) > 0.1) {
      angularVelocity = (forwardSpeed / this.wheelbase) * Math.tan(this.frontWheelSteerAngle);
      this.heading += angularVelocity * dt;
    }

    // 6. Update linear velocity vector & position
    const forwardDir = new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    this.velocity.copy(forwardDir).multiplyScalar(forwardSpeed);
    this.position.addScaledVector(this.velocity, dt);

    // Keep car grounded at level Y
    this.position.y = 0.45;
    this.rotation.y = this.heading;

    // 7. Telemetry & RPM calculation
    this.speedKmh = forwardSpeed * 3.6;

    // Realistic RPM calculation with 4 virtual gears
    let targetRpm = 800;
    if (this.gear === 'D') {
      const absSpeed = Math.abs(this.speedKmh);
      let gearSpeedRatio = (absSpeed % 30) / 30;
      if (absSpeed > 90) gearSpeedRatio = (absSpeed - 90) / 35;
      targetRpm = 800 + gearSpeedRatio * 4200 + this.throttle * 1200;
    } else if (this.gear === 'R') {
      targetRpm = 800 + (Math.abs(this.speedKmh) / this.maxSpeedReverse) * 3500 + this.throttle * 800;
    } else if (this.gear === 'N' || this.gear === 'P') {
      targetRpm = 800 + this.throttle * 5200;
    }
    this.rpm += (targetRpm - this.rpm) * Math.min(dt * 8, 1);

    // 8. Lateral G & Passenger Comfort Check
    this.lateralG = Math.abs((forwardSpeed * angularVelocity) / 9.81);
    let comfortLoss = 0;
    if (this.lateralG > 0.4) {
      comfortLoss += (this.lateralG - 0.4) * dt * 25; // Violent turn
    }
    if (this.brake > 0.7 && Math.abs(forwardSpeed) > 8) {
      comfortLoss += dt * 15; // Hard braking jerk
    }
    this.passengerComfort = Math.max(0, Math.min(100, this.passengerComfort - comfortLoss + dt * 4));

    // 9. Tire screech audio update
    const slipIntensity = (this.lateralG > 0.55 || (this.brake > 0.75 && Math.abs(this.speedKmh) > 25)) ? Math.min(this.lateralG, 1.2) : 0;
    sounds.setTireScreech(slipIntensity);

    // 10. Engine audio update
    const rpmNorm = Math.max(0, Math.min(1, (this.rpm - 800) / 5500));
    sounds.updateEngine(rpmNorm, this.throttle, true);

    // 11. Wheel spin rotation
    const distanceMoved = forwardSpeed * dt;
    this.wheelRotationAngle += distanceMoved / 0.34; // 0.34m wheel radius
  }

  public getTelemetry(): VehicleTelemetry {
    return {
      speedKmh: Math.round(this.speedKmh),
      rpm: Math.round(this.rpm),
      currentGear: this.gear,
      steerAngle: this.frontWheelSteerAngle,
      throttle: this.throttle,
      brake: this.brake,
      slipRatio: this.lateralG,
      engineRpmNormalized: (this.rpm - 800) / 5500,
      passengerComfort: Math.round(this.passengerComfort)
    };
  }

  public getBoundingBox(): THREE.Box3 {
    return new THREE.Box3(
      new THREE.Vector3(this.position.x - this.width / 2, 0, this.position.z - this.length / 2),
      new THREE.Vector3(this.position.x + this.width / 2, this.height, this.position.z + this.length / 2)
    );
  }
}

