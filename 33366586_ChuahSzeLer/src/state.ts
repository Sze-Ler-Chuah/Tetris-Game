import { Action, Constants, State, Tetromino, iblock, jblock, lblock, oblock, sblock, tblock, wallKickTable, zblock } from "./type.ts";
import { seedGenerator, createArray } from "./util.ts";
export{ initialState,  Left, Right, Down, Rotate, Restart, HardDrop, Pause, Resume, dropSpeed as dropSpeed} 

//** State Updates */

/** Tetrominoes */
const tetrominoes = [oblock, tblock, iblock, jblock, lblock, sblock, zblock];

/** State processing */
const initialState: State = {
    level: 1,
    score: 0,
    highScore: 0,
    seed : seedGenerator().next().next(),
    currentTetromino : tetrominoes[seedGenerator().value],
    nextTetromino : tetrominoes[ seedGenerator().next().value],
    yReach : false,
    xLeftReach : false,
    xRightReach : false,
    store : [],
    currentLineClear : 0,
    maxStayTime : 20,
    stayTime : 20,
    gameEnd: false,
    pause: false
  
  } as const;

/** Current Tetrominoes Grid Position
 * Used to obtain x,y coordinates of each cube of current tetrominoes
 * @param s Current state
 * @param rotatedBlock Rotated block (Set to empty array by default as it is only used in Rotate function where the tetrominoes are rotated)
 * @returns An Array of x,y position of each cube and color of the tetromino
 */

const currentTetrominoGrid = (s: State, rotatedBlock : ReadonlyArray<ReadonlyArray<number>> = []) => {
    const currentTetromino = rotatedBlock.length > 0 ? rotatedBlock : s.currentTetromino.block;
    return currentTetromino.map((row, y) => 
      row.map((stored, x) => stored ? {
        x : x + s.currentTetromino.x,
        y : y + s.currentTetromino.y,
        color : s.currentTetromino.color,
      } as Tetromino : undefined )
      .filter((block) => block !== undefined))
      .reduce((arr,blockArr) => arr.concat(blockArr), [] as Tetromino[]);
  }
  
  /** Bounds 
   * Used to check if the tetromino has reached the boundary of the grid
   * @param s Current state
   * @param increaseX The value to increase the x value of the tetromino
   * @param increaseY The value to increase the y value of the tetromino
   * @param rotatedBlock Rotated block (Set to empty array by default as it is only used in Rotate function where the tetrominoes are rotated)
   * @returns A boolean value to indicate if the tetromino has reached the boundary of the grid
  */

  const boundaryCheck = (s:State, increaseX : number, increaseY : number, rotatedBlock : ReadonlyArray<ReadonlyArray<number>> = []): boolean => {
    const inboard = currentTetrominoGrid(s,rotatedBlock),  
          check = inboard.filter((block) => block!.x + increaseX < 0 || 
                                 block!.x + increaseX > Constants.GRID_WIDTH - 1 || 
                                 block!.y + increaseY > Constants.GRID_HEIGHT - 1)
    return check.length > 0;
  }
  
  /** Collision */
  /** Y Collision
   * Used to check if the tetromino has collided with another tetromino
   * @param s Current state
   * @param nextVal The value to increase the y value of the tetromino
   * @param rotatedBlock Rotated block (Set to empty array by default as it is only used in Rotate function where the tetrominoes are rotated)
   * @returns A boolean value to indicate if the tetromino has collided with another tetromino
   */

  const yCollision = (s: State, nextVal : number, rotatedBlock : ReadonlyArray<ReadonlyArray<number>> = []): boolean => {
    const nextPos = currentTetrominoGrid(s,rotatedBlock)
                    .map((row, y) =>
                    {
                      return row ? 
                            (s.store.filter((block) => (block.x === row.x ) && (block.y === row.y + nextVal)).length > 0) : 
                            false;
                    }
                    ).reduce((acc,exist) => acc || exist, false)
      return nextPos
   }
  
  /** X Collision
   * Used to check if the tetromino has collided with another tetromino
   * @param s Current state
   * @param nextVal The value to increase the x value of the tetromino
   * @param rotatedBlock Rotated block (Set to empty array by default as it is only used in Rotate function where the tetrominoes are rotated)
   * @returns A boolean value to indicate if the tetromino has collided with another tetromino
   */

  const xCollision = (s: State,nextVal : number, rotatedBlock : ReadonlyArray<ReadonlyArray<number>> = []): boolean => {
    const nextPos = currentTetrominoGrid(s,rotatedBlock)
                    .map((row, y) =>
                    {
                      return row ? 
                            (s.store.filter((block) => (block.x === row.x + nextVal ) && (block.y === row.y)).length > 0) : 
                            false;
                    }
                    ).reduce((acc,exist) => acc || exist, false)
      return nextPos;
   }
  
  /** Update the Array used to store placed tetrominoes 
   * @param s Current state
   * @param hardDropVal The value to increase the y value of the tetromino
   * @returns An updated array (s.store) with the newly placed tetrominoes
   */
  const updateBlock = (s: State, hardDropVal : number = 0) => 
    s.currentTetromino.block.map((row, y) => 
      row
        .map((stored, x) => stored? {
          x : x + s.currentTetromino.x,
          // Check if the tetromino is hard dropped or not (If it is hard dropped, the y value will be increased by the hardDropVal)
          y : y + (hardDropVal === 0 ? s.currentTetromino.y : s.currentTetromino.y  + hardDropVal),
          color : s.currentTetromino.color,
        } as Tetromino : undefined)
        .filter((block) => block !== undefined))
        .reduce((arr,blockArr) => arr.concat(blockArr), s.store as Tetromino[]);

/** Check each row to delete fully occupied rows
 * @param s Current state
 * @returns A new state with the fully occupied rows deleted, score updated, level updated, maxStayTime updated, stayTime updated
 */
const checkRow = (s: State): State => {
    const playBoard = createArray(Constants.GRID_HEIGHT, Constants.GRID_WIDTH);
    //Update the play board with the placed tetrominoes ('None' -> 1)
    s.store.map((block) => {
      playBoard[block.y][block.x] = 1;
    });
    //Check if any row is fully occupied and delete it if it is fully occupied & update the s.store (y value of tetrominoes will be updated)
    playBoard.map((row, y) => {
      row.every((cell) => cell !== "None") ? (
        s = {
          ...s,
          store: s.store.filter((block) => block.y !== y).map((block) => {
            return block.y < y ? { ...block, y: block.y + 1 } : block;
          }),
          //Each fully occupied row will give 1000 points
          score: s.score + 1000,
          highScore: s.score + 1000 > s.highScore ? s.score + 1000 : s.highScore,
          level: s.currentLineClear + 1 >= 5 ? s.level + 1 : s.level,
          currentLineClear: (s.currentLineClear + 1) % 5,
          maxStayTime : s.maxStayTime - 1  > 0 && (s.currentLineClear + 1) >= 5 ? s.maxStayTime - 1 : s.maxStayTime,
          stayTime : s.maxStayTime - 1 > 0 && (s.currentLineClear + 1) >= 5 ? s.maxStayTime - 1 : s.maxStayTime,
        }
      ) : null;
    });
    return s;
  };
  
  /** Check Game Over
   * @param s Current state
   * @returns A new state with the gameEnd updated
   */
  const checkGamover = (s: State): State => {
    const gameEnd = s.store.some((block) => block.y === 0);
    return gameEnd ? ({...s, gameEnd : true} as State) : ({...s} as State);
  };


/** NextBlock
 * Used to manage the state of next tetromino
 * @param s Current state
 * @returns A new state with the next tetromino
 */
class NextBlock implements Action{
    apply(s: State): State{
      return {
        ...s,
        seed : s.seed.next(),
        currentTetromino : s.nextTetromino,
        nextTetromino : tetrominoes[s.seed.value],
        yReach : false,
        xLeftReach : false,
        xRightReach : false,
      } as State}}
  
  /** Down
   *  Used to move the tetromino down
   * @param val The value to move the tetromino down 
   * @returns A new state with the tetromino moved down (y value of current tetromino updated) 
   *          or not moved down (y value of current tetromino not updated, yReach updated, store updated)
   */
  
  class Down implements Action {
    constructor(public readonly val : number) {}
    apply(s: State): State { 
      const currVal = s.currentTetromino.y,
            nextVal = currVal + this.val;
  
      /** At here s.yReach is used to check if the tetromino has reached the bottom of the grid or collided with another tetromino
       * If s.yReach is true, it will first check if any row is occupied and remove it if it is occupied 
       * Then it will check if the game is over. Else, generate next tetromino and continue playing */
  
      return s.yReach ? (tick(checkGamover(checkRow(s)), new NextBlock())):
               boundaryCheck(s,0,this.val) || yCollision(s,this.val) ?
             ({...s, currentTetromino : {...s.currentTetromino, y : currVal}, yReach : true, store : updateBlock(s)} as State): 
             ({...s, currentTetromino : {...s.currentTetromino, y : nextVal}} as State);
    }
  }
  /** Left
   * Used to move the tetromino left
   * @param val The value to move the tetromino left
   * @returns A new state with the tetromino moved left or not moved left (x value of current tetromino updated, xLeftReach updated, xRightReach updated) 
   *       
   */
  
  class Left implements Action {
    constructor(public readonly val: number) {}
    apply(s: State): State {
      const currVal = s.currentTetromino.x;
      const nextVal = currVal + this.val;
  
      /** At here s.xLeftReach is used to check if the tetromino has reached the leftmost of the grid or collided with another tetromino
       * If s.xLeftReach is true, x value of the tetromino will not be updated anymore and cannot move to left anymore */
  
      return s.xLeftReach ? ({...s, currentTetromino : {...s.currentTetromino, x : currVal}, xRightReach : false} as State) :
             boundaryCheck(s,this.val,0) || xCollision(s, this.val) ? 
             ({...s, currentTetromino: {...s.currentTetromino, x: currVal}, xLeftReach: true, xRightReach : false}as State):
             ({...s, currentTetromino: {...s.currentTetromino, x: nextVal}, xLeftReach: false, xRightReach : false}as State);   
  
    }
  }
  
  /** Right 
   * Used to move the tetromino right
   * @param val The value to move the tetromino right
   * @returns A new state with the tetromino moved right or not moved right (x value of current tetromino updated, xLeftReach updated, xRightReach updated) 
  */
  class Right implements Action{
    constructor(public readonly val : number) {}
    apply(s: State): State{
      const currVal = s.currentTetromino.x,
            nextVal = s.currentTetromino.x + this.val;
  
      /** At here s.xRightReach is used to check if the tetromino has reached the rightmost of the grid or collided with another tetromino
       * If s.xRightReach is true, x value of the tetromino will not be updated anymore and cannot move to right anymore */
  
      return s.xRightReach ? ({...s, currentTetromino : {...s.currentTetromino, x : currVal}, xRightReach : true, xLeftReach : false} as State) :
             boundaryCheck(s,this.val,0) ||xCollision(s, this.val) ?
             ({...s,currentTetromino : {...s.currentTetromino, x : currVal},xRightReach : true, xLeftReach : false } as State) : 
             ({...s,currentTetromino : {...s.currentTetromino, x : nextVal},xRightReach : false, xLeftReach : false} as State);
    }
  }
  
  /** Rotate 
   * Used to rotate the tetromino
   * @returns A new state with the tetromino rotated (current tetromino's block updated, current tetromino's rotation index updated, 
   *          x value of current tetromino updated, y value of current tetromino updated, xLeftReach updated, xRightReach updated) or 
   *          not rotated (nothing updated)
  */
  class Rotate implements Action {
      apply(s: State): State {
  
              // Rotate the block by transposing and reversing the rows to acheive rotation of 90 degrees clockwise
        const rotatedBlock = s.currentTetromino.block.map((row,i) =>  
                              row.map((_,j) => s.currentTetromino.block[j][i])).map(row => row.reverse()),
              // Compute the current rotation index so that wall kick can be applied
              rotateIndex = (s.currentTetromino.currentRotation + 1) % 4 as 0 | 1 | 2 | 3,
              // Check if the tetromino is I block or not (I block has different wall kick table)
              wallKickType = s.currentTetromino.name === "I" ? wallKickTable.I : wallKickTable.normal,
              // Let the tetromino kick against the wall and check if the rotation is valid or not 
              tryWallKick = (xyCoordinate : ReadonlyArray<number>) => (
              {
              valid : !xCollision(s, xyCoordinate[0], rotatedBlock) &&
                      !yCollision(s, xyCoordinate[1], rotatedBlock) &&
                      !boundaryCheck(s, xyCoordinate[0], xyCoordinate[1], rotatedBlock) ,
              x : xyCoordinate[0] as number,
              y : xyCoordinate[1] as number
              }),
              // Find the first valid rotation and apply it to the tetromino 
              validRotate = wallKickType[rotateIndex].map(tryWallKick).find(({valid}) =>valid === true)
        return !validRotate ? 
               ({...s} as State) :
               ({...s, 
                currentTetromino : {...s.currentTetromino, block : rotatedBlock, 
                                     currentRotation : rotateIndex, x : s.currentTetromino.x + validRotate.x, 
                                     y : s.currentTetromino.y + validRotate.y},
                xLeftReach : false, 
                xRightReach : false} as State)
  }
  }
  
  /** HardDrop 
   * Used to drop the tetromino to the current lowest of the grid
   * @returns A new state with the tetromino dropped to the lowest of the grid (current tetromino's y value updated, store updated, yReach updated)
  */
  class HardDrop implements Action {
    apply(s: State): State {
        const dropVal =<T>(_ : T, num : number):number => num + 1
        const checkCollisionAndBoundary = (num : number) => yCollision(s, num) || boundaryCheck(s,0,num)
        const finalDropVal = [...Array(Constants.GRID_HEIGHT - s.currentTetromino.y )].map(dropVal).map(checkCollisionAndBoundary).indexOf(true)
        
        return ({...s, currentTetromino : {...s.currentTetromino, y : s.currentTetromino.y + finalDropVal}, yReach : true, store : updateBlock(s, finalDropVal)} as State)
      
    }
  }
  /** Restart
   * Used to restart the game
   * @returns Initial state with highscore updated or remain the same 
   */
  class Restart implements Action {
    apply(s: State): State {
      return s.gameEnd ? ({...initialState, highScore :s.highScore} as State) : s;
    }
  }
  
  /** dropSpeed 
   * Used to increase the speed of the tetromino drop when the level increases 
   * @param val The value to increase the speed of the tetromino drop
   * @returns A new state with the tetromino move down 
  */
  class dropSpeed implements Action {
    constructor(public readonly val : number) {}
    apply(s: State): State {
      const currVal = s.currentTetromino.y,
            nextVal = currVal + this.val;
  
            /** At here s.yReach is used to check if the tetromino has reached the bottom of the grid or collided with another tetromino
             * If s.yReach is true, it will first check if any row is occupied and remove it if it is occupied
             * Then it will check if the game is over. Else, generate next tetromino and continue playing
             * s.stay time is the time the tetromino stays at current position before moving down again
             */
  
      return s.yReach ? tick(checkGamover(checkRow(s)), new NextBlock()) : 
              s.stayTime === 0 ? boundaryCheck(s,0,this.val) || yCollision(s,this.val) ?
              ({...s, currentTetromino : {...s.currentTetromino, y : currVal} , yReach : true, store : updateBlock(s)} as State) :
              ({...s, currentTetromino : {...s.currentTetromino, y : nextVal} , stayTime : s.maxStayTime, xLeftReach : false, xRightReach: false} as State) : 
              ({...s, stayTime : s.stayTime - 1, xLeftReach : false, xRightReach: false} as State)
    }
  }
  
  /** Pause
   * Used to pause the game
   * @returns A new state with pause updated to true
   */
  class Pause implements Action {
    apply(s: State): State {
      return ({...s, pause : true} as State)
    }
  }
  
  /** Resume
   * Used to resume the game
   * @returns A new state with pause updated to false
  */

  class Resume implements Action {
    apply(s: State): State {
      return ({...s, pause : false} as State)
    }
  }

  /**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State, action : Action) => action.apply(s);