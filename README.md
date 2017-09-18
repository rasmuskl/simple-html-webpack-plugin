# Simple HTML Webpack Plugin

This is a lightweight fork / adaptation of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin/). If you just randomly found this package / repository, you probably want to use html-webpack-plugin instead.

Basically the 2.x branch of html-webpack-plugin has some performance problems, particularly obvious in incremental builds, so I decided to make a bare bones version that only has what I need. It does however look like some of this will be fixed in 3.x, so hopefully this will be obsolete soon.

This plugin:

* Loads a raw HTML file from disk
* Inserts the configured chunks topologically sorted in the HTML. CSS in head, JS in body
* Optionally minifies the HTML
* Optionally appends a hash to the query string of the resource
* Optionally always writes the resulting HTML to disk for use with webpack-dev-server (basically [html-webpack-harddisk-plugin](https://github.com/jantimon/html-webpack-harddisk-plugin))

It does **not**:

* Have support for plugins
* Have support for templates
* Generate HTML, it always uses a raw HTML file as template
* Have all the nice extra options that html-webpack-plugin has

## Installation

```
npm install simple-html-webpack-plugin --save-dev
```

## Configuration

You can pass a hash of configuration options to `SimpleHtmlWebpackPlugin`.
Allowed values are as follows:

- `template`: [required] Path to the raw HTML template file.
- `chunks`: `string[]` [required] Allows you to add only some chunks (e.g. only the unit-test chunk)
- `filename`: The file to write the HTML to. Defaults to `index.html`.
- `minify`: `{...} | false` Pass [html-minifier](https://github.com/kangax/html-minifier#options-quick-reference)'s options as object to minify the output. Defaults to `false`.
- `hash`: `true | false` if `true` then append a unique webpack compilation hash to all included scripts and CSS files. This is useful for cache busting. Defaults to `false`.
- `alwaysWriteToDisk`: `true | false` if `true` saves the file on each emit. Useful when using webpack-dev-server. Default is `false`

Here is an example webpack config illustrating how to use these options:

```javascript
var SimpleHtmlWebpackPlugin = require('simple-html-webpack-plugin');

var webpackConfig = {
  entry: {
    app: [ "index.js" ]
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js'
  },
  plugins: [
    new SimpleHtmlWebpackPlugin({
      template: 'index.html',
      chunks: ['app'],
      alwaysWriteToDisk: true,
    })
  ]
}
```

# License

This project is licensed under [MIT](https://github.com/rasmuskl/simple-html-webpack-plugin/blob/master/LICENSE).