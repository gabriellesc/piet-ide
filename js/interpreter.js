export function* step(commands, grid, blockSizes) {
    // start at top left cell
    let row = 0,
        col = 0,
        // number of consecutive times that the interpreter has tried to move off the current
        // block and hit an edge or black block
        bounceCount = 0,
        DP = 0, // index into [right, down, left, up], direction pointer initially points right
        CC = 0, // index into [left, right], codel chooser initially points left
        stack = [],
        output = '';

    // terminate interpreter when bounce count reaches 8
    while (bounceCount < 8) {
        let currColour = grid[row][col];

        // find edge of current colour block which is furthest in direction of DP
        let nextColour;

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
            }

            switch (inst) {
                /* Pushes a copy of the top value on the stack on to the stack */
                case 'dup':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                    }
                    newStack.push(val);
                    newStack.push(val);

                    yield { stack: newStack };

                /* Reads a value from STDIN as a character and pushes it on to the stack. */
                case 'in(char)':
                    // If no input is waiting on STDIN, this is an error and the command is ignored.
                    break;

                /* Pushes the value of the colour block just exited on to the stack */
                case 'push':
                    break;

                /* Pops the top value off the stack and rotates the DP clockwise that many 
		       steps (anticlockwise if negative) */
                case 'pointer':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                    }

                    if (val > 0) {
                        yield { stack: newStack, DP: (DP + val) % 4 };
                    }
                    // negative rotation (anticlockwise)
                    yield { stack: newStack, DP: (DP - val) % 4 };

                /* Pops the top value off the stack and prints it to STDOUT as a number */
                case 'out(num)':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                    }
                    yield { stack: newStack, output: output + val };

                /* Pops the top value off the stack and discards it */
                case 'pop':
                    var newStack = stack.slice();
                    // ignore stack underflow
                    if (newStack.pop() == undefined) {
                        yield { stack: stack };
                    }
                    yield { stack: newStack };

                /* Replaces the top value of the stack with 0 if it is non-zero, and 1 if 
		       it is zero */
                case 'not':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                    }
                    newStack.push(val == 0);

                    yield { stack: newStack };

                /* Pops the top value off the stack and toggles the CC that many times (the
		       absolute value of that many times if negative) */
                case 'switch':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                    }

                    if (val > 0) {
                        yield { stack: newStack, CC: (CC + val) % 2 };
                    }
                    // negative toggle times
                    yield { stack: newStack, CC: (CC - val) % 2 };

                /* Reads a value from STDIN as a number and pushes it on to the stack. */
                case 'in(num)':
                    // If no input is waiting on STDIN, this is an error and the command is ignored.
                    //  If an integer read does not receive an integer value, this is an error and the command is ignored

                    break;

                /* Pops the top value off the stack and prints it to STDOUT as a character */
                case 'out(char)':
                    var newStack = stack.slice();
                    var val = newStack.pop();

                    // ignore stack underflow
                    if (val == undefined) {
                        yield { stack: stack };
                    }
                    yield { stack: newStack, output: output + String.fromCharCode(val) };
            }
        }
    }

    return; // terminate interpreter
}
