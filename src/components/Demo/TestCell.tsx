import * as React from 'react';

type Props = {
    measure: Function,
    styleObj: { width?: number, height?: number, },
    data: string,
    rowIndex: number,
    columnIndex: number,
};

type State = {
    w: string,
    h: number,
};

export class TestCell extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            w: 'test-',
            h: 1,
        };

        this.onPlusW = this.onPlusW.bind(this);
        this.onMinusW = this.onMinusW.bind(this);
        this.onPlusH = this.onPlusH.bind(this);
        this.onMinusH = this.onMinusH.bind(this);
        this.notifyUpdate = this.notifyUpdate.bind(this);
    }

    /**
     * Notify cell size changes
     *
     * @returns {void}
     * @private
     */
    notifyUpdate = () => {
        this.props.measure();
    };

    onPlusW = () => {
        const newW = `${this.state.w}a`;
        this.setState({
            w: newW,
        }, this.notifyUpdate);
    };

    onMinusW = () => {
        const newW = this.state.w.slice(0, -1);
        this.setState({
            w: newW,
        }, this.notifyUpdate);
    };

    onPlusH = () => {
        const newH = this.state.h + 1;
        this.setState({
            h: newH,
        }, this.notifyUpdate);
    };

    onMinusH = () => {
        const newH = Math.max(0, this.state.h - 1);
        this.setState({
            h: newH,
        }, this.notifyUpdate);
    };

    render() {
        const {
            data,
            rowIndex,
            columnIndex,
            styleObj,
            measure, // eslint-disable-line no-unused-vars
            ...props
        } = this.props;
        const { w, h } = this.state;

        let buttons = null;
        if (rowIndex === columnIndex) {
            buttons = (
                <div>
                    <button onClick={this.onPlusW}>W +</button>
                    <button onClick={this.onMinusW}>W -</button>
                    <button onClick={this.onPlusH}>H +</button>
                    <button onClick={this.onMinusH}>H -</button>
                </div>
            );
        }

        return (
            <div className="test-cell" {...props}>
                {w}{'-'}{data}
                {(Array.from(Array(h)).map((o, i) => (<br key={`br-${i}`} />)))}
                {buttons}
                <span className="test-cell-width">
                    {styleObj.width}
                </span>
                <span className="test-cell-height">
                    {styleObj.height}
                </span>
            </div>
        );
    }
}

export default TestCell;
