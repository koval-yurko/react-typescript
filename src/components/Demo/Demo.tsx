import * as React from 'react';
import './styles.scss';

type InputDescr = {
    name: string,
    value: string,
    descr: string,
};

type TextAreaDescr = {
    name: string,
    value: string,
    descr: string,
    width: number,
    height: number,
};

type State = {
    inputs: { [key: string]: InputDescr },
    textAreas: { [key: string]: TextAreaDescr },
    child: React.ReactNode,
};

type Props = {
    [key: string]: any,
    className?: string,
    children: (state: State) => React.ReactNode | React.ReactNode,
    show: boolean,
    inputsCount: number,
    textAreasCount: number,
};

export class Demo extends React.PureComponent<Props, State> {
    inputStyle: Record<string, number>;

    textAreaStyle: { width: number, height: number };

    static defaultProps = {
        show: false,
        inputsCount: 0,
        textAreasCount: 0,
    };

    constructor(props: Props) {
        super(props);
        const {
            show,
            inputsCount,
            textAreasCount,
        } = props;

        this.state = {
            inputs: {},
            textAreas: {},
            child: show ? this.getChildren() : null,
        };

        this.inputStyle = {
            width: 100,
        };

        this.textAreaStyle = {
            width: 200,
            height: 100,
        };

        Array.from(Array(inputsCount)).forEach((n, index) => {
            const name = `input-${index}`;
            const propNameValue = `input-${index}-value`;
            const propNameDescr = `input-${index}-descr`;

            this.state.inputs[index] = {
                name,
                value: this.props[propNameValue] || '0',
                descr: this.props[propNameDescr] || `Input ${index}`,
            };
        });

        Array.from(Array(textAreasCount)).forEach((n, index) => {
            const name = `textArea-${index}`;
            const propNameValue = `textArea-${index}-value`;
            const propNameDescr = `textArea-${index}-descr`;
            const propNameWidth = `textArea-${index}-width`;
            const propNameHeight = `textArea-${index}-height`;

            this.state.textAreas[index] = {
                name,
                value: this.props[propNameValue] || '0',
                descr: this.props[propNameDescr] || `Textarea ${index}`,
                width: parseInt(this.props[propNameWidth], 10) || this.textAreaStyle.width,
                height: parseInt(this.props[propNameHeight], 10) || this.textAreaStyle.height,
            };
        });
    }

    getChildren() {
        const { children } = this.props;
        return (typeof children === 'function') ? children(this.state) : children;
    }

    /**
     * Set value for appropriate input
     *
     * @param {number} index - input index to update
     * @param {string} value - new value
     * @returns {void}
     * @private
     */
    updateInput(index: number, value: string) {
        const { inputs } = this.state;
        const propNameValue = `input-${index}-value`;
        let newValue = parseInt(value, 10);
        if (Number.isNaN(newValue)) {
            newValue = this.props[propNameValue];
        }

        const newInputObj = {
            ...inputs[index],
            value: newValue || 0,
        };

        this.setState({
            inputs: {
                ...inputs,
                [index]: newInputObj,
            },
        });
    }

    /**
     * Set value for appropriate textarea
     *
     * @param {number} index - textarea index to update
     * @param {string} value - new value
     * @returns {void}
     * @private
     */
    updateTextArea(index: number, value: string) {
        const { textAreas } = this.state;

        const newTextAreaObj = {
            ...textAreas[index],
            value,
        };

        this.setState({
            textAreas: {
                ...textAreas,
                [index]: newTextAreaObj,
            },
        });
    }

    onCreateClick = () => {
        const { children } = this.props;
        const { state } = this;
        this.setState({
            child: (typeof children === 'function') ? children(state) : children,
        });
    };

    onDestroyClick = () => {
        this.setState({
            child: null,
        });
    };

    onInputChange = (event: any) => {
        const { tabIndex, value } = event.target;
        this.updateInput(tabIndex, value);
    };

    onTextAreaChange = (event: any) => {
        const { tabIndex, value } = event.target;
        this.updateTextArea(tabIndex, value);
    };

    render() {
        const { className } = this.props;
        const {
            inputs,
            textAreas,
            child,
        } = this.state;

        return (
            <div className={className}>
                <div>
                    <button type="button" onClick={this.onCreateClick}>Apply</button>
                    <button type="button" onClick={this.onDestroyClick}>Destroy</button>
                </div>
                <div>
                    {Object.keys(inputs).map((el, index) => {
                        const inputObj = inputs[el];
                        return (
                            <div key={inputObj.name} className="demo-input">
                                <div>{inputObj.descr}</div>
                                <input
                                    tabIndex={index}
                                    name={inputObj.name}
                                    value={inputObj.value}
                                    onChange={this.onInputChange}
                                    style={this.inputStyle}
                                />
                            </div>
                        );
                    })}
                </div>
                <div>
                    {Object.keys(textAreas).map((el, index) => {
                        const textAreaObj = textAreas[el];
                        return (
                            <div key={textAreaObj.name} className="demo-textarea">
                                <div>{textAreaObj.descr}</div>
                                <textarea
                                    tabIndex={index}
                                    name={textAreaObj.name}
                                    value={textAreaObj.value}
                                    onChange={this.onTextAreaChange}
                                    style={{ width: textAreaObj.width, height: textAreaObj.height }}
                                />
                            </div>
                        );
                    })}
                </div>
                {child}
            </div>
        );
    }
}

export default Demo;

export function getText(count: number = 1) {
    const style = {
        width: 1300,
    };
    return (
        <div style={style}>
            {Array.from(Array(count)).map((o, index) => (
                <div key={`p-${index}`}>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit
                        esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
                        id est laborum.
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit
                        esse cillum dolore eu fugiat nulla pariatur.
                    </p>
                </div>
            ))}
        </div>
    );
}
