import { time } from "@nomicfoundation/hardhat-network-helpers";

export async function advanceTime(duration: number): Promise<void> {
  await time.increase(duration);
}

export async function advanceToDeadline(deadline: number): Promise<void> {
  await time.increaseTo(deadline);
}

export async function getCurrentTimestamp(): Promise<number> {
  return time.latest();
}

export function daysToSeconds(days: number): number {
  return days * 24 * 60 * 60;
}

export function hoursToSeconds(hours: number): number {
  return hours * 60 * 60;
}
