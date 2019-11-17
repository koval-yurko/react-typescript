import * as React from 'react';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';

type Props = {
    json: Object,
    onChange: Function,
};

export class JsonEditor extends React.PureComponent<Props> {
    jsoneditor: JSONEditor | undefined;
    container: HTMLElement | undefined;

    static defaultProps = {
        dataId: 0,
        onChange: (() => {}),
    };

    componentDidMount() {
        const options: JSONEditorOptions = {
            mode: 'code',
            onChange: this.onChange,
        };

        if (this.container) {
            this.jsoneditor = new JSONEditor(this.container, options);
            this.jsoneditor.set(this.props.json);
        }
    }

    componentWillUpdate(nextProps: Props) {
        if (this.jsoneditor) {
            this.jsoneditor.update(nextProps.json);
        }
    }

    componentWillUnmount() {
        if (this.jsoneditor) {
            this.jsoneditor.destroy();
        }
    }

    onChange = () => {
        let data = null;

        try {
            data = this.jsoneditor ? this.jsoneditor.get() : null;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('JsonEditor wrong JSON string');
        }

        if (data) {
            this.props.onChange(data);
        }
    };

    containerRef = (ref: HTMLInputElement) => {
        this.container = ref;
    };

    render() {
        return (
            <div className="pivot-json-editor" ref={this.containerRef} />
        );
    }
}

export default JsonEditor;
