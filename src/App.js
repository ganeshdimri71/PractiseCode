import { useState, useEffect, useCallback, useRef } from "react";
import { CANVAS, LINE, POINT, TOOLS } from "./constants";
import { addLine, Line } from "./Line";
import { addPoint, isCursorOverPoint, newKey, Point } from "./Point";

// CANVAS STATE
// ------------------------------
let points = {};
let lines = {};
let lastPointDrawn = null;

//this function allows the user to draw nodes and paths.
function draw(context, x, y) {
  const currentPoint = new Point(newKey(points), x, y);
  addPoint(points, currentPoint);

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

// COMPONENTS
// ------------------------------
// TODO will extract components later, let's keep the code un-structured for now
export default function App() {
  const inputNumberOfPointsToAddRef = useRef();
  const baseCanvasRef = useRef();
  // now it's a point, but when we'll implement multi-seletion (SHIFT+click or by dragging a selection window) it might be an array of points (and paths)
  // this state var was initially out of App, it was a "canvas state var", but then I needed to bring it in to display on the sidebar the coordinates of a selected point

  //this function simulates a user that randomly draws n points and n-1 lines
  const onClickAddNPoints = useCallback(() => {
    let x;
    let y;
    lastPointDrawn = null;
    const context = baseCanvasRef.current.getContext("2d");
    for (let i = 0; i < inputNumberOfPointsToAddRef.current.value; i++) {
      x = Math.floor(Math.random() * baseCanvasRef.current.width);
      y = Math.floor(Math.random() * baseCanvasRef.current.height);
      draw(context, x, y);
    }
    lastPointDrawn = null;
  }, []);

  const onMouseDownCanvas = useCallback((e) => {
    const context = baseCanvasRef.current.getContext("2d");
    const cursor = { x: e.clientX, y: e.clientY };
    draw(context, e.clientX, e.clientY);
  }, []);

  return (
    <>
      <div id="add-points">
        <input ref={inputNumberOfPointsToAddRef} className="input" />
        <button className="button" onClick={onClickAddNPoints}>
          add points
        </button>
      </div>

      <canvas
        id={CANVAS.BASE_CANVAS_ID}
        ref={baseCanvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={onMouseDownCanvas}
      ></canvas>
    </>
  );
}
