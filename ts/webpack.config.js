const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        background: './windows/background/background.ts',
        mainWindow: './windows/mainWindow/mainWindow.ts'
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts']
    },
    output: {
      path: `${__dirname}/dist`,
      filename: '[name]/[name].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './windows/background/background.html',
            filename: `${__dirname}/dist/background/background.html`,
            chunks: ['background']
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/mainWindow.html',
            filename: `${__dirname}/dist/mainWindow/mainWindow.html`,
            chunks: ['mainWindow']
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/csTab.html',
            filename: `${__dirname}/dist/mainWindow/csTab.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/csTabRow.html',
            filename: `${__dirname}/dist/mainWindow/csTabRow.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/csTabRecommendationItem.html',
            filename: `${__dirname}/dist/mainWindow/csTabRecommendationItem.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/csTabHistoryItem.html',
            filename: `${__dirname}/dist/mainWindow/csTabHistoryItem.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/faqTab.html',
            filename: `${__dirname}/dist/mainWindow/faqTab.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/feedbackTab.html',
            filename: `${__dirname}/dist/mainWindow/feedbackTab.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/newsTab.html',
            filename: `${__dirname}/dist/mainWindow/newsTab.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/personalTab.html',
            filename: `${__dirname}/dist/mainWindow/personalTab.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/personalTabChampionItem.html',
            filename: `${__dirname}/dist/mainWindow/personalTabChampionItem.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/personalTabHistoryItem.html',
            filename: `${__dirname}/dist/mainWindow/personalTabHistoryItem.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/popup.html',
            filename: `${__dirname}/dist/mainWindow/popup.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/settingsTab.html',
            filename: `${__dirname}/dist/mainWindow/settingsTab.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/sideMenu.html',
            filename: `${__dirname}/dist/mainWindow/sideMenu.html`,
            chunks: []
        }),
        new HtmlWebpackPlugin({
            template: './windows/mainWindow/sideMenuOption.html',
            filename: `${__dirname}/dist/mainWindow/sideMenuOption.html`,
            chunks: []
        }),
        
    ]
}