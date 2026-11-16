// Where things stand around the tower: a stylised Friedrichshain, not a survey. The real relations are kept -
// Warschauer Strasse east of the tower, the rail corridor north of it, the U-Bahn viaduct along the street, the
// Spree to the south-west, the Fernsehturm west-north-west down the line - the distances are composed for the view.
// World: metres. +X east, +Y up, +Z south (so north is -Z and west is -X); the tower stands on the origin.
// No React, no DOM, no three.js here.

export type XZ = readonly [number, number];

/** Compass bearing (degrees, 0 = north, clockwise) and distance from the tower to a ground position. */
export const fromTower = (bearing: number, metres: number): XZ => {
  const r = (bearing * Math.PI) / 180;
  return [Math.sin(r) * metres, -Math.cos(r) * metres];
};

// Warschauer Strasse runs north-south, east of the tower. Two carriageways around a planted middle with the
// tram tracks; traffic keeps right, so the west carriageway carries southbound cars (toward +Z).
export const STREET = {
  x: 62,                      // centre line
  from: -420, to: 620,        // z: from the far end of the bridge to the foreground
  lanes: [                    // x of each lane's middle, and its direction along z (+1 = southbound)
    { x: 51.6, dir: 1 }, { x: 54.9, dir: 1 }, { x: 69.1, dir: -1 }, { x: 72.4, dir: -1 },
  ],
  tram: [{ x: 59.4, dir: 1 }, { x: 64.6, dir: -1 }],
  median: { x: 62, width: 3.2 },                        // the row of trees between the tram tracks
  kerbWest: 49.6, kerbEast: 74.4, walkWest: 44.5, walkEast: 79.5,
} as const;

// The rail corridor: a wide cut north of the tower, S-Bahn and long-distance tracks running east-west.
export const RAIL = {
  zFrom: -98, zTo: -44, y: -7,          // the cut's edges and the depth of its floor
  tracks: [-90, -84, -76, -70, -62, -56, -50],  // z of each track's centre line
  xFrom: -1400, xTo: 700,
} as const;
// West of the bridge the tracks climb out of the cut onto the Stadtbahn viaduct, toward Ostbahnhof and Mitte: the
// cut ends where the rails reach street level, and from there brick arches carry them, ten metres up.
export const CLIMB = { from: -60, to: -420, top: 10, cutEnd: -205 } as const;
/** The height of the rails at x along the corridor. */
export function railY(x: number) {
  if (x >= CLIMB.from) return RAIL.y;
  if (x <= CLIMB.to) return CLIMB.top;
  const t = (x - CLIMB.from) / (CLIMB.to - CLIMB.from);
  return RAIL.y + (CLIMB.top - RAIL.y) * t * t * (3 - 2 * t);
}
// Warschauer Bruecke: the street crossing the cut.
export const BRIDGE = { zFrom: -104, zTo: -38, y: 0, deck: 1.2 } as const;

// The U-Bahn (U1/U3) viaduct on the east side of the street, ending in its station just south-east of the tower.
export const VIADUCT = { x: 90, zFrom: 660, zTo: 28, y: 6.4, width: 8.5, station: { zFrom: 28, zTo: 120 } } as const;

// The Spree, south-west of the tower, flowing north-west toward the centre. A band given by its centre line.
export const RIVER = { from: [240, 560] as XZ, to: [-1750, -330] as XZ, width: 150 } as const;

// The Fernsehturm: on its true bearing from the tower (302 degrees), brought closer than its real 3.1 km so
// that it reads beside a tower in the foreground - the compression a long lens gives.
export const FERNSEHTURM = { at: fromTower(302, 2150), height: 368 } as const;

// The establishing shot: from the south-east, above the street. Layers are composed for this camera first.
export const HERO_CAMERA = { pos: [168, 44, 198] as const, target: [-6, 66, 0] as const, fov: 30 } as const;
