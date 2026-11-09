import * as THREE from 'three';
import { VehiclePhysics } from './Physics';
import { CityEnvironment } from './City';
import { TrafficSystem } from './Traffic';
import { sounds } from './Audio';

export type MissionType = 'HIGHWAY_SPEED' | 'VIP_PARKING' | 'COMFORT_DRIVE' | 'TRAFFIC_WEAVE';

export interface MissionState {
  type: MissionType;
  title: string;
  description: string;
  targetMetric: string;
  currentValue: number;
  targetValue: number;
  timeRemaining: number;
  isComplete: boolean;
  isFailed: boolean;
  failReason: string;
}

export class MissionManager {
  public currentMission: MissionState;
  private parkingTargetBayIndex: number = 0;
  private overtakesCount: number = 0;
  private speedHoldTimer: number = 0;

  constructor(type: MissionType = 'VIP_PARKING') {
    this.currentMission = this.createMission(type);
  }

  public setMission(type: MissionType) {
    this.currentMission = this.createMission(type);
    this.overtakesCount = 0;
    this.speedHoldTimer = 0;
  }

  private createMission(type: MissionType): MissionState {
    switch (type) {
      case 'VIP_PARKING':
        return {
          type,
          title: 'VIP PRECISION PARKING',
          description: 'Navigate to Parking Bay B, align within the bay, stop, and shift to PARK (P).',
          targetMetric: 'Alignment',
          currentValue: 0,
          targetValue: 100,
          timeRemaining: 90,
          isComplete: false,
          isFailed: false,
          failReason: ''
        };
      case 'HIGHWAY_SPEED':
        return {
          type,
          title: 'HIGHWAY SPEED CRUISE',
          description: 'Reach and maintain over 60 km/h for 15 seconds without collision.',
          targetMetric: 'Time held',
          currentValue: 0,
          targetValue: 15,
          timeRemaining: 60,
          isComplete: false,
          isFailed: false,
          failReason: ''
        };
      case 'COMFORT_DRIVE':
        return {
          type,
          title: 'EXECUTIVE COMFORT VIP',
          description: 'Drive smoothly for 40 seconds. Keep passenger comfort above 70%.',
          targetMetric: 'Comfort %',
          currentValue: 100,
          targetValue: 70,
          timeRemaining: 40,
          isComplete: false,
          isFailed: false,
          failReason: ''
        };
      case 'TRAFFIC_WEAVE':
        return {
          type,
          title: 'TRAFFIC RUSH WEAVE',
          description: 'Overtake 4 traffic cars cleanly within 45 seconds.',
          targetMetric: 'Cars Passed',
          currentValue: 0,
          targetValue: 4,
          timeRemaining: 45,
          isComplete: false,
          isFailed: false,
          failReason: ''
        };
    }
  }

  public update(
    dt: number,
    physics: VehiclePhysics,
    city: CityEnvironment,
    traffic: TrafficSystem
  ) {
    if (this.currentMission.isComplete || this.currentMission.isFailed) return;

    this.currentMission.timeRemaining -= dt;
    if (this.currentMission.timeRemaining <= 0) {
      this.currentMission.isFailed = true;
      this.currentMission.failReason = 'TIME OUT';
      return;
    }

    // Check collision failure
    if (physics.isCollided) {
      this.currentMission.isFailed = true;
      this.currentMission.failReason = 'VEHICLE CRASHED';
      return;
    }

    switch (this.currentMission.type) {
      case 'VIP_PARKING': {
        const bay = city.parkingBays[this.parkingTargetBayIndex];
        if (!bay) return;

        const dist = physics.position.distanceTo(bay.center);
        if (dist < 3.2) {
          // Inside parking zone!
          const angleDiff = Math.abs(physics.heading - bay.rotationY) % Math.PI;
          const isAligned = angleDiff < 0.28 || Math.abs(angleDiff - Math.PI) < 0.28;
          const isStopped = Math.abs(physics.speedKmh) < 0.5;
          const isParkGear = physics.gear === 'P';

          if (isAligned && isStopped && isParkGear) {
            this.currentMission.currentValue = 100;
            this.currentMission.isComplete = true;
            sounds.playSuccessChime();
          } else {
            this.currentMission.currentValue = Math.min(90, Math.round((1 - dist / 3.2) * 90));
          }
        } else {
          this.currentMission.currentValue = 0;
        }
        break;
      }

      case 'HIGHWAY_SPEED': {
        if (physics.speedKmh >= 60) {
          this.speedHoldTimer += dt;
          this.currentMission.currentValue = Math.min(15, Math.round(this.speedHoldTimer));
          if (this.speedHoldTimer >= 15) {
            this.currentMission.isComplete = true;
            sounds.playSuccessChime();
          }
        }
        break;
      }

      case 'COMFORT_DRIVE': {
        this.currentMission.currentValue = Math.round(physics.passengerComfort);
        if (physics.passengerComfort < 60) {
          this.currentMission.isFailed = true;
          this.currentMission.failReason = 'PASSENGER MOTION SICKNESS (VIOLENT DRIVING)';
        } else if (this.currentMission.timeRemaining <= 0.1) {
          this.currentMission.isComplete = true;
          sounds.playSuccessChime();
        }
        break;
      }

      case 'TRAFFIC_WEAVE': {
        traffic.cars.forEach(car => {
          const relZ = physics.position.z - car.position.z;
          if (Math.abs(relZ) < 3 && Math.abs(physics.position.x - car.position.x) < 4.5 && physics.speedKmh > 35) {
            this.overtakesCount++;
            this.currentMission.currentValue = Math.min(4, this.overtakesCount);
            if (this.overtakesCount >= 4) {
              this.currentMission.isComplete = true;
              sounds.playSuccessChime();
            }
          }
        });
        break;
      }
    }
  }
}

