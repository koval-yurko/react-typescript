const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const WebpackNotifierPlugin = require('webpack-notifier');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const rootPath = __dirname;
const srcPath = path.resolve(rootPath, './src');
const destPath = path.resolve(rootPath, './dist');

const extractCSS = new MiniCssExtractPlugin({
    filename: './[name].css',
    ignoreOrder: true,
});

function getStylesLoaders(isScss, isTest) {
    const list = [];

    if (isTest) {
        list.push({
            loader: 'style-loader',
        });
    } else {
        list.push({
            loader: MiniCssExtractPlugin.loader
        })
    }

    const cssLoader = {
        loader: 'css-loader',
        options: {
            importLoaders: 0,
            sourceMap: true,
        },
    };

    list.push(cssLoader);

    if (isScss) {
        list.push({
            loader: 'postcss-loader',
            options: {
                sourceMap: true,
                plugins: () => [
                    autoprefixer({
                        browsers: ['last 5 versions', 'iOS 8.1'],
                        remove: false,
                    })
                ],
            },
        });
        list.push({
            loader: 'resolve-url-loader',
            options: {
                sourceMap: true,
            },
        });
        list.push({
            loader: 'sass-loader',
            options: {
                sourceMap: true,
            },
        });
        list[1].options.importLoaders = 3;
    }

    return list;
}

module.exports = (env, args) => {
    const isProd = (env && env.prod) || false;
    const isTest = (env && env.test) || false;
    const isWatch = (env && env.watch) || false;

    const addCoverage = (args && args.addCoverage) || false;
    const addSourceMap = (args && args.addSourceMap) || true;

    const config = {
        mode: isProd ? 'production' : 'development',
        devtool: 'source-map',
        context: rootPath,
        entry: {
            main: path.join(srcPath, './index.ts'),
        },
        output: {
            path: destPath,
            filename: '[name].js',
            jsonpFunction: 'sisenseWebpackJsonp',
            libraryTarget: 'umd',
            library: 'pivot2',
        },
        module: {
            rules: [
                {
                    test: /\.(png|jpg|jpeg|gif|svg)$/,
                    loader: 'file-loader',
                },
                {
                    test: /\.ts(x?)$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
                {
                    test: /\.css$/,
                    use: getStylesLoaders(false, isTest),
                },
                {
                    test: /\.scss$/,
                    use: getStylesLoaders(true, isTest),
                }
            ],
        },
        resolve: {
            extensions: ['.js', '.jsx', '.es6', '.ts', '.tsx'],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: (isProd ? '"production"' : '""'),
                },
            }),
            new WebpackNotifierPlugin({
                title: 'Build Finished',
                excludeWarnings: true,
                alwaysNotify: true,
            }),
            new webpack.NoEmitOnErrorsPlugin(),
            extractCSS
        ],
        externals: {
            react: {
                root: 'React',
                commonjs2: 'react',
                commonjs: 'react',
                amd: 'react',
            },
            'react-dom': {
                root: 'ReactDOM',
                commonjs2: 'react-dom',
                commonjs: 'react-dom',
                amd: 'react-dom',
            },
            'socket.io-client': {
                commonjs2: 'socket.io-client',
                commonjs: 'socket.io-client',
                amd: 'socket.io-client',
            },
        },
    };

    if (isTest) {
        config.externals = {};
        config.devtool = false;
        if (addSourceMap) {
            config.devtool = 'inline-source-map';
        }
        if (addCoverage) {
            config.module.rules.push({
                test: /\.jsx?$/,
                include: srcPath,
                exclude: /(Demo\.|\.example\.)/,
                enforce: 'post',
                use: {
                    loader: 'istanbul-instrumenter-loader',
                    query: {
                        esModules: true,
                    },
                },
            });
        }
    }

    if (isWatch) {
        config.watch = true;
    }

    if (isWatch || isTest) {
        config.plugins.push(new WebpackNotifierPlugin({
            title: 'Build Finished',
            excludeWarnings: true,
            alwaysNotify: true,
        }));
    }

    if (isProd) {
        config.plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            generateStatsFile: true,
            openAnalyzer: false,
        }));
    }

    return config;
};

