Demo example
```js
require('jsoneditor/dist/jsoneditor.css');
require('./styles.scss');
const JsonEditor = require('./JsonEditor.tsx').JsonEditor;
const TestCell = require('./TestCell.tsx').TestCell;

<Demo
    inputsCount={3}
    textAreasCount={2}
    input-0-value={10}
    input-0-descr="Test"
    textArea-0-value="Some text"
    textArea-0-descr="Textarea"
    textArea-0-height="50"
    textArea-1-width="900"
    textArea-1-height="20"
>{({ inputs, textAreas }) => {
    const value0 = inputs[0].value;
    const value1 = textAreas[0].value;

    const measure = (() => {});

    return (
        <div>
            <h3>Simple text</h3>
            <div>{value0} {value1}</div>
            <h3>JsonEditor example</h3>
            <div>
                <JsonEditor json="{a: 10}" />
            </div>
            <h3>TestCell example</h3>
            <div>
                <TestCell
                    measure={measure}
                    data="test data"
                    styleObj={{}}
                />
            </div>
        </div>
    );
}}</Demo>
```
