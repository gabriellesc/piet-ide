import React from 'react';

class Controls extends React.Component {
    render() {
        return (
            <div className="row">
                <form className="form-inline col-md-12">
                    <div className="form-group">
                        <label className="control-label" htmlFor="grid-height">
                            Height
                        </label>
                        <input
                            ref={input => (this.height = input)}
                            type="number"
                            name="height"
                            className="form-control"
                            style={{ width: '5em', marginLeft: '4px' }}
                            required
                            defaultValue={this.props.height}
                        />
                    </div>
                    <div className="form-group" style={{ marginLeft: '1vw' }}>
                        <label className="control-label" htmlFor="grid-width">
                            Width
                        </label>
                        <input
                            ref={input => (this.width = input)}
                            type="number"
                            name="width"
                            className="form-control"
                            style={{ width: '5em', marginLeft: '4px' }}
                            defaultValue={this.props.width}
                            required
                        />
                    </div>
                    <input
                        type="button"
                        className="btn btn-default"
                        value="Resize / Clear"
                        style={{ marginLeft: '1vw' }}
                        onClick={() =>
                            this.props.resize({
                                height: parseInt(this.height.value),
                                width: parseInt(this.width.value),
                            })}
                    />

                    <div className="form-group" style={{ marginLeft: '3vw' }}>
                        <ColourPicker {...this.props} />
                    </div>
                </form>
            </div>
        );
    }
}

const ColourPicker = props => (
    /*    pushpop
    1 Stepaddsubtractmultiply
    2 Stepsdividemodnot
    3 Stepsgreaterpointerswitch
    4 Stepsduplicaterollin(number)
    5 Stepsin(char)out(number)out(char)*/

    <table>
        <tbody>
            {[1, 10, 100].map(i => (
                <tr key={'colour-row-' + i}>
                    {Array(6)
                        .fill(0)
                        .map((_, j) => {
                            var colour = (j + 1) * i;

                            return (
                                <td
                                    key={'colour-col-' + j}
                                    style={{
                                        width: '25px',
                                        height: '25px',
                                        padding: '5px',
                                        backgroundColor: props.colourMap[colour],
                                        border: '1px solid white',
                                        boxShadow:
                                            props.selectedColour == colour
                                                ? 'inset 0 0 1ex black'
                                                : 'none',
                                        color: 'white',
                                        textShadow: '1px 1px 1px black',
                                        textAlign: 'center',
                                    }}
                                    onClick={() => props.selectColour(colour)}>
                                    {props.mapColourToCommand(props.selectedColour, colour)}
                                </td>
                            );
                        })}
                </tr>
            ))}
        </tbody>
    </table>
);

export default Controls;
