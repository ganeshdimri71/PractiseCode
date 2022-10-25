import { useState, useEffect, useCallback, useRef } from "react";
import { CANVAS, LINE, POINT, TOOLS } from "./constants";
import { addLine, getLineKeysThatConnectPoints, Line } from "./Line";
import { addPoint, isPositionOverPoint, newKey, Point } from "./Point";

// CANVAS STATE
// ------------------------------
let points = {};
let lines = {};
let lastPointDrawn = null;
let snappedCursor = null;

// this function allows the user to draw points and lines.
// function draw(context, position) {
//   let existingPoint;
//   // checking first if the position where I want to draw is already occupied by another point
//   for (const point of Object.values(points)) {
//     if (isPositionOverPoint(position, point, POINT.RADIUS)) {
//       existingPoint = point;
//       break;
//     }
//   }
//   // if it is already occupied then the current point is that one and no other point will be created
//   // otherwise a new point will be created
//   let currentPoint;
//   if (existingPoint) {
//     currentPoint = existingPoint;
//   } else {
//     currentPoint = new Point(newKey(points), position.x, position.y);
//     addPoint(points, currentPoint);
//   }

//   // if there is a hangingline and the point I clicked is different from the one I have started from I execute the if
//   // checking if there is already a line that connects 2 points, if there isn't I create it
//   const currentLine = new Line(
//     newKey(lines),
//     lastPointDrawn.key,
//     currentPoint.key
//   );
//   addLine(lines, currentLine);

//   currentLine.draw(context, points);
//   // just draw the point, not the entire scene
//   console.log("currentPoint", currentPoint);
//   if (!existingPoint) currentPoint.draw(context);
//   lastPointDrawn = currentPoint;
//   //   console.log("lastPointDrawn", lastPointDrawn);
// }

//  this function allows the user to draw points and lines.
function draw(context, position) {
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
  console.log("currentPoint", currentPoint);
  console.log("points", points);
  currentPoint.draw(context);
  lastPointDrawn = currentPoint;
}
// just draw the point, not the entire scene

function drawHangingLine(context, x1, y1, x2, y2) {
  context.beginPath();
  context.save();
  context.lineWidth = 1;
  context.lineJoin = "round";
  context.strokeStyle = LINE.DEFAULT_COLOR;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.restore();
}

function clearCanvas(canvas) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
}

// COMPONENTS
// ------------------------------
// TODO will extract components later, let's keep the code un-structured for now
export default function App() {
  const [activeTool, setActiveTool] = useState(TOOLS.DRAW);
  const inputNumberOfPointsToAddRef = useRef();
  const baseCanvasRef = useRef();
  const interactiveCanvasRef = useRef();
  // now it's a point, but when we'll implement multi-seletion (SHIFT+click or by dragging a selection window) it might be an array of points (and lines)
  // this state var was initially out of App, it was a "canvas state var", but then I needed to bring it in to display on the sidebar the coordinates of a selected point
  const [selectedPoint, setSelectedPoint] = useState(null);

  const switchToDTool = useCallback(() => {
    setActiveTool("D");
    const context = baseCanvasRef.current.getContext("2d");
    // on switching to D, de-select selected point
    if (selectedPoint) {
      selectedPoint.isSelected = false;
      selectedPoint.draw(context, POINT.RADIUS, POINT.DEFAULT_COLOR);
      setSelectedPoint(null);
    }
  }, [selectedPoint]);

  const switchToSTool = useCallback(() => {
    setActiveTool("S");
    clearCanvas(interactiveCanvasRef.current);
    lastPointDrawn = null;
  }, []);

  // this function handles all the key down events for each case there will be an action taken
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        clearCanvas(interactiveCanvasRef.current);
        lastPointDrawn = null;
      } else if (e.key.toUpperCase() === TOOLS.SELECT) {
        switchToSTool(TOOLS.SELECT);
      } else if (e.key.toUpperCase() === TOOLS.DRAW) {
        switchToDTool(TOOLS.DRAW);
      }
    },
    [switchToSTool, switchToDTool]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown, false);
    return () => {
      document.removeEventListener("keydown", onKeyDown, false);
    };
  }, [onKeyDown]);

  //this function simulates a user that randomly draws n points and n-1 lines
  const onClickAddNPoints = useCallback(() => {
    let x;
    let y;
    lastPointDrawn = null;
    clearCanvas(interactiveCanvasRef.current);
    const context = baseCanvasRef.current.getContext("2d");
    for (let i = 0; i < inputNumberOfPointsToAddRef.current.value; i++) {
      x = Math.floor(Math.random() * baseCanvasRef.current.width);
      y = Math.floor(Math.random() * baseCanvasRef.current.height);
      draw(context, { x, y });
    }
    lastPointDrawn = null;
  }, []);

  const onMouseDownCanvas = useCallback(
    (e) => {
      const context = baseCanvasRef.current.getContext("2d");
      const cursor = { x: e.clientX, y: e.clientY };
      if (activeTool === "S") {
        // first off, un-select a selected point (if there is one)
        if (selectedPoint) {
          selectedPoint.isSelected = false;
          selectedPoint.draw(context, POINT.RADIUS, POINT.DEFAULT_COLOR);
          setSelectedPoint(null);
        }
        // then select the one the cursor is over (if it is over one)
        for (const point of Object.values(points)) {
          if (isPositionOverPoint(cursor, point, POINT.RADIUS)) {
            point.isSelected = true;
            point.draw(context, POINT.RADIUS, POINT.SELECTED_COLOR);
            setSelectedPoint(point);
          }
        }
      } else {
        draw(context, cursor);
      }
    },
    [activeTool, selectedPoint]
  );

  const onMouseMoveCanvas = useCallback((e) => {
    const context = interactiveCanvasRef.current.getContext("2d");
    if (lastPointDrawn) {
      clearCanvas(interactiveCanvasRef.current);
      const cursor = {
        x: e.clientX,
        y: e.clientY,
      };
      snappedCursor = cursor;
      for (const point of Object.values(points)) {
        if (isPositionOverPoint(cursor, point, POINT.RADIUS)) {
          snappedCursor = { x: point.x, y: point.y };
        }
      }
      // just draw the line, not the entire scene
      drawHangingLine(
        context,
        lastPointDrawn.x,
        lastPointDrawn.y,
        snappedCursor.x,
        snappedCursor.y
      );
    }
  }, []);

  const reset = useCallback((e) => {
    setActiveTool(TOOLS.DRAW);
    setSelectedPoint(null);
    points = {};
    lines = {};
    lastPointDrawn = null;
    clearCanvas(baseCanvasRef.current);
    clearCanvas(interactiveCanvasRef.current);
  }, []);

  return (
    <>
      <div id="add-points">
        <input ref={inputNumberOfPointsToAddRef} className="input" />
        <button className="button" onClick={onClickAddNPoints}>
          add points
        </button>
      </div>

      <div id="tools">
        <button
          className={activeTool === TOOLS.DRAW ? "selected-button" : "button"}
          onClick={switchToDTool}
        >
          D
        </button>
        <button
          className={activeTool === TOOLS.SELECT ? "selected-button" : "button"}
          onClick={switchToSTool}
        >
          S
        </button>
      </div>

      <div id="last-selected">
        {selectedPoint
          ? `x:${selectedPoint.x}   y:${selectedPoint.y}`
          : undefined}
      </div>

      <div id="reset">
        <button className="button" onClick={reset}>
          RESET
        </button>
      </div>

      <canvas
        id={CANVAS.BASE_CANVAS_ID}
        ref={baseCanvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={onMouseDownCanvas}
        onMouseMove={onMouseMoveCanvas}
      ></canvas>
      <canvas
        id={CANVAS.INTERACTIVE_CANVAS_ID}
        ref={interactiveCanvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
    </>
  );
}
