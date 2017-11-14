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

// start at top left cell, bounceCount of 0, DP and CC of 0, by default
// (bounceCount: number of consecutive times that the compiler has tried to move off the current
// block and hit an edge or black block)
// (DP: index into [right, down, left, up], direction pointer initially points right)
// (CC: index into [left, right], codel chooser initially points left)
function compile(grid, blockSizes, row = 0, col = 0, DP = 0, CC = 0, bounceCount = 0) {
    let height = grid.length,
        width = grid[0].length,
        commandList = [],
        loopCounter = 0;

    // slide across a white block
    function slide() {}

    // bounce off an outer edge or black block
    function bounce() {
        bounceCount++; // increment bounceCount

        if (bounceCount % 2 != 0) {
            // toggle CC
            CC = (CC + 1) % 2;
            commandList.push('CC ' + CC);
        } else {
            // move DP clockwise 1 step
            DP = (DP + 1) % 4;
            commandList.push('DP ' + DP);
        }
    }

    // terminate compiler when bounce count reaches 8
    while (bounceCount < 8) {
        // if we have looped more than 100 times, this might be an infinite loop
        if (loopCounter++ > 100) {
            commandList.push('TIMEOUT');
            return commandList;
        }

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
            bounce();
        } else if (grid[nextRow][nextCol] == WHITE) {
            // we hit a white block, so slide through it
        } else {
            // we found the next block, so update the row/col
            [row, col] = [nextRow, nextCol];
            let nextColour = grid[row][col];

            bounceCount = 0; // we can move, so reset the bounce count

            let command = commands[colour][nextColour]; // match colour transition to command
            if (command == 'push') {
                commandList.push(command.toUpperCase() + ' ' + pushVal);
            } else if (command == 'pointer') {
                // if the next command is POINTER, we should examine all possible DP values
                commandList.push(compile(grid, blockSizes, row, col, 0, CC, bounceCount));
                commandList.push(compile(grid, blockSizes, row, col, 1, CC, bounceCount));
                commandList.push(compile(grid, blockSizes, row, col, 2, CC, bounceCount));
                commandList.push(compile(grid, blockSizes, row, col, 3, CC, bounceCount));
            } else if (command == 'switch') {
                // if the next command is SWITCH, we should examine all possible CC values
                commandList.push(compile(grid, blockSizes, row, col, DP, 0, bounceCount));
                commandList.push(compile(grid, blockSizes, row, col, DP, 1, bounceCount));
            } else {
                commandList.push(command.toUpperCase());
            }
        }
    }

    return commandList;
}

function* run(commandList, getInput) {
    let DP = 0, // index into [right, down, left, up], direction pointer initially points right
        CC = 0, // index into [left, right], codel chooser initially points left
        stack = [],
        output = '';

    // iterate over commands
    for (var command of commandList) {
        if (command.startsWith('CC')) {
            /* toggle CC */

            CC = (CC + 1) % 2;
            yield { CC };
        } else if (command.startsWith('DP')) {
            /* move DP clockwise 1 step */

            DP = (DP + 1) % 4;
            yield { DP };
        } else if (command.startsWith('PUSH')) {
            /* Pushes the value of the colour block just exited on to the stack */

            var [_, pushVal] = command.split(' '); // extract value from command
            stack.push(pushVal);

            yield { stack };
        } else if (['+', '/', '>', '-', 'MOD', '*', 'ROLL'].includes(command)) {
            /* binary stack operations */

            var op1 = stack.pop(),
                op2 = stack.pop();

            // ignore stack underflow
            if (op1 == undefined || op2 == undefined) {
                stack.push(op2);
                stack.push(op1);

                yield { stack };
                continue;
            }

            switch (command) {
                /* Pops the top two values off the stack, adds them, and pushes the 
		   result back on the stack */
                case '+':
                    stack.push(op1 + op2);
                    break;

                /* Pops the top two values off the stack, calculates the second top value
		   minus the top value, and pushes the result back on the stack */
                case '-':
                    stack.push(op2 - op1);
                    break;

                /* Pops the top two values off the stack, multiplies them, and pushes 
		   the result back on the stack */
                case '*':
                    stack.push(op1 * op2);
                    break;

                /* Pops the top two values off the stack, calculates the integer 
		   division of the second top value by the top value, and pushes the 
		   result back on the stack */
                case '/':
                    // ignore divide by zero instruction
                    if (op1 == 0) {
                        stack.push(op2);
                        stack.push(op1);
                    } else {
                        stack.push(Math.floor(op2 / op1));
                    }
                    break;

                /* Pops the top two values off the stack, calculates the second top value
		   modulo the top value, and pushes the result back on the stack. The 
		   result has the same sign as the divisor (the top value). */
                case 'MOD':
                    // divide by 0 error; instruction is ignored
                    if (op1 == 0) {
                        stack.push(op2);
                        stack.push(op1);
                        yield { error: 'Divide by zero', stack };
                    }

                    stack.push(op2 - op1 * Math.floor(op2 / op1));
                    break;

                /* Pops the top two values off the stack, and pushes 1 on to the stack 
		   if the second top value is greater than the top value, and pushes 0 
		   if it is not greater */
                case '>':
                    stack.push(op2 > op1 ? 1 : 0);
                    break;

                /* Pops the top two values off the stack and "rolls" the remaining stack
		   entries to a depth equal to the second value popped, by a number of 
		   rolls equal to the first value popped. 
		   A single roll to depth n is defined as burying the top value on the 
		   stack n deep and bringing all values above it up by 1 place. 
		   A negative number of rolls rolls in the opposite direction. */
                case 'ROLL':
                    // negative depth error; instruction is ignored
                    if (op2 < 0) {
                        stack.push(op2);
                        stack.push(op1);
                        yield { error: 'Negative depth', stack };
                        break;
                    }

                    // depth argument is greater than current stack depth, so use the current
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
                    break;
            }

            yield { stack };
        } else {
            /* remaining commands */

            switch (command) {
                /* Pops the top value off the stack and discards it */
                case 'POP':
                    // ignore stack underflow
                    stack.pop();
                    yield { stack };

                /* Replaces the top value of the stack with 0 if it is non-zero, and 1 if 
		   it is zero */
                case 'NOT':
                    var val = stack.pop();

                    // ignore stack underflow
                    if (val != undefined) {
                        stack.push(val == 0);
                    }
                    yield { stack };
                    break;

                /* Pops the top value off the stack and rotates the DP clockwise that many 
		   steps (anticlockwise if negative) */
                case 'POINTER':
                    var val = stack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        break;
                    }

                    // positive rotation (clockwise)
                    if (val > 0) {
                        DP = (DP + val) % 4;
                        yield { stack, DP };
                        break;
                    }
                    // negative rotation (anticlockwise)
                    DP = (DP - val) % 4;
                    yield { stack, DP };
                    break;

                /* Pops the top value off the stack and toggles the CC that many times (the
		   absolute value of that many times if negative) */
                case 'SWITCH':
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack };
                        break;
                    }

                    if (val > 0) {
                        CC = (CC + val) % 2;
                        yield { stack, CC };
                        break;
                    }
                    // negative toggle times
                    CC = (CC + val) % 2;
                    yield { stack, CC };
                    break;

                /* Pushes a copy of the top value on the stack on to the stack */
                case 'DUP':
                    var val = stack.pop();

                    // ignore stack underflow
                    if (val != undefined) {
                        stack.push(val);
                        stack.push(val);
                    }
                    yield { stack };
                    break;

                /* Reads a value from STDIN as a number and pushes it on to the stack. */
                // This reads a single character as a number - should parse more intelligently?
                case 'IN(NUM)':
                    // If no input is waiting on STDIN, this is an error and the command is ignored.
                    //  If an integer read does not receive an integer value, this is an error and the command is ignored
                    var newNum = getInput();

                    stack.push(parseInt(newNum));

                    yield { stack };
                    break;

                /* Reads a value from STDIN as a character and pushes it on to the stack. */
                case 'IN(CHAR)':
                    // If no input is waiting on STDIN, this is an error and the command is ignored.
                    var newChar = getInput();

                    stack.push(newChar.charCodeAt());

                    yield { stack };
                    break;

                /* Pops the top value off the stack and prints it to STDOUT as a number */
                case 'OUT(NUM)':
                    var val = stack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack };
                        break;
                    }

                    output += val;
                    yield { stack, output };
                    break;

                /* Pops the top value off the stack and prints it to STDOUT as a character */
                case 'OUT(CHAR)':
                    var val = stack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        break;
                    }
                    output += String.fromCharCode(val);
                    yield { stack, output };
                    break;
            }
        }
    }
}

export { compile, run };
