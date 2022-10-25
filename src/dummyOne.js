//  this function allows the user to draw points and lines.
function draw(context, position {
    let existingPoint;
     // checking first if the position where I want to draw is already occupied by another point
  for (const point of Object.values(points)) {
    if (isPositionOverPoint(position, point, POINT.RADIUS)) {
      existingPoint = point;
      break;
    }
}
   // if it is already occupied then the current point is that one and no other point will be created
  // otherwise a new point will be created
  let currentPoint;
  if (existingPoint) {
    currentPoint = existingPoint;
  } else {
    currentPoint = new Point(newKey(points), position.x, position.y);
    addPoint(points, currentPoint);
  }

  if (lastPointDrawn) {
    const currentLine = new Line(
      newKey(lines),
      lastPointDrawn.key,
      currentPoint.key
    );
    addLine(lines, currentLine);
    currentLine.draw(context, points);
  }
  // just draw the point, not the entire scene
  currentPoint.draw(context);
  lastPointDrawn = currentPoint;
}
