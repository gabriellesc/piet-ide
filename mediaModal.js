import React from 'react';

class MediaModal extends React.Component {
    closeMediaStream() {
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    // when the component is mounted, add event listeners for modal show/hide events, to trigger
    // video stream opening/closing
    componentDidMount() {
        $('#media-modal').on('show.bs.modal', () =>
            this.props.renderCamera(this.video, this.canvas)
        );
        $('#media-modal').on('hidden.bs.modal', () => this.closeMediaStream());
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
                                id="photoChooser"
                                type="file"
                                accept="image/png, image/bmp, image/jpeg"
                                style={{ display: 'none' }}
                                onChange={event => {
                                    this.props.importPhotoFromFile(
                                        event.target.files[0],
                                        this.canvas
                                    );
                                    event.target.value = '';
                                }}
                            />
                            <video
                                id="hidden-video"
                                style={{ display: 'none' }}
                                ref={video => (this.video = video)}
                            />
                            <center>
                                <canvas
                                    id="photo-canvas"
                                    width="0"
                                    height="0"
                                    ref={canvas => (this.canvas = canvas)}
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
                                className="btn btn-info"
                                title="Select a new photo file and clear annotations"
                                onClick={() => document.getElementById('photoChooser').click()}>
                                Select photo from file
                            </button>
                            {this.props.photoMode == 'EDIT' && (
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    title="Return to the camera and clear annotations"
                                    onClick={() =>
                                        this.props.renderCamera(this.video, this.canvas)}>
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
