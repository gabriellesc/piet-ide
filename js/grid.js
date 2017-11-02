import React from 'react';

class Grid extends React.Component {
    render() {
        return (
            <table
                style={{
                    tableLayout: 'fixed',
                    pointerEvents: this.props.debug.inDebugMode ? 'none' : 'auto',
                }}
                onMouseOut={() => this.props.setCellInFocus(null)}>
                <tbody>
                    {this.props.grid.map((row, i) => (
                        <tr key={'row-' + i}>
                            {row.map((cell, j) => (
                                <td
                                    key={'cell-' + i + '-' + j}
                                    title={'(' + i + ',' + j + ')'}
                                    style={{
                                        maxHeight: '30px',
                                        maxWidth: '30px',
                                        height: this.props.cellDim + 'px',
                                        width: this.props.cellDim + 'px',
                                        border: '1px solid black',
                                        backgroundColor: this.props.colours[cell],
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
