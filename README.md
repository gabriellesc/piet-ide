# Piet IDE
An in-browser platform for developing in the esoteric programming language [Piet](http://www.dangermouse.net/esoteric/piet.html).

## Features
#### Import / export
- Import a PNG, JPG, or BMP file containing a Piet program
- Import a Piet program from a photo of a physical representation of the program (eg. a painting or print-out)
- Export a Piet program from the IDE to a PNG file
  - Export a Piet program at a larger scale so that the details are easily visible
  
#### Edit
- Change the colour of a single pixel or fill a block of pixels with a colour
- See the number of pixels in a single block by hovering over it
- Display the number of pixels in every block simultaneously
- Select a colour to display the command represented by a transition to any other colour

#### Debug
- Run the program, with controls to: 
  - run from the beginning
  - pause
  - step
  - continue
  - stop
- Visualize the current state of the stack, Direction Pointer, Codel Chooser, and output, as the program is running
- Set breakpoints on colour blocks
- Vary the speed at which the program runs
- Visualize the command history as the program is running and after it has finished
  - After the program has finished running, identify the block corresponding to each command in the command history by hovering over it

## How it works
The IDE is built entirely using JavaScript and React.js, including the Piet interpreter.

Image file import/export and processing is done using [Jimp](https://github.com/oliver-moran/jimp) in the browser.
