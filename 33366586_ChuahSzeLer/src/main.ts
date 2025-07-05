/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { fromEvent, interval, merge,takeUntil } from "rxjs";
import { map, filter, scan, withLatestFrom, startWith} from "rxjs/operators";
import { State, Key, Event, Action, Constants, Block, Viewport} from "./type.ts";
import {initialState ,Left, Right, Down, Rotate, Restart, HardDrop, Pause, Resume, dropSpeed} from "./state.ts";
import {createArray} from "./util.ts";

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key) =>
    key$.pipe(filter(({ code }) => code === keyCode));


  const left$ = fromKey("KeyA");
  const right$ = fromKey("KeyD");
  const down$ = fromKey("KeyS");
  const up$ = fromKey("KeyW");
  const enter$ = fromKey("Enter");
  const space$ = fromKey("Space");
  const pause$ = fromKey("KeyP");
  const resume$ = fromKey("KeyR");

  /** Observables */

  // Merge all the observables into one
  const keyboard = merge(left$.pipe(map(() => new Left(-1))), right$.pipe(map(() => new Right(1))), down$.pipe(map(() => new Down(1))),
                   up$.pipe(map(() => new Rotate())), enter$.pipe(map(() => new Restart())) , space$.pipe(map(() => new HardDrop())), 
                   pause$.pipe(map(() => new Pause())), resume$.pipe(map(() => new Resume())));
  
  /** Create grid 
   * Used to create the grid on the canvas
   * @returns A grid on the canvas
  */

  const gridDraw = () => { 
    const grid = createArray(Constants.GRID_HEIGHT, Constants.GRID_WIDTH);
    grid.map((row, y) => {
      row.map((value, x) => {
        value !== 0 ? 
          svg.appendChild(createSvgElement(svg.namespaceURI, "rect", {
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${Block.WIDTH *x}`,
            y: `${Block.HEIGHT * y}`,
            style: "fill: none ; stroke : black ; stroke-width : 0.5 ; opacity : 0.1",
          })) : null;
      });
    });
  }

  /** Draw Cube (General Function) 
   * Used to draw the cube on the canvas
   * @param svg The canvas
   * @param x The x value of the tetromino
   * @param y The y value of the tetromino
   * @param color The color of the tetromino
   * @returns A tetromino on the canvas
  */

  const drawCube = (svg: SVGElement, x: number, y: number, color: string) => {
    const block = createSvgElement(svg.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.WIDTH * x}`,
      y: `${Block.HEIGHT * y}`,
      style: `fill: ${color}`,
    });
    svg.appendChild(block);
  };

  /** Draw Teteromino(Higher Order Function) 
   * returns a function that maps over the `block` array and draws the blocks on the SVG)
   * Used to draw the tetromino on the canvas
   * @param svg The canvas
   * @param block The block of the tetromino
   * @param xOffset The x value of the tetromino
   * @param yOffset The y value of the tetromino
   * @param color The color of the tetromino
   * @returns A tetromino on the canvas
  */
  const drawTetromino = (svg: SVGElement, block: ReadonlyArray<ReadonlyArray<number>>, xOffset: number, yOffset: number, color: string) => {
    return () => {
      block.map((row, y) => {
        row.map((value, x) => {
          value !== 0 ? 
          drawCube(svg, x + xOffset, y + yOffset, color) : 
          null;
        });
      });
    }
  }
  
  /** Determines the rate of time steps 
   * Used to determine the rate of time steps
   * @returns A new state with the tetromino moved down
  */
  const tick$ =  interval(Constants.TICK_RATE_MS).pipe(map(() => new dropSpeed(1))) 

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {  
      /** Clear the playing board */
      const clear = (elem: SVGGraphicsElement) => {
        elem.innerHTML = "svg.lastChild";}
    
    //Prior rendering, check if the game has ended or not
    if(!s.gameEnd)
    {
      clear(svg);
      clear(preview);
      gridDraw();
      
    //Update text
    levelText.innerHTML = `${s.level}`;
    scoreText.innerHTML = `${s.score}`;
    highScoreText.innerHTML = `${s.highScore}`;

    //Update position of current tetromino
    const drawCurrentTetromino = drawTetromino(svg, s.currentTetromino.block, s.currentTetromino.x, s.currentTetromino.y, s.currentTetromino.color);
    drawCurrentTetromino();
    
    //Update the next tetromino
    const drawNextTetromino = drawTetromino(preview, s.nextTetromino.block, 2, 1, s.nextTetromino.color);
    drawNextTetromino();
    
     //Show all the current placed blocks
     s.store.map((tetro) => {
      const block = [[1]];
      const drawPlacedBlock = drawTetromino(svg, block, tetro.x, tetro.y, tetro.color);
      drawPlacedBlock();
    });
     
    
  }
}

/** Pause Event
 * Used to pause and resume the game
 * Emits Pause or Resume action based on key pressed by user  
*/
const pauseEvent$ = merge(
  pause$.pipe(map(() => new Pause())),
  resume$.pipe(map(() => new Resume()))
).pipe(
  startWith(new Resume()),
  scan((acc: Action, v: Action) =>
    v instanceof Pause ? new Pause() : v instanceof Resume ? new Resume() : acc)
);

const source$ = merge(tick$, keyboard)
  .pipe(
    withLatestFrom(pauseEvent$),
    scan((tick, [action, pause]) =>
      pause instanceof Pause ? tick : action instanceof Resume ? tick : action.apply(tick)
    , initialState)
  )
  .subscribe((s: State) => {
    render(s);
    if (s.gameEnd) {
      svg.appendChild(gameover);
      show(gameover);
    } else {
      hide(gameover);
    }
  });

}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
