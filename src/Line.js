import { LINE } from "./constants";

export class Line {
    constructor(key, pointKey1, pointKey2) {
        this.key = key;
        this.pointKey1 = pointKey1;
        this.pointKey2 = pointKey2;
    }

    draw(context, points, color = LINE.DEFAULT_COLOR) {
        context.beginPath();
        context.save();
        context.lineWidth = 1;
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.moveTo(points[this.pointKey1].x, points[this.pointKey1].y);
        context.lineTo(points[this.pointKey2].x, points[this.pointKey2].y);
        context.stroke();
        context.restore();
    }
}

// a point is stored as a value in points object
export function addLine(lines, line) {
    lines[line.key] = line;
}

// HELPERS
// ------------------------------
// it creates a key, to store a point to points as a key-value pair
export function newKey(lines) {
    let key;
    const keys = Object.keys(lines);
    if (keys.length === 0) key = "1";
    else key = Math.max(...keys.map((k) => parseInt(k))) + 1;
    return String(key);
}
