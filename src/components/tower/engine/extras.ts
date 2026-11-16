// The layers around the tower, in drawing order. Each module is one layer; the engine adds them to the scene.
import type { IUniform } from "three";
import type { Desk } from "@/features/tower/story";
import type { Layer, Shared, Tier } from "./common";

type Tower = { floorLight: IUniform<number[]> };
export const EXTRAS: Array<(shared: Shared, tier: Tier, tower: Tower, heroes: readonly Desk[]) => Layer> = [];
