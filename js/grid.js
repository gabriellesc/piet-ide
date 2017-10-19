import React from 'react';

class Grid extends React.Component {
    render() {
        return (
            <table style={{ tableLayout: 'fixed' }}>
                <tbody>
                    {this.props.grid.map((row, i) => (
                        <tr key={'row-' + i}>
                            {row.map((cell, j) => (
                                <td
                                    key={'cell-' + i + '-' + j}
                                    style={{
                                        height: this.props.cellDim + 'px',
                                        width: this.props.cellDim + 'px',
                                        border: '1px solid black',
                                        backgroundColor: this.props.colours[cell],
                                    }}
                                    onClick={() => this.props.colourCell(i, j)}
                                />
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

export default Grid;
