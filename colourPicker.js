import React from 'react';
import { colours, WHITE, BLACK } from './colours.js';

const ColourPicker = props => (
    <table style={{ gridColumn: 'cpicker', gridRow: '1 / 4' }}>
        <tbody>
            {[
                colours.slice(0, 6),
                colours.slice(6, 12),
                colours.slice(12, 18),
            ].map((colourRow, i) => (
                <tr key={'colour-row-' + i}>
                    {colourRow.map((colour, j) => (
                        <ColourCell
                            key={'colour-cell-' + i + '-' + j}
                            cellColour={i * 6 + j}
                            {...props}
                        />
                    ))}
                </tr>
            ))}

            <tr>
                <ColourCell colSpan="3" cellColour={WHITE} {...props} />
                <ColourCell colSpan="3" cellColour={BLACK} {...props} />
            </tr>
        </tbody>
    </table>
);

const ColourCell = props => (
    <td
        colSpan={props.colSpan ? props.colSpan : '1'}
        style={{
            width: '32px',
            height: '32px',
            padding: '5px',
            backgroundColor: colours[props.cellColour],
            border:
                props.selectedColour == props.cellColour ? '4px double black' : '1px solid black',
            color: 'white',
            textShadow: '1px 1px 1px black',
            textAlign: 'center',
            cursor: 'pointer',
        }}
        onClick={() => props.selectColour(props.cellColour)}>
        {props.commands[props.cellColour]}
    </td>
);

export default ColourPicker;
