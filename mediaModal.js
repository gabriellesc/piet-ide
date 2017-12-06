import React from 'react';

class MediaModal extends React.Component {
    // when the component is mounted, add event listeners for modal show/hide events
    componentDidMount() {
        $('#media-modal').on('show.bs.modal', () => this.props.renderCamera());
        $('#media-modal').on('hidden.bs.modal', () => this.props.resetPhoto());
    }

    render() {
        return (
            <div
                className="modal fade"
                id="media-modal"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="myModalLabel">
                <div className="modal-dialog" role="document" style={{ width: '730px' }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <button
                                type="button"
                                className="close"
                                data-dismiss="modal"
                                aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title">Import a program from a photo</h4>
                        </div>
                        <div className="modal-body">
                            <input
                                type="file"
                                accept="image/png, image/bmp, image/jpeg"
                                style={{ display: 'none' }}
                                ref={fileChooser => (this.fileChooser = fileChooser)}
                                onChange={event => {
                                    this.props.importPhotoFromFile(event.target.files[0]);
                                    event.target.value = '';
                                }}
                            />
                            <video
                                id="hidden-video"
                                style={{ display: 'none' }}
                                ref={video => (this.video = video)}
                            />

                            {this.props.photoMode.startsWith('ANNOTATE') && (
                                <div
                                    className="alert alert-info"
                                    role="alert"
                                    style={{ marginBottom: '5px' }}>
                                    <b>Step {this.props.photoMode.slice(-1)}.</b>&ensp;
                                    {
                                        {
                                            'ANNOTATE-1': 'Mark the four corners of the program',
                                            'ANNOTATE-2': 'Mark the four corners of a single codel',
                                            'ANNOTATE-3': 'Pick the correct colour of the codel',
                                        }[this.props.photoMode]
                                    }
                                </div>
                            )}

                            <center>
                                <canvas
                                    id="photo-canvas"
                                    width="0"
                                    height="0"
                                    ref={canvas => (this.canvas = canvas)}
                                    onMouseMove={e => this.props.showCursor(e.clientX, e.clientY)}
                                    onClick={e => this.props.markCorner(e.clientX, e.clientY)}
                                />
                                {this.props.photoMode == 'CAMERA' && (
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'red',
                                            borderRadius: '20px',
                                            border: '6px double white',
                                            marginBottom: '-35px',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => this.props.takePhoto()}
                                    />
                                )}
                            </center>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal">
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-default"
                                title="Select a new photo file and clear annotations"
                                onClick={() => this.fileChooser.click()}>
                                Select photo from file
                            </button>
                            {this.props.photoMode.startsWith('ANNOTATE') && (
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    title="Return to the camera and clear annotations"
                                    onClick={() => this.props.renderCamera()}>
                                    <i className="glyphicon glyphicon-camera" />
                                </button>
                            )}
                            {this.props.photoMode == 'READY' && (
                                <button type="button" className="btn btn-primary">
                                    Complete {'import'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MediaModal;
