import * as React from 'react';
import {
    Paper,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Button,
} from '@material-ui/core';
import { AttachmentForm, Attachments } from './AttachmentForm';

type Props = {
    onClose?: Function,
    onSave?: (model: ShareModel) => void,
    model: ShareModel,
};

type State = {
    attachments: Attachments,
};

export interface ShareModel {
    attachments: Attachments,
}

export class Share extends React.PureComponent<Props, State> {
    static defaultProps = {
        model: {
            attachments: {},
        },
    };

    constructor(props: Props) {
        super(props);
        const { model } = props;

        this.state = {
            attachments: model.attachments || {},
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>): void {
        if (nextProps.model !== this.props.model) {
            const { model } = nextProps;
            this.setState({ attachments: model.attachments });
        }
    }

    handleClose = () => {
        if (this.props.onClose) {
            this.props.onClose();
        }
    };

    handleSave = () => {
        if (this.props.onSave) {
            this.props.onSave({
                attachments: this.state.attachments,
            });
        }
    };

    onAttachmentsUpdate = (attachments: Attachments) => {
        this.setState({
            attachments,
        });
    };

    render() {
        const { attachments } = this.state;
        return (
            <Paper>
                <DialogTitle id="form-dialog-title">Sharing</DialogTitle>
                <DialogContent>
                    <AttachmentForm attachments={attachments} onUpdate={this.onAttachmentsUpdate} />
                    <DialogContentText>
                        To subscribe to this website, please enter your email address here.
                        We will send updates occasionally.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Email Address"
                        type="email"
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleSave} color="primary">
                        Save
                    </Button>
                    <Button onClick={this.handleClose} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Paper>
        );
    }
}
export default Share;
