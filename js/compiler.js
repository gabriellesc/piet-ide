import { commands } from './orderedCommands.js';

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
        } else {
            // move DP clockwise 1 step
            DP = (DP + 1) % 4;
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
        // we hit an outer edge or a black block
        if (
            nextRow < 0 ||
            nextRow >= height ||
            nextCol < 0 ||
            nextCol >= width ||
            grid[nextRow][nextCol] == 19
        ) {
            bounce();
        } else {
            // we found the next block, so update the row/col
            [row, col] = [nextRow, nextCol];
            let nextColour = grid[row][col];

            if (nextColour == 18) {
                // white block
                slide();
            } else {
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
    }

    return commandList;
}

function* run(commands, grid, blockSizes, getInput) {
    // start at top left cell
    let row = 0,
        col = 0,
        // number of consecutive times that the compiler has tried to move off the current
        // block and hit an edge or black block
        bounceCount = 0,
        DP = 0, // index into [right, down, left, up], direction pointer initially points right
        CC = 0, // index into [left, right], codel chooser initially points left
        stack = [],
        output = '';

    // terminate compiler when bounce count reaches 8
    while (bounceCount < 8) {
        // save the previous block size in case it will be pushed to the stack
        let pushVal = blockSizes[row][col];

        // find next colour block
        let [row, col] = getNextColour(grid, row, col, DP, CC);
        let nextColour = grid[row][col];

        if (nextColour == 18) {
            // white block
        } else if (nextColour == 19) {
            // black block
            bounceCount++; // increment bounceCount

            if (bounceCount % 2 != 0) {
                // move DP clockwise 1 step
                yield { DP: (DP + 1) % 4 };
            } else {
                // toggle CC
                yield { CC: (CC + 1) % 2 };
            }
        } else {
            bounceCount = 0; // we can move, so reset the bounce count

            let inst = commands[nextColour]; // match colour transition to command

            // binary stack operations
            if (['+', '/', '>', '-', 'mod', '*', 'roll'].includes(inst)) {
                var newStack = stack.slice();
                var op1 = newStack.pop(),
                    op2 = newStack.pop();

                // ignore stack underflow
                if (op1 == undefined || op2 == undefined) {
                    yield { stack: stack };
                    continue;
                }

                switch (inst) {
                    /* Pops the top two values off the stack, adds them, and pushes the 
			   result back on the stack */
                    case '+':
                        newStack.push(op1 + op2);
                        break;

                    /* Pops the top two values off the stack, calculates the integer 
			   division of the second top value by the top value, and pushes the 
			   result back on the stack */
                    case '/':
                        // ignore divide by zero instruction
                        if (op1 == 0) {
                            newStack.push(op2);
                            newStack.push(op1);
                        } else {
                            newStack.push(Math.floor(op2 / op1));
                        }
                        break;

                    /* Pops the top two values off the stack, and pushes 1 on to the stack 
			   if the second top value is greater than the top value, and pushes 0 
			   if it is not greater */
                    case '>':
                        newStack.push(op2 > op1 ? 1 : 0);
                        break;

                    /* Pops the top two values off the stack, calculates the second top value
			   minus the top value, and pushes the result back on the stack */
                    case '-':
                        newStack.push(op2 - op1);
                        break;

                    /* Pops the top two values off the stack, calculates the second top value
			   modulo the top value, and pushes the result back on the stack. The 
			   result has the same sign as the divisor (the top value). */
                    case 'mod':
                        // divide by 0 error; instruction is ignored
                        if (op1 == 0) {
                            newStack.push(op2);
                            newStack.push(op1);
                            yield { error: 'Divide by zero', stack: stack };
                        }

                        newStack.push(op2 - op1 * Math.floor(op2 / op1));
                        break;

                    /* Pops the top two values off the stack, multiplies them, and pushes 
			   the result back on the stack */
                    case '*':
                        newStack.push(op1 * op2);
                        break;

                    /* Pops the top two values off the stack and "rolls" the remaining stack
			   entries to a depth equal to the second value popped, by a number of 
			   rolls equal to the first value popped. 
			   A single roll to depth n is defined as burying the top value on the 
			   stack n deep and bringing all values above it up by 1 place. 
			   A negative number of rolls rolls in the opposite direction. */
                    case 'roll':
                        // negative depth error; instruction is ignored
                        if (op2 < 0) {
                            newStack.push(op2);
                            newStack.push(op1);
                            yield { error: 'Negative depth', stack: stack };
                        }

                        // depth argument is greater than current stack depth, so use the current
                        // depth instead
                        if (op2 > newStack.length) {
                            op2 = newStack.length;
                        }

                        if (op1 > 0) {
                            for (var roll = 0; roll < op1; roll++) {
                                // put top value into stack at depth
                                newStack.splice(-op2, 0, newStack[newStack.length - 1]);
                                // remove original top value from top of stack
                                newStack.pop();
                            }
                        } else {
                            // negative rolls
                            for (var roll = 0; roll > op1; roll--) {
                                // put nth value onto top of stack and remove original nth value
                                newStack.push(...newStack.splice(-op2, 1));
                            }
                        }
                        break;
                }

                yield { stack: newStack };
                continue;
            }

            switch (inst) {
                /* Pushes a copy of the top value on the stack on to the stack */
                case 'dup':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        continue;
                    }
                    newStack.push(val);
                    newStack.push(val);

                    yield { stack: newStack };
                    continue;

                /* Reads a value from STDIN as a character and pushes it on to the stack. */
                case 'in(char)':
                    // If no input is waiting on STDIN, this is an error and the command is ignored.
                    var newChar = getInput();

                    var newStack = stack.slice();
                    newStack.push(newChar.charCodeAt());

                    yield { stack: newStack };
                    continue;

                /* Pushes the value of the colour block just exited on to the stack */
                case 'push':
                    var newStack = stack.slice();
                    newStack.push(pushVal);

                    yield { stack: newStack };
                    continue;

                /* Pops the top value off the stack and rotates the DP clockwise that many 
		       steps (anticlockwise if negative) */
                case 'pointer':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        continue;
                    }

                    if (val > 0) {
                        yield { stack: newStack, DP: (DP + val) % 4 };
                        continue;
                    }
                    // negative rotation (anticlockwise)
                    yield { stack: newStack, DP: (DP - val) % 4 };
                    continue;

                /* Pops the top value off the stack and prints it to STDOUT as a number */
                case 'out(num)':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        continue;
                    }
                    yield { stack: newStack, output: output + val };
                    continue;

                /* Pops the top value off the stack and discards it */
                case 'pop':
                    var newStack = stack.slice();
                    // ignore stack underflow
                    if (newStack.pop() == undefined) {
                        yield { stack: stack };
                        continue;
                    }
                    yield { stack: newStack };
                    continue;

                /* Replaces the top value of the stack with 0 if it is non-zero, and 1 if 
		       it is zero */
                case 'not':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        continue;
                    }
                    newStack.push(val == 0);

                    yield { stack: newStack };
                    continue;

                /* Pops the top value off the stack and toggles the CC that many times (the
		       absolute value of that many times if negative) */
                case 'switch':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        continue;
                    }

                    if (val > 0) {
                        yield { stack: newStack, CC: (CC + val) % 2 };
                        continue;
                    }
                    // negative toggle times
                    yield { stack: newStack, CC: (CC - val) % 2 };
                    continue;

                /* Reads a value from STDIN as a number and pushes it on to the stack. */
                // This reads a single character as a number - should parse more intelligently?
                case 'in(num)':
                    // If no input is waiting on STDIN, this is an error and the command is ignored.
                    //  If an integer read does not receive an integer value, this is an error and the command is ignored
                    var newNum = getInput();

                    var newStack = stack.slice();
                    newStack.push(parseInt(newNum));

                    yield { stack: newStack };
                    continue;

                    break;

                /* Pops the top value off the stack and prints it to STDOUT as a character */
                case 'out(char)':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                        continue;
                    }
                    yield { stack: newStack, output: output + String.fromCharCode(val) };
                    continue;
            }
        }
    }

    return; // terminate compiler
}

export { compile, run };
