import React from 'react';

import { colours } from './colours.js';

class Grid extends React.Component {
    render() {
        return (
            <table
                style={{
                    margin: '1vh 0 0 0',
                    tableLayout: 'fixed',
                    gridColumn: 'grid / span ' + (this.props.debug.debugIsVisible ? '3' : '4'),
                    alignSelf: 'start',
                    justifySelf: 'start',
                    pointerEvents: this.props.isRunning ? 'none' : 'auto',
                }}
                onMouseOut={() => this.props.setCellInFocus(null)}>
                <tbody>
                    {this.props.grid.map((row, i) => (
                        <tr key={'row-' + i}>
                            {row.map((cell, j) => (
                                <td
                                    key={'cell-' + i + '-' + j}
                                    title={'(' + j + ',' + i + ')'}
                                    style={{
                                        maxHeight: '30px',
                                        maxWidth: '30px',
                                        height: this.props.cellDim + 'px',
                                        width: this.props.cellDim + 'px',
                                        border: '1px solid black',
                                        background:
                                            this.props.blocks[i][j] == this.props.debug.currBlock
                                                ? 'repeating-linear-gradient(45deg, ' +
                                                  colours[cell] +
                                                  ', ' +
                                                  colours[cell] +
                                                  ' 2px, white 2px, white 4px)'
                                                : colours[cell],
                                        color: 'white',
                                        fontSize: '11px',
                                        textShadow: '1px 1px 1px black',
                                        textAlign: 'center',
                                        cursor:
                                            this.props.paintMode == 0
                                                ? 'url(img/pencil.png) 5 30,auto'
                                                : 'url(img/paint-bucket.png) 28 28,auto',
                                    }}
                                    onMouseOver={() => this.props.setCellInFocus(i, j)}
                                    onClick={() => this.props.paint(i, j)}>
                                    {this.props.displayBS && this.props.blockSizes[i][j]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

export default Grid;
