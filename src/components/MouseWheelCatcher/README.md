Default scroll
```js
const MouseWheelCatcher = require('./index').MouseWheelCatcher;
const example = require('../Demo/data.example.js');

<Demo
    inputsCount={0}
    input-0-value={100}
    input-0-descr="Rows"
>{
    ({ inputs }) => {
        const data = example.getText(50);
        const style = {
            display: 'inline-block',
            width: 450,
            height: 600,
            overflow: 'auto',
        };
        let leftDiv;
        let rightDiv;

        const leftDivRef = (ref) => {
            leftDiv = ref;
        }

        const rightDivRef = (ref) => {
            rightDiv = ref;
        }

        const handleScroll = (event, dir) => {
            event.preventDefault();

            if (rightDiv) {
                const { scrollTop } = rightDiv;
                const newScrollTop = scrollTop - (dir * 30);

                if (leftDiv) {
                    leftDiv.scrollTop = newScrollTop;
                }

                if (rightDiv) {
                    rightDiv.scrollTop = newScrollTop;
                }
            }
        };

        return (
            <MouseWheelCatcher onMouseScroll={handleScroll}>
                <div
                    ref={leftDivRef}
                    className="scroll-elem left"
                    style={style}
                >
                    {data}
                </div>
                <div
                    ref={rightDivRef}
                    className="scroll-elem right"
                    style={style}
                >
                    {data}
                </div>
            </MouseWheelCatcher>
        );
    }
}</Demo>
```
