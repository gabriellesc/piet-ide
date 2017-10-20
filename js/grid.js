import React from 'react';

class Grid extends React.Component {
    render() {
        return (
            <div className="row">
                <div className="col-sm-12">
                    <table
                        style={{
                            tableLayout: 'fixed',
                            cursor:
                                this.props.colourMode == 0
                                    ? 'url(img/fi-pencil.png) 5 30,auto'
                                    : 'url(img/fi-paint-bucket.png) 25 25,auto',
                        }}>
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
                </div>
            </div>
        );
    }
}

export default Grid;
