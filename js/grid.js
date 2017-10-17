import React from 'react';

class Grid extends React.Component {
    render() {
        let cellDim = Math.min(30, (window.innerWidth - 40) / this.props.width);

        return (
            <table style={{ tableLayout: 'fixed' }}>
                <tbody>
                    {this.props.grid.map((row, i) => (
                        <tr key={'row-' + i}>
                            {row.map((pix, j) => (
                                <td
                                    key={'cell-' + i + '-' + j}
                                    style={{
                                        height: cellDim + 'px',
                                        width: cellDim + 'px',
                                        border: '1px solid black',
                                        backgroundColor: this.props.colourMap[pix],
                                    }}
                                    onClick={() => this.props.colour(i, j)}
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
