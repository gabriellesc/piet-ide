import { commands } from './orderedCommands.js';
import { WHITE, BLACK } from './colours.js';

// find the edge of the current colour block (containing [row, col]) which is furthest
// in the direction of the DP and furthest to the CC's direction of the DP's direction of travel
// (returns the [row, cell] in the next block, over this edge)
function getNextColour(grid, height, width, row, col, DP, CC) {
    let origColour = grid[row][col],
        visited = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(false)),
        farEdge = undefined;

    (function visitCell(row, col) {
        // if this cell is outside the grid, we have already visited this cell, or it is not part
        // of the current block, skip it
        if (
            row < 0 ||
            col < 0 ||
            row >= height ||
            col >= width ||
            visited[row][col] ||
            grid[row][col] != origColour
        ) {
            return;
        }
        visited[row][col] = true; // mark this cell as visited

        // check if we are on an edge in the direction of DP
        switch (DP) {
            // right
            case 0:
                if (col + 1 == width || grid[row][col + 1] != origColour) {
                    if (
                        // no edge previously found
                        !farEdge ||
                        // this edge is further than the previous in the direction of DP
                        col + 1 > farEdge[1] ||
                        // same distance in direction of DP, and further in direction of CC
                        // (right => uppermost block, or left => lowermost block)
                        (col + 1 == farEdge[1] &&
                            ((CC && row > farEdge[0]) || (!CC && row < farEdge[0])))
                    ) {
                        farEdge = [row, col + 1];
                    }
                }
                break;
            // down
            case 1:
                if (row + 1 == height || grid[row + 1][col] != origColour) {
                    if (
                        // no edge previously found
                        !farEdge ||
                        // this edge is further than the previous in the direction of DP
                        row + 1 > farEdge[0] ||
                        // same distance in direction of DP, and further in direction of CC
                        // (right => leftmost block, or left => rightmost block)
                        (row + 1 == farEdge[0] &&
                            ((CC && col < farEdge[1]) || (!CC && col > farEdge[1])))
                    ) {
                        farEdge = [row + 1, col];
                    }
                }
                break;
            // left
            case 2:
                if (col == 0 || grid[row][col - 1] != origColour) {
                    if (
                        // no edge previously found
                        !farEdge ||
                        // this edge is further than the previous in the direction of DP
                        col - 1 < farEdge[1] ||
                        // same distance in direction of DP, and further in direction of CC
                        // (right => uppermost block, or left => lowermost block)
                        (col - 1 == farEdge[1] &&
                            ((CC && row < farEdge[0]) || (!CC && row > farEdge[0])))
                    ) {
                        farEdge = [row, col - 1];
                    }
                }
                break;
            // up
            case 3:
                if (row == 0 || grid[row - 1][col] != origColour) {
                    if (
                        // no edge previously found
                        !farEdge ||
                        // this edge is further than the previous in the direction of DP
                        row - 1 < farEdge[0] ||
                        // same distance in direction of DP, and further in direction of CC
                        // (right => rightmost block, or left => leftmost block)
                        (row - 1 == farEdge[0] &&
                            ((CC && col > farEdge[1]) || (!CC && col < farEdge[1])))
                    ) {
                        farEdge = [row - 1, col];
                    }
                }
                break;
        }

        // visit neighbours
        visitCell(row, col + 1);
        visitCell(row + 1, col);
        visitCell(row, col - 1);
        visitCell(row - 1, col);
    })(row, col);

    return farEdge;
}

function* interpret(grid, blocks, blockSizes, getInputNum, getInputChar) {
    let height = grid.length,
        width = grid[0].length,
        row = 0, // start at top left cell
        col = 0,
        DP = 0, // index into [right, down, left, up], direction pointer initially points right
        CC = 0, // index into [left, right], codel chooser initially points left
        stack = [],
        output = '',
        commandList = [],
        // number of consecutive times that the compiler has tried to move off the current block
        // and hit an edge or black block
        bounceCount = 0,
        inst,
        nextColour,
        block,
        currCommand;

    // slide across a white block in a straight line
    function slide(row, col) {
        let nextRow = row,
            nextCol = col;

        switch (DP) {
            // right
            case 0:
                for (; nextCol < width && grid[row][nextCol] == WHITE; nextCol++);
                break;
            // down
            case 1:
                for (; nextRow < height && grid[nextRow][col] == WHITE; nextRow++);
                break;
            // left
            case 2:
                for (; nextCol >= 0 && grid[row][nextCol] == WHITE; nextCol--);
                break;
            // up
            case 3:
                for (; nextRow >= 0 && grid[nextRow][col] == WHITE; nextRow--);
                break;
        }

        return [nextRow, nextCol];
    }

    // attempt to exit a white block
    function slideOut(row, col) {
        // check if the first half of the route array is identical to the second half
        function routeIsDoubled(array) {
            let len = array.length;
            let first = array.slice(0, len / 2),
                second = array.slice(len / 2);

            return (
                len &&
                len % 2 == 0 &&
                first.every((elem, i) => elem[0] == second[i][0] && elem[1] == second[i][1])
            );
        }

        // try sliding out
        let [nextRow, nextCol] = slide(row, col);

        // we hit an outer edge or a black block
        if (
            nextRow < 0 ||
            nextRow >= height ||
            nextCol < 0 ||
            nextCol >= width ||
            grid[nextRow][nextCol] == BLACK
        ) {
            // now start from the white block
            [nextRow, nextCol] = [row, col];
        } else {
            return [nextRow, nextCol];
        }

        let whiteRoute = [];
        // check if we have retraced our route
        while (!routeIsDoubled(whiteRoute)) {
            // bounce twice (toggle CC and DP)
            bounce();
            bounce();

            // try sliding again
            [nextRow, nextCol] = slide(nextRow, nextCol);

            // we hit an outer edge or a black block
            if (
                nextRow < 0 ||
                nextRow >= height ||
                nextCol < 0 ||
                nextCol >= width ||
                grid[nextRow][nextCol] == BLACK
            ) {
                // step backwards into the white block
                switch (DP) {
                    // right
                    case 0:
                        nextCol--;
                        break;
                    // down
                    case 1:
                        nextRow--;
                        break;
                    // left
                    case 2:
                        nextCol++;
                        break;
                    // up
                    case 3:
                        nextRow++;
                        break;
                }

                // keep track of current position
                whiteRoute.push([nextRow, nextCol]);
            } else {
                return [nextRow, nextCol];
            }
        }

        // we could not find a way out
        return null;
    }

    // bounce off an outer edge or black block
    function bounce() {
        bounceCount++; // increment bounceCount

        if (bounceCount % 2 != 0) {
            // toggle CC
            CC = (CC + 1) % 2;
            return { CC };
        } else {
            // move DP clockwise 1 step
            DP = (DP + 1) % 4;
            return { DP };
        }
    }

    // terminate interpreter when bounce count reaches 8
    while (bounceCount < 8) {
        // save the current colour to use for indexing into the command list
        let colour = grid[row][col];
        // save the previous block size in case it will be pushed to the stack
        let pushVal = blockSizes[row][col];

        // find next colour block
        let [nextRow, nextCol] = getNextColour(grid, height, width, row, col, DP, CC);

        if (
            nextRow < 0 ||
            nextRow >= height ||
            nextCol < 0 ||
            nextCol >= width ||
            grid[nextRow][nextCol] == BLACK
        ) {
            // we hit an outer edge or a black block, so bounce off it (toggle DP/CC)
            yield bounce();
        } else if (grid[nextRow][nextCol] == WHITE) {
            let initDP = DP; // save the current DP

            // we hit a white block, so slide across it
            let out = slideOut(nextRow, nextCol);

            // we bounced, so update the DP+CC
            if (DP != initDP) {
                yield { DP, CC };
            }

            // we are trapped in a white block
            if (out == null) {
                return; // terminate the interpreter
            }

            [row, col] = out;

            bounceCount = 0; // we can move, so reset the bounce count
        } else {
            // we found the next block, so update the row/col
            [row, col] = [nextRow, nextCol];

            bounceCount = 0; // we can move, so reset the bounce count

            nextColour = grid[row][col];
            inst = commands[colour][nextColour]; // match colour transition to command
            block = blocks[row][col];

            currCommand = { block, inst };

            switch (inst) {
                /* Pushes the value of the colour block just exited on to the stack */
                case 'push':
                    stack.push(pushVal);
                    currCommand.inst += ' ' + pushVal;
                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top value off the stack and discards it */
                case 'pop':
                    var op = stack.pop();
                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack, adds them, and pushes the 
		   result back on the stack */
                case '+':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else {
                        var result = op1 + op2;

                        // integer overflow runtime error
                        if (!Number.isFinite(result)) {
                            currCommand.error = 'integer overflow';
                            yield { commandList, block, currCommand };

                            // add command to command list and terminate interpreter
                            commandList.push(currCommand);
                            yield { commandList };
                            return;
                        }

                        stack.push(result);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack, calculates the second top value
		   minus the top value, and pushes the result back on the stack */
                case '-':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else {
                        var result = op2 - op1;

                        // integer overflow runtime error
                        if (!Number.isFinite(result)) {
                            currCommand.error = 'integer overflow';
                            yield { commandList, block, currCommand };

                            // add command to command list and terminate interpreter
                            commandList.push(currCommand);
                            yield { commandList };
                            return;
                        }

                        stack.push(result);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack, multiplies them, and pushes 
		   the result back on the stack */
                case '*':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else {
                        var result = op1 * op2;

                        // integer overflow runtime error
                        if (!Number.isFinite(result)) {
                            currCommand.error = 'integer overflow';
                            yield { commandList, block, currCommand };

                            // add command to command list and terminate interpreter
                            commandList.push(currCommand);
                            yield { commandList };
                            return;
                        }

                        stack.push(result);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack, calculates the integer 
		   division of the second top value by the top value, and pushes the 
		   result back on the stack */
                case '/':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else if (op1 == 0) {
                        // ignore divide by zero instruction
                        currCommand.error = 'divide by zero';
                        // put values back on stack
                        stack.push(op2);
                        stack.push(op1);
                    } else {
                        stack.push(Math.floor(op2 / op1));
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack, calculates the second top value
		   modulo the top value, and pushes the result back on the stack. The 
		   result has the same sign as the divisor (the top value). */
                case 'mod':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else if (op1 == 0) {
                        // ignore divide by zero instruction
                        currCommand.error = 'divide by zero';
                        // put values back on stack
                        stack.push(op2);
                        stack.push(op1);
                    } else {
                        stack.push(op2 - op1 * Math.floor(op2 / op1));
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Replaces the top value of the stack with 0 if it is non-zero, and 1 if 
		   it is zero */
                case 'not':
                    var op = stack.pop();

                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    } else {
                        stack.push(op == 0 ? 1 : 0);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack, and pushes 1 on to the stack 
		   if the second top value is greater than the top value, and pushes 0 
		   if it is not greater */
                case '>':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else {
                        stack.push(op2 > op1 ? 1 : 0);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top value off the stack and rotates the DP clockwise that many 
		   steps (anticlockwise if negative) */
                case 'pointer':
                    var op = stack.pop();

                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    } else if (op > 0) {
                        // positive rotation (clockwise)
                        DP = (DP + op) % 4;
                    } else {
                        // negative rotation (anticlockwise)
                        DP = (DP - op) % 4;
                    }

                    yield { commandList, block, currCommand, stack, DP };
                    break;

                /* Pops the top value off the stack and toggles the CC that many times (the
		   absolute value of that many times if negative) */
                case 'switch':
                    var op = stack.pop();

                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    } else if (op > 0) {
                        CC = (CC + op) % 2;
                    } else {
                        // negative toggle times
                        CC = (CC + op) % 2;
                    }

                    yield { commandList, block, currCommand, stack, CC };
                    break;

                /* Pushes a copy of the top value on the stack on to the stack */
                case 'dup':
                    var op = stack.pop();

                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    } else {
                        stack.push(op);
                        stack.push(op);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top two values off the stack and "rolls" the remaining stack
		   entries to a depth equal to the second value popped, by a number of 
		   rolls equal to the first value popped. 
		   A single roll to depth n is defined as burying the top value on the 
		   stack n deep and bringing all values above it up by 1 place. 
		   A negative number of rolls rolls in the opposite direction. */
                case 'roll':
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        currCommand.error = 'stack underflow';
                        // one value on stack, so put it back
                        if (op1 != undefined) {
                            stack.push(op1);
                        }
                    } else if (op2 < 0) {
                        // ignore negative depth instruction
                        currCommand.error = 'negative roll depth';
                        // put values back on stack
                        stack.push(op2);
                        stack.push(op1);
                    } else {
                        // if depth argument is greater than current stack depth, use the current
                        // depth instead
                        if (op2 > stack.length) {
                            op2 = stack.length;
                        }

                        if (op1 > 0) {
                            for (var roll = 0; roll < op1; roll++) {
                                // put top value into stack at depth
                                stack.splice(-op2, 0, stack[stack.length - 1]);
                                // remove original top value from top of stack
                                stack.pop();
                            }
                        } else {
                            // negative rolls
                            for (var roll = 0; roll > op1; roll--) {
                                // put nth value onto top of stack and remove original nth value
                                stack.push(...stack.splice(-op2, 1));
                            }
                        }
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Reads a value from STDIN as a number and pushes it on to the stack */
                case 'in(num)':
                    var newNum = getInputNum();

                    // If no input is waiting on STDIN, or if an integer value is not received,
                    // this is an error and the command is ignored
                    if (newNum == null) {
                        currCommand.error = 'invalid input';
                    } else {
                        stack.push(newNum);
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Reads a value from STDIN as a character and pushes it on to the stack */
                case 'in(char)':
                    var newChar = getInputChar();

                    // If no input is waiting on STDIN, this is an error and the command is ignored
                    if (newChar == null) {
                        currCommand.error = 'invalid input';
                    } else {
                        stack.push(newChar.charCodeAt());
                    }

                    yield { commandList, block, currCommand, stack };
                    break;

                /* Pops the top value off the stack and prints it to STDOUT as a number */
                case 'out(num)':
                    var op = stack.pop();

                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    } else {
                        output += op;
                    }

                    yield { commandList, block, currCommand, stack, output };
                    break;

                /* Pops the top value off the stack and prints it to STDOUT as a character */
                case 'out(char)':
                    var op = stack.pop();

                    // ignore stack underflow
                    if (op == undefined) {
                        currCommand.error = 'stack underflow';
                    } else {
                        output += String.fromCharCode(op);
                    }

                    yield { commandList, block, currCommand, stack, output };
                    break;
            }

            commandList.push(currCommand); // add the current command to the command list
        }
    }
}

export default interpret;
