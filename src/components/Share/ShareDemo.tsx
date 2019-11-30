import * as React from 'react';
import { Dialog, Button } from '@material-ui/core';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { Attachments } from './AttachmentForm';
import { JsonEditor } from '../Demo';
import { Share, ShareModel } from './Share';

type Props = {

};

type State = {
    isOpened: boolean,
    model: ShareModel,
};

export class Popup extends React.PureComponent<Props, State> {
    render() {
        return (<div>{this.props.children}</div>);
    }
}

const theme = createMuiTheme();

export class ShareDemo extends React.PureComponent<Props, State> {
    json: any = {};

    constructor(props: Props) {
        super(props);

        this.state = {
            isOpened: false,
            model: {
                attachments: {},
            },
        };
    }

    openPopup() {
        this.setState({ isOpened: true });
    }

    closePopup() {
        this.setState({ isOpened: false });
    }

    onPopupOpen = () => {
        this.openPopup();
    };

    onPopupSave = (model: ShareModel) => {
        this.setState({ model });
        this.closePopup();
    };

    onPopupClose = () => {
        this.closePopup();
    };

    render() {
        const { isOpened, model } = this.state;
        return (
            <ThemeProvider theme={theme}>
                <JsonEditor json={model} />

                <Share model={model} onClose={this.onPopupClose} onSave={this.onPopupSave} />

                <Button type="button" onClick={this.onPopupOpen}>Open</Button>
                <Dialog className="my-popup" open={isOpened}>
                    <Share model={model} onClose={this.onPopupClose} onSave={this.onPopupSave} />
                </Dialog>
            </ThemeProvider>
        );
    }
}
export default ShareDemo;
