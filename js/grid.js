import React from 'react';

import { colours } from './colours.js';

const Grid = props => (
    <table
        style={{
            margin: '1vh 0 0 0',
            tableLayout: 'fixed',
            gridColumn: 'grid / span ' + (props.debug.debugIsVisible ? '3' : '4'),
            alignSelf: 'start',
            justifySelf: 'start',
        }}
        onMouseOut={() => props.setCellInFocus(null)}>
        <tbody>
            {props.grid.map((row, i) => (
                <tr key={'row-' + i}>
                    {row.map((cell, j) => (
                        <td
                            key={'cell-' + i + '-' + j}
                            title={'(' + j + ',' + i + ')'}
                            style={{
                                maxHeight: '30px',
                                maxWidth: '30px',
                                height: props.cellDim + 'px',
                                width: props.cellDim + 'px',
                                border: '1px solid black',
                                background:
                                    props.blocks[i][j] == props.debug.block
                                        ? 'repeating-linear-gradient(45deg, ' +
                                          colours[cell] +
                                          ', ' +
                                          colours[cell] +
                                          ' 2px, black 2px, black 4px)'
                                        : colours[cell],
                                color: 'white',
                                fontSize: '11px',
                                textShadow: '1px 1px 1px black',
                                textAlign: 'center',
                                cursor: {
                                    BRUSH: 'url(img/pencil.png) 5 30,auto',
                                    BUCKET: 'url(img/paint-bucket.png) 28 28,auto',
                                    BP: 'url(img/bp.png) 16 32,auto',
                                }[props.paintMode],
                            }}
                            onMouseOver={() => props.setCellInFocus(i, j)}
                            onClick={() => props.handleCellClick(i, j)}>
                            {props.displayBS && props.blockSizes[i][j]}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

export default Grid;
