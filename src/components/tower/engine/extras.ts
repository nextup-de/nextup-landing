// The layers around the tower, in drawing order. Each module is one layer; the engine adds them to the scene.
//   ground     streets, sodium light, the Spree, the floor of the rail cut
//   city       Friedrichshain house by house, the city beyond, the bridge, the viaduct and its station, trees, lamps
//   landmarks  the Fernsehturm and Mitte on the horizon
//   movers     S-Bahn, ICE, the U1, the M10, cars, cranes: everything on its own clock
import type { IUniform } from "three";
import type { Desk } from "@/features/tower/story";
import { createCity } from "./city";
import type { Layer, Shared, Tier } from "./common";
import { createGround } from "./ground";
import { createLandmarks } from "./landmarks";
import { createMovers } from "./movers";

type Tower = { floorLight: IUniform<number[]> };
export const EXTRAS: Array<(shared: Shared, tier: Tier, tower: Tower, heroes: readonly Desk[]) => Layer> = [
  createGround, createCity, createLandmarks, createMovers,
];
