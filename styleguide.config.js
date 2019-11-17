const webpackConfigFn = require('./webpack.config.js');

module.exports = {
    webpackConfig: webpackConfigFn({ test: true }),
    sections: [
        {
            name: 'Components',
            components: [
                './src/components/Demo/Demo.tsx',
                './src/components/MouseWheelCatcher/MouseWheelCatcher.jsx'
            ],
        }
    ],
    styles: {
        StyleGuide: {
            hasSidebar: {
                '& $content': {
                    display: 'block',
                    maxWidth: 1000,
                    margin: '0 auto',
                    padding: '16px 32px',
                },
            },
            content: {
                display: 'block',
                maxWidth: 10000,
                margin: '0 auto',
                padding: '16px 32px',
            },
        },
    },
};
