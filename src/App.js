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
  // now it's a point, but when we'll implement multi-seletion (SHIFT+click or by dragging a selection window) it might be an array of points (and paths)
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

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        clearCanvas(interactiveCanvasRef.current);
        lastPointDrawn = null;
      } else if (e.key.toUpperCase() == TOOLS.SELECT) {
        switchToSTool(TOOLS.SELECT);
      } else if (e.key.toUpperCase() == TOOLS.DRAW) {
        switchToDTool(TOOLS.DRAW);
      }
    },
    [switchToSTool, switchToDTool]
  );

  useEffect(() => {
    console.log("I am onkeydown");
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
      draw(context, x, y);
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
        // console.log("points", points);
        // {1: Point, 2: Point, 3: Point, 4: Point, 5: Point}
        // 1: Point {key: '1', x: 339, y: 169, isSelected: false}
        // 2: Point {key: '2', x: 280, y: 391, isSelected: false}
        // 3: Point {key: '3', x: 784, y: 355, isSelected: false}
        // 4: Point {key: '4', x: 764, y: 196, isSelected: true}
        // 5: Point {key: '5', x: 337, y: 167, isSelected: false}
        // console.log("Object.values(points)", Object.values(points));
        //           (5) [Point, Point, Point, Point, Point]
        // 0: Point {key: '1', x: 347, y: 159, isSelected: false}
        // 1: Point {key: '2', x: 326, y: 284, isSelected: false}
        // 2: Point {key: '3', x: 685, y: 266, isSelected: false}
        // 3: Point {key: '4', x: 676, y: 164, isSelected: true}
        // 4: Point {key: '5', x: 350, y: 161, isSelected: false}
        for (const point of Object.values(points)) {
          if (isCursorOverPoint(cursor, point, POINT.RADIUS)) {
            point.isSelected = true;
            point.draw(context, POINT.RADIUS, POINT.SELECTED_COLOR);
            setSelectedPoint(point);
          }
        }
      } else {
        draw(context, e.clientX, e.clientY);
      }
    },
    [activeTool, selectedPoint]
  );

  const onMouseMoveCanvas = useCallback((e) => {
    const context = interactiveCanvasRef.current.getContext("2d");
    if (lastPointDrawn) {
      clearCanvas(interactiveCanvasRef.current);
      // just draw the line, not the entire scene
      drawHangingLine(
        context,
        lastPointDrawn.x,
        lastPointDrawn.y,
        e.clientX,
        e.clientY
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
