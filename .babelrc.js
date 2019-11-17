const env = process.env.NODE_ENV;

const config = {
    plugins: [
        'transform-runtime',
        'transform-class-properties',
        'transform-async-to-generator',
        'transform-es2015-modules-commonjs-simple',
        ['babel-plugin-transform-builtin-extend', {
            globals: ['Error', 'Array', 'Number']
        }],
        ['flow-react-proptypes', {
            deadCode: true,
            useESModules: true,
        }]
    ],
    presets: [
        'stage-0',
        'react',
        'flow',
        ['env', {
            targets: {
                browsers: ['last 5 versions', 'iOS 8.1', 'ie 8']
            },
        }]
    ],
};

if (env === 'commonjs') {
    config.comments = false;
    config.plugins.push('transform-object-rest-spread');
    config.plugins.push(['filter-imports', {
        imports: {
            './styles.scss': ['default'],
        },
    }]);
}

module.exports = config;
