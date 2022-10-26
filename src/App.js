import { useState, useEffect, useCallback, useRef } from "react";
import { CANVAS, GUIDELINE, LINE, POINT, TOOLS } from "./constants";
import { addLine, getLineKeysThatConnectPoints, Line } from "./Line";
import {
    addPoint,
    isPositionInRangeXPoint,
    isPositionInRangeYPoint,
    isPositionOverPoint,
    newKey,
    Point,
} from "./Point";

// CANVAS STATE
// ------------------------------
let points = {};
let lines = {};
let lastPointDrawn = null;
// this is the snapped cursor, if there is no snap its value will be the value of the cursor
let snappedCursor = null;
// this is the snapped point if there is one otherwise the value will be null
/* remember that the snappedCursor is different from snappedPoint, because the first can happen even without
   a snapped point, for example it can with the guidelines.
   so the snappedPoint is a sufficient condition for snappedCursor and snappedCursor is necessary condition for snappedPoint.
   the logical implication is :  snappedPoint => snappedCursor.
*/
let snappedPoint = null;

// this function allows the user to draw points and lines.
function draw(context, position) {
    //if there is a snapped point then start from it
    let existingPoint = snappedPoint;
    let currentPoint;
    if (existingPoint) {
        currentPoint = existingPoint;
    } else {
        currentPoint = new Point(newKey(points), position.x, position.y);
        addPoint(points, currentPoint);
    }

    // if there is a hangingline and the point I clicked is different from the one I have started from I execute the if
    if (lastPointDrawn && lastPointDrawn.key !== currentPoint.key) {
        // checking if there is already a line that connects 2 points, if there isn't I create it
        if (
            getLineKeysThatConnectPoints(
                lines,
                lastPointDrawn.key,
                currentPoint.key
            ).length === 0
        ) {
            const currentLine = new Line(
                newKey(lines),
                lastPointDrawn.key,
                currentPoint.key
            );
            addLine(lines, currentLine);
            currentLine.draw(context, points);
        }
    }
    // just draw the point, not the entire scene
    if (!existingPoint) currentPoint.draw(context);
    lastPointDrawn = currentPoint;
}

//this function draws a generic line
function drawLine(context, x1, y1, x2, y2, color = LINE.DEFAULT_COLOR) {
    context.beginPath();
    context.save();
    context.lineWidth = 1;
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.restore();
}
//this function clears the passed canvas
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
        setActiveTool(TOOLS.DRAW);
        const context = baseCanvasRef.current.getContext("2d");
        // on switching to D, de-select selected point
        if (selectedPoint) {
            selectedPoint.isSelected = false;
            selectedPoint.draw(context, POINT.RADIUS, POINT.DEFAULT_COLOR);
            setSelectedPoint(null);
        }
    }, [selectedPoint]);

    const switchToSTool = useCallback(() => {
        setActiveTool(TOOLS.SELECT);
        // on switching to S we clear the interactive canvas and we forget about the last point drawn
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
            if (activeTool === TOOLS.SELECT) {
                // first off, un-select a selected point (if there is one)
                if (selectedPoint) {
                    selectedPoint.isSelected = false;
                    selectedPoint.draw(
                        context,
                        POINT.RADIUS,
                        POINT.DEFAULT_COLOR
                    );
                    setSelectedPoint(null);
                }
                // then select the one the cursor is over
                // this resumes to the check if there is a snapped point because for now a point gets snapped when we go over it
                if (snappedPoint) {
                    snappedPoint.isSelected = true;
                    snappedPoint.draw(
                        context,
                        POINT.RADIUS,
                        POINT.SELECTED_COLOR
                    );
                    setSelectedPoint(snappedPoint);
                }
            } else {
                // if we are in draw mode we will draw passing the snapped cursor
                draw(context, snappedCursor);
            }
        },
        [activeTool, selectedPoint]
    );

    const onMouseMoveCanvas = useCallback((e) => {
        const context = interactiveCanvasRef.current.getContext("2d");
        const cursor = {
            x: e.clientX,
            y: e.clientY,
        };
        // the snappedCursor variable must always keep a value and can be equal to cursor.
        snappedCursor = cursor;
        // at beginning the snappedPoint must be set to null
        snappedPoint = null;
        // these variables will store the guidelines objects
        let xGuideLine;
        let yGuideLine;
        // this for loop will make the snapping and guidelines checks
        for (const point of Object.values(points)) {
            // if the cursor is in the range given around the x of the point then the y guideline must exist
            if (isPositionInRangeXPoint(cursor, point, POINT.RADIUS)) {
                // if the guideline doesn't exist yet we must create it
                if (!yGuideLine) {
                    // of course we modify the snapped cursor in order to snap the x position
                    snappedCursor.x = point.x;
                    yGuideLine = {
                        x1: point.x,
                        y1: point.y < cursor.y ? point.y : cursor.y,
                        x2: point.x,
                        y2: point.y < cursor.y ? cursor.y : point.y,
                    };
                } else {
                    // if we find another point that is aligned to the y guideline
                    if (point.x === yGuideLine.x1) {
                        // we check if his y is out of the range of the guideline
                        // if it is out of the range his y will become a new extreme of the range
                        if (point.y < yGuideLine.y1) yGuideLine.y1 = point.y;
                        else if (point.y > yGuideLine.y2)
                            yGuideLine.y2 = point.y;
                    }
                }
            }
            // if the cursor is in the range given around the y of the point then the x guideline must exist
            if (isPositionInRangeYPoint(cursor, point, POINT.RADIUS)) {
                // if the guideline doesn't exist yet we must create it
                if (!xGuideLine) {
                    // of course we modify the snapped cursor in order to snap the y position
                    snappedCursor.y = point.y;
                    xGuideLine = {
                        x1: point.x < cursor.x ? point.x : cursor.x,
                        y1: point.y,
                        x2: point.x < cursor.x ? cursor.x : point.x,
                        y2: point.y,
                    };
                } else {
                    // if we find another point that is aligned to the x guideline
                    if (point.y === xGuideLine.y1) {
                        // we check if his x is out of the range of the guideline
                        // if it is out of the range his x will become a new extreme of the range
                        if (point.x < xGuideLine.x1) xGuideLine.x1 = point.x;
                        else if (point.x > xGuideLine.x2)
                            xGuideLine.x2 = point.x;
                    }
                }
            }
            // checks if cursor is over a point, if is over a point that point will be snapped and the snappedCursor will be equal to its position
            if (isPositionOverPoint(cursor, point, POINT.RADIUS)) {
                snappedCursor = { x: point.x, y: point.y };
                snappedPoint = point;
            }
        }

        clearCanvas(interactiveCanvasRef.current);

        if (xGuideLine) {
            drawLine(
                context,
                xGuideLine.x1,
                xGuideLine.y1,
                xGuideLine.x2,
                xGuideLine.y2,
                GUIDELINE.DEFAULT_COLOR
            );
        }
        if (yGuideLine) {
            drawLine(
                context,
                yGuideLine.x1,
                yGuideLine.y1,
                yGuideLine.x2,
                yGuideLine.y2,
                GUIDELINE.DEFAULT_COLOR
            );
        }
        if (lastPointDrawn) {
            drawLine(
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

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown, false);
        return () => {
            document.removeEventListener("keydown", onKeyDown, false);
        };
    }, [onKeyDown]);

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
                    className={
                        activeTool === TOOLS.DRAW ? "selected-button" : "button"
                    }
                    onClick={switchToDTool}
                >
                    D
                </button>
                <button
                    className={
                        activeTool === TOOLS.SELECT
                            ? "selected-button"
                            : "button"
                    }
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
