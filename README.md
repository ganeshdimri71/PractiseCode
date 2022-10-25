# m2d-perf App

Let's build the Proof of Concept of a perf-ormant frontend CAD app on the basic features (see Roadmap).

## Roadmap

-   ✓ **Create a point** (on clickking over the canvas)
-   ✓ **Create a linear path**. On clickking over the canvas create a linear path connecting the last point to the cursor
-   ✓ **Create a hanging line**. On mousemove from last point to the cursor (draw it on a different layer to minimize redraws)
-   ✓ **Add a form to draw n connected points at once** (to allow developers to do performance tests)
-   ✓ **Select a point**. There should be two buttons: D and S. D is the default active button. On click S: S is active:
    -   ✓ Drop (don't display) the hanging line
    -   ✓ If the user clicks on a point, the point is selected and it changes its color to blue;
    -   ✓ Display its coordinates x, y values on a sidebar
-   ✓ **Drop (don't display) the hanging line on press key ESC**
-   **Snap cursor to point x,y**. When the cursor is over a point, meaning when cursor x,y are inside the point circle, the cursor x,y should be set to the point x,y (a possible solution is to create an `adjustedCursor` var)
-   **No two points with same x,y**. On click over an existing point, don't create a new point (implement "Snap cursor to point" first)
-   **Move a point**. The user should be able to drag the selected point. Its connected paths updates. x, y values don't updates on mouse move, they update on mouse up
-   **Horizontal and vertical guidelines**. When the user move the mouse, we need to draw magenta lines from the cursor to points aligned horizontally or vertically to the cursor
-   **Keyboard shortcut for D and S**. On press D key the active tool becomes D, on press S key the active tool becomes S
-   ✓ **Reset canvas**. On click on a "Delete drawing" button the canvas should be reset, the drawing deleted, and data re-initialized
-   **When overlapping, select only ONE point**. When two or more points are overlapping, on click of the intersection between them, we should select only one (the last one created)
-   **Select multiple elements** (points or paths) at once, by dragging a selection window
-   **Move multiple elements** by dragging the selection
-   **Save data**. When the user refreshes the browser, the drawing should not be reset (store the data to the browser local storage)
-   **Deploy app on Github pages**

---

-   ~~**Change the point color**. On mouseover a point change its color from grey (#999) to darkgrey (#777). Don't redraw the entire canvas, but use the "draw on top" technique~~

## Approach

-   From simple to complex
-   Avoid dependencies, until you need them
-   Avoid refactoring too soon, let the code be unstructured and repetitive, to better see the patterns
-   Don't solve problems you don't have in front of you

## Process

-   PRs should be tested on reviews, with Profiler and Performance Dev Tools
-   Commits should be tested for performance
-   Better too many comments, then too few

## Why no redux, no Konva, less React?

1. React components return react elements, which are js object, which are descriptions of a DOM node
1. Konva by default, when changing a drawing, deletes and redraws the whole drawing. This is not what we want in all use cases (for performance reason)
1. In m2d we had react components returning konva elements, which are not react elements, but konva shapes. Instead of returning a description of a DOM node, we returned a description of a drawing on the canvas

_to be continued_
