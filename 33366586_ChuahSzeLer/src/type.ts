export { Viewport, Constants, Block, oblock, tblock, iblock, jblock, lblock, sblock, zblock, wallKickTable };
export type { Tetromino, State, LazySequence, Key, Event, Action };

/** Constants */
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 50, 
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

/** User input */
type Key = "KeyS" | "KeyA" | "KeyD" | "KeyW" | "Enter" | "Space" | "KeyP" | "KeyR";

type Event = "keydown" | "keyup" | "keypress";

/** Game State
 * Used by main.ts to store the game state
*/
type State = Readonly<{
  level: number;
  score: number;
  highScore: number;
  seed : LazySequence<number>;
  currentTetromino : Tetromino;
  nextTetromino : Tetromino;
  yReach : boolean;
  xLeftReach : boolean;
  xRightReach : boolean;
  store : ReadonlyArray<Tetromino>;
  currentLineClear : number;
  maxStayTime : number;
  stayTime : number;
  gameEnd: boolean;
  pause : boolean ;
}>;

/** Lazy Sequence
 * Used by seedGenerator() in util.ts to generate a random sequence of tetrominoes
 * @typedef {Object} LazySequence
 * @property {T} value - Value of the sequence
 * @property {function():LazySequence<T>} next - Next value of the sequence
 */
interface LazySequence<T> {
  value: T;
  next():LazySequence<T>;
}

/** Tetromino type 
 * @typedef {Object} Tetromino
 * @property {string} name - Tetromino name
 * @property {number[][]} block - Tetromino block
 * @property {number} x - Tetromino x position
 * @property {number} y - Tetromino y position
 * @property {string} color - Tetromino color
 * @property {number} currentRotation - Tetromino current rotation
*/
type Tetromino = Readonly<{
    name : string;
    block : ReadonlyArray<ReadonlyArray<number>>;
    x : number;
    y : number;
    color : string;
    currentRotation : number;
  }>;
  
  /** Create Tetrominos */
  const 
    oblock : Tetromino = {
      name : "O",
      block : [[1,1],[1,1]],
      x : 3,
      y : 0,
      color : "yellow",
      currentRotation : 0,
    } , 
    tblock : Tetromino = {
      name : "T",
      block : [[0,1,0],
               [1,1,1],
               [0,0,0]],
      x : 3,
      y : 0,
      color : "purple",
      currentRotation : 0,
    },
    iblock : Tetromino = {
      name : "I",
      block : [[0,0,0,0],
               [1,1,1,1],
               [0,0,0,0],
               [0,0,0,0]],           
      x : 3,
      y : 0,
      color : "lightblue",
      currentRotation : 0,
    },
    jblock : Tetromino = {
      name  : "J",
      block : [[0,0,1],
               [1,1,1],
               [0,0,0]],
      x : 3,
      y : 0,
      color : "orange",
      currentRotation : 0,
    },
    lblock : Tetromino = {
      name : "L",
      block : [[1,0,0],
               [1,1,1],
               [0,0,0]],
      x : 3,
      y : 0,
      color : "blue", 
      currentRotation : 0,
    },
    sblock : Tetromino = {
      name : "S",
      block : [[0,1,1],
               [1,1,0],
               [0,0,0]],
      x : 3,
      y : 0,
      color : "green",
      currentRotation : 0,
    },
    zblock : Tetromino = {
      name : "Z",
      block : [[1,1,0],
               [0,1,1],
               [0,0,0]],
      x : 3,
      y : 0,
      color : "red",
      currentRotation : 0,
      }

// Path: src/type.ts
/** Wall Kick Table
 * @typedef {Object} Kick
 * @property {number[][][]} normal - Clockwise rotation kick table
 */
type Kick = {
  normal: [number, number][][];
  I: [number, number][][];
}

/** Movement of Tetrominoes */
interface Action {
  apply(s: State): State;
}

const wallKickTable: Kick = {
  normal: [
    [[0, 0],[-1, 0],[-1, -1],[0, 2],[-1, 2]], //3 >> 0
    [[0, 0],[-1, 0],[-1, 1],[0, -2],[-1, -2]], // 0 >> 1
    [[0, 0],[1, 0],[1, -1],[0, 2],[1, 2]], // 1 >> 2
    [[0, 0],[1, 0],[1, 1],[0, -2],[1, -2]], // 2 >> 3
    
  ],
  I: [
    [[0, 0],[1, 0],[-2, 0],[1, -2],[-2, 1]], // 3 >> 0
    [[0, 0],[-2, 0],[1, 0],[-2, -1],[1, 2]], // 0 >> 1
    [[0, 0],[-1, 0],[2, 0],[-1, 2],[2, -1]], // 1 >> 2
    [[0, 0],[2, 0],[-1, 0],[2, 1],[-1, -2]], // 2 >> 3
  ],
}

