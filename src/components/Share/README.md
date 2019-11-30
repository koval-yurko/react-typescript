Demo example
```js
import './styles.scss';
import { Demo } from '../Demo';
import { ShareDemo } from './ShareDemo.tsx';

<Demo
    inputsCount={1}
    textAreasCount={1}
    input-0-value={10}
    input-0-descr="Test"
    textArea-0-value="Some text"
    textArea-0-descr="Textarea"
>{({ inputs, textAreas }) => {
    const value0 = inputs[0].value;
    const value1 = textAreas[0].value;

    return (
        <ShareDemo />
    );
}}</Demo>
```
