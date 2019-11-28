Demo example
```js
import './styles.scss';
import { Demo } from '../Demo';
import { ShareDemo } from './ShareDemo.tsx';

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

    return (
        <ShareDemo />
    );
}}</Demo>
```
