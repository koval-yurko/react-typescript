import * as React from 'react';
import {
    FormControl,
    FormControlLabel,
    FormLabel,
    FormGroup,
    Checkbox,
} from '@material-ui/core';

export interface Attachments {
    [key: string]: Attachment
}

export interface Attachment {
    enabled: boolean,
}

type Props = {
    attachments: Attachments,
    onUpdate?: (attachments: Attachments) => void
};

type State = {

};

export class AttachmentForm extends React.PureComponent<Props, State> {
    handleChange = (event: React.ChangeEvent<HTMLInputElement>, enabled: boolean) => {
        const { attachments } = this.props;
        const { name } = event.target;

        const newAttach = {
            ...attachments,
            [name]: {
                ...attachments[name],
                enabled,
            }
        };

        if (this.props.onUpdate) {
            this.props.onUpdate(newAttach);
        }
    };

    render() {
        const { attachments } = this.props;
        const { email, pdf } = attachments;
        const emailEnabled = email ? email.enabled : false;
        const pdfEnabled = pdf ? pdf.enabled : false;

        return (
            <FormControl component="fieldset">
                <FormLabel component="legend">Attachment</FormLabel>
                <FormGroup>
                    <FormControlLabel
                        label="Email"
                        control={
                            <Checkbox
                                name="email"
                                checked={emailEnabled}
                                onChange={this.handleChange}
                            />
                        }
                    />
                    <FormControlLabel
                        label="PDF"
                        control={
                            <Checkbox
                                name="pdf"
                                checked={pdfEnabled}
                                onChange={this.handleChange}
                            />
                        }
                    />
                </FormGroup>
            </FormControl>
        );
    }
}
export default AttachmentForm;
