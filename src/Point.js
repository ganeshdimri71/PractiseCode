import { POINT } from "./constants";

export class Point {
  constructor(key, x, y) {
    this.key = key;
    this.x = x;
    this.y = y;
    this.isSelected = false;
  }

  draw(context, radius = POINT.RADIUS, color = POINT.DEFAULT_COLOR) {
    context.beginPath();
    context.save();
    context.fillStyle = color;
    context.arc(this.x, this.y, radius, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  }
}

// a point is stored as a value in points object
export function addPoint(points, point) {
  points[point.key] = point;
}

// HELPERS
// ------------------------------
// it creates a key, to store a point to points as a key-value pair
export function newKey(points) {
  let key;
  const keys = Object.keys(points);
  if (keys.length === 0) key = "1";
  else key = Math.max(...keys.map((k) => parseInt(k))) + 1;
  return String(key);
}

// signature: (object, object, number) => boolean
// check if the position is over a point
export function isPositionOverPoint(position, point, r) {
  return (
    Math.abs(position.x - point.x) <= r && Math.abs(position.y - point.y) <= r
  );
}
