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
// (offset: starting index into commandList, used for recursive calls)
function compile(grid, blocks, blockSizes, row = 0, col = 0, DP = 0, CC = 0, offset = 0) {
    let height = grid.length,
        width = grid[0].length,
        commandList = [],
        bounceCount = 0,
        loopCounter = 0;

    function addCommand(command, val) {
        commandList.push({ block: blocks[row][col], inst: command.toUpperCase(), val, DP, CC });
    }

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
        // check if the first half of an array is identical to the second half
        function arrayIsDoubled(array) {
            let len = array.length;
            let first = array.slice(0, len / 2),
                second = array.slice(len / 2);

            return len % 2 == 0 && first.every((elem, i) => elem == second[i]);
        }

        let [nextRow, nextCol] = slide(row, col);

        let whiteRoute = [];
        // check if we have retraced our route
        while (!arrayIsDoubled(whiteRoute)) {
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
                        nextRow;
                        break;
                }

                // keep track of current position
                whiteRoute.push([nextRow, nextCol]);

                // bounce twice (toggle CC and DP)
                bounce();
                bounce();

                // try sliding again
                [nextRow, nextCol] = slide(nextRow, nextCol);
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
            addCommand('CC');
        } else {
            // move DP clockwise 1 step
            DP = (DP + 1) % 4;
            addCommand('DP');
        }
    }

    // detect a loop by searching backwards in the command list for a command corresponding
    // to this block and the current DP + CC
    function detectLoop(row, col) {
        var block = blocks[row][col];

        for (var i = commandList.length - 2; commandList[i]; i--) {
            var command = commandList[i];

            // loop detected
            if (command.block == block && command.DP == DP && command.CC == CC) {
                return i;
            }
        }

        return null;
    }

    // terminate compiler when bounce count reaches 8
    while (bounceCount < 8) {
        // if we have looped more than 500 times, this might be an infinite loop
        if (loopCounter++ > 500) {
            addCommand('TIMEOUT');
            return commandList;
        }

        // save the current colour to use for indexing into the command list
        let colour = grid[row][col]; // WE ARE SAVING BLACK HERE FOR SOME REASON
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
            // we hit a white block, so slide across it
            let out = slide(nextRow, nextCol);

            // we are trapped in a white block
            if (out == null) {
                return commandList;
            }
            [row, col] = out;
        } else {
            // we found the next block, so update the row/col
            [row, col] = [nextRow, nextCol];

            // check if we are looping
            let loop = detectLoop(row, col);
            if (loop != null) {
                console.log(commandList, loop, offset);
                addCommand('LOOP', loop + offset);
                return commandList;
            }

            let nextColour = grid[row][col];

            bounceCount = 0; // we can move, so reset the bounce count

            let command = commands[colour][nextColour]; // match colour transition to command
            if (command == 'push') {
                addCommand(command, pushVal);
            } else {
                addCommand(command);

                if (command == 'pointer') {
                    // if the next command is POINTER, we should examine all possible DP values

                    // add placeholder branch command and save current instruction
                    let currCommand = commandList.length + offset;
                    addCommand('BRANCH-DP');

                    let branch0 = commandList.length + offset;
                    commandList = commandList.concat(
                        compile(grid, blocks, blockSizes, row, col, 0, CC, branch0)
                    );
                    addCommand('BRANCH-END');

                    let branch1 = commandList.length + offset;
                    commandList = commandList.concat(
                        compile(grid, blocks, blockSizes, row, col, 1, CC, branch1)
                    );
                    addCommand('BRANCH-END');

                    let branch2 = commandList.length + offset;
                    commandList = commandList.concat(
                        compile(grid, blocks, blockSizes, row, col, 2, CC, branch2)
                    );
                    addCommand('BRANCH-END');

                    let branch3 = commandList.length + offset;
                    commandList = commandList.concat(
                        compile(grid, blocks, blockSizes, row, col, 3, CC, branch3)
                    );
                    addCommand('BRANCH-END');

                    // update placeholder branch command with 4 branches
                    commandList[currCommand].val = [branch0, branch1, branch2, branch3];

                    // update placeholder branch end commands
                    let branchEnd = commandList.length + offset;
                    commandList[branch1 - 1].val = branchEnd;
                    commandList[branch2 - 1].val = branchEnd;
                    commandList[branch3 - 1].val = branchEnd;
                    commandList[branchEnd - 1].val = branchEnd;

                    return commandList;
                } else if (command == 'switch') {
                    // if the next command is SWITCH, we should examine all possible CC values

                    // add placeholder branch command and save current instruction
                    let currCommand = commandList.length + offset;
                    addCommand('BRANCH-CC');

                    let branch0 = commandList.length + offset;
                    commandList = commandList.concat(
                        compile(grid, blocks, blockSizes, row, col, DP, 0, branch0)
                    );
                    addCommand('BRANCH-END');

                    let branch1 = commandList.length + offset;
                    commandList = commandList.concat(
                        compile(grid, blocks, blockSizes, row, col, DP, 1, branch1)
                    );
                    addCommand('BRANCH-END');

                    // update placeholder branch command with 4 branches
                    commandList[currCommand].val = [branch0, branch1];

                    // update placeholder branch end commands
                    let branchEnd = commandList.length + offset;
                    commandList[branch1 - 1].val = branchEnd;
                    commandList[branchEnd - 1].val = branchEnd;

                    return commandList;
                }
            }
        }
    }

    return commandList;
}

function* run(commandList, getInputNum, getInputChar) {
    let DP = 0, // index into [right, down, left, up], direction pointer initially points right
        CC = 0, // index into [left, right], codel chooser initially points left
        stack = [],
        output = '',
        currCommand = 0;

    // iterate over commands
    while (commandList[currCommand]) {
        var { block, inst, val } = commandList[currCommand];

        switch (inst) {
            /* internal command: toggle CC */
            case 'CC':
                CC = (CC + 1) % 2;
                yield { currCommand, CC };
                break;

            /* internal command: move DP clockwise 1 step */
            case 'DP':
                DP = (DP + 1) % 4;
                yield { currCommand, DP };
                break;

            /* internal command: branch after pointer instruction */
            case 'BRANCH-DP':
                currCommand = val[DP];
                continue;

            /* internal command: branch after switch instruction */
            case 'BRANCH-CC':
                currCommand = val[CC];
                continue;

            /* internal command: end of a branch */
            case 'BRANCH-END':
                currCommand = val;
                continue;

            /* internal command: loop (effectively a go-to) */
            case 'LOOP':
                currCommand = val;
                continue;

            /* Pushes the value of the colour block just exited on to the stack */
            case 'PUSH':
                stack.push(val);
                yield { block, currCommand, stack };
                break;

            /* Pops the top value off the stack and discards it */
            case 'POP':
                // ignore stack underflow
                stack.pop();
                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack, adds them, and pushes the 
	       result back on the stack */
            case '+':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else {
                    stack.push(op1 + op2);
                }

                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack, calculates the second top value
	       minus the top value, and pushes the result back on the stack */
            case '-':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else {
                    stack.push(op2 - op1);
                }

                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack, multiplies them, and pushes 
	       the result back on the stack */
            case '*':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else {
                    stack.push(op1 * op2);
                }

                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack, calculates the integer 
	       division of the second top value by the top value, and pushes the 
	       result back on the stack */
            case '/':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else if (op1 == 0) {
                    // ignore divide by zero instruction
                    stack.push(op2);
                    stack.push(op1);
                } else {
                    stack.push(Math.floor(op2 / op1));
                }

                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack, calculates the second top value
	       modulo the top value, and pushes the result back on the stack. The 
	       result has the same sign as the divisor (the top value). */
            case 'MOD':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else if (op1 == 0) {
                    // divide by 0 error; instruction is ignored
                    stack.push(op2);
                    stack.push(op1);
                    yield { block, currCommand, error: 'Divide by zero', stack };
                } else {
                    stack.push(op2 - op1 * Math.floor(op2 / op1));
                }

                yield { block, currCommand, stack };
                break;

            /* Replaces the top value of the stack with 0 if it is non-zero, and 1 if 
	       it is zero */
            case 'NOT':
                var op = stack.pop();

                // ignore stack underflow
                if (op != undefined) {
                    stack.push(op == 0 ? 1 : 0);
                }
                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack, and pushes 1 on to the stack 
	       if the second top value is greater than the top value, and pushes 0 
	       if it is not greater */
            case '>':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else {
                    stack.push(op2 > op1 ? 1 : 0);
                }

                yield { block, currCommand, stack };
                break;

            /* Pops the top value off the stack and rotates the DP clockwise that many 
	       steps (anticlockwise if negative) */
            case 'POINTER':
                var op = stack.pop();

                // ignore stack underflow
                if (op == undefined) {
                    yield { block, currCommand, stack };
                    break;
                }

                // positive rotation (clockwise)
                if (op > 0) {
                    DP = (DP + op) % 4;
                    yield { block, currCommand, stack, DP };
                    break;
                }
                // negative rotation (anticlockwise)
                DP = (DP - op) % 4;
                yield { block, currCommand, stack, DP };
                break;

            /* Pops the top value off the stack and toggles the CC that many times (the
	       absolute value of that many times if negative) */
            case 'SWITCH':
                var op = stack.pop();

                // ignore stack underflow
                if (op == undefined) {
                    yield { block, currCommand, stack };
                    break;
                }

                if (op > 0) {
                    CC = (CC + op) % 2;
                    yield { block, currCommand, stack, CC };
                    break;
                }
                // negative toggle times
                CC = (CC + op) % 2;
                yield { block, currCommand, stack, CC };
                break;

            /* Pushes a copy of the top value on the stack on to the stack */
            case 'DUP':
                var op = stack.pop();

                // ignore stack underflow
                if (op != undefined) {
                    stack.push(op);
                    stack.push(op);
                }
                yield { block, currCommand, stack };
                break;

            /* Pops the top two values off the stack and "rolls" the remaining stack
	       entries to a depth equal to the second value popped, by a number of 
	       rolls equal to the first value popped. 
	       A single roll to depth n is defined as burying the top value on the 
	       stack n deep and bringing all values above it up by 1 place. 
	       A negative number of rolls rolls in the opposite direction. */
            case 'ROLL':
                var op1 = stack.pop(),
                    op2 = stack.pop();

                // ignore stack underflow
                if (op1 == undefined) {
                } else if (op2 == undefined) {
                    stack.push(op1);
                } else if (op2 < 0) {
                    // negative depth error; instruction is ignored
                    stack.push(op2);
                    stack.push(op1);
                    yield { block, currCommand, error: 'Negative depth', stack };
                    break;
                } else {
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
                }

                yield { block, currCommand, stack };
                break;

            /* Reads a value from STDIN as a number and pushes it on to the stack */
            case 'IN(NUM)':
                var newNum = getInputNum();

                // If no input is waiting on STDIN, or if an integer value is not received, this
                // is an error and the command is ignored
                if (newNum == null) {
                    yield { block, currCommand, error: 'Insufficient or invalid numerical input' };
                    break;
                }
                stack.push(newNum);

                yield { block, currCommand, stack };
                break;

            /* Reads a value from STDIN as a character and pushes it on to the stack */
            case 'IN(CHAR)':
                var newChar = getInputChar();

                // If no input is waiting on STDIN, this is an error and the command is ignored
                if (newChar == null) {
                    yield { block, currCommand, error: 'Insufficient input' };
                    break;
                }
                stack.push(newChar.charCodeAt());

                yield { block, currCommand, stack };
                break;

            /* Pops the top value off the stack and prints it to STDOUT as a number */
            case 'OUT(NUM)':
                var op = stack.pop();

                // ignore stack underflow
                if (op == undefined) {
                    yield { block, currCommand, stack };
                    break;
                }

                output += op;
                yield { block, currCommand, stack, output };
                break;

            /* Pops the top value off the stack and prints it to STDOUT as a character */
            case 'OUT(CHAR)':
                var op = stack.pop();

                // ignore stack underflow
                if (op == undefined) {
                    yield { block, currCommand, stack: stack };
                    break;
                }
                output += String.fromCharCode(op);
                yield { block, currCommand, stack, output };
                break;
        }

        currCommand++; // advance to next command
    }
}

export { compile, run };
