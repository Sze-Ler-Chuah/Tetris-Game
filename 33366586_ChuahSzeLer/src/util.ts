import { LazySequence } from "./type.ts";
export{seedGenerator, createArray}

/** Utility functions */

/** Tetromino Random Generator 
 * Lazy Sequence is used here to generate a random sequence of tetrominoes
 */

function seedGenerator(): LazySequence<number>{
    // LCG using GCC's constants
    const m = 0x80000000,
          a = 1103515245,
          c = 12345,
          hash = (n: number) => (a * n + c) % m;
    return function _next(n: number): LazySequence<number> {
      return { value: n%7 , next:() => _next(hash(n)) 
      };
    }(10)
  }

/** Create Array
 * Used to create an array with initialised value ('None') with the given row and column
 * @param row The number of rows of the array
 * @param column The number of columns of the array
 * @returns An array with initialised value ('None') with the given row and column
 */
const createArray = (row:number, column:number) => {
    return Array(row).fill('None').map(() => Array(column).fill('None')); }