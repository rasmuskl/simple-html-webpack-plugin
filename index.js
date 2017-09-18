var toposort = require('toposort');
var fs = require('fs');
var path = require("path");
var mkdirp = require('mkdirp');
var minify = require('html-minifier').minify;

function SimpleHtmlWebpackPlugin(options) {
    this.options = Object.assign({}, {
        alwaysWriteToDisk: false,
        filename: 'index.html'
    }, options);
    
    if (!options.template) {
        throw 'Missing required parameter: template (string)';
    }

    if (!options.chunks || !options.chunks.length) {
        throw 'Missing required non-empty parameter: chunks (string[])';
    }

    this.chunkVersions = {};
    this.lastTimestamp = new Date().getTime();
}

SimpleHtmlWebpackPlugin.prototype.apply = function(compiler) {
    let options = this.options;
    const relevantChunks = {};

    for (const chunkName of options.chunks) {
        relevantChunks[chunkName] = true;
    }

    compiler.plugin('emit', (compilation, callback) => {
        const templatePath = path.join(compiler.context, options.template);
        compilation.fileDependencies.push(templatePath);

        const changedChunks = compilation.chunks.filter(chunk => {
            var oldVersion = this.chunkVersions[chunk.name];
            this.chunkVersions[chunk.name] = chunk.hash;
            return chunk.hash !== oldVersion;
        });

        const templateTimestamp = compilation.fileTimestamps[templatePath];

        const relevantChunksChanged = changedChunks.some(c => relevantChunks[c.name] === true);
        const templateChanged = this.lastTimestamp !== templateTimestamp;
        this.lastTimestamp = templateTimestamp || this.lastTimestamp;

        // No change to relevant chunks or template, no need to build.
        if (!relevantChunksChanged && !templateChanged) {
            callback();
            return;
        }

        // If no hash and the template hasn't change, no need to build.
        if (!options.hash && !templateChanged) {
            callback();
            return;
        }

        let headTags = [];
        let bodyTags = [];

        let targetChunks = compilation.chunks.filter(c => relevantChunks[c.name] === true);
        let sortedChunks = sortChunks(targetChunks);

        var publicPath = compilation.options.output.publicPath || '';
        if (publicPath && publicPath.substr(-1) !== '/') {
            publicPath += '/';
        }

        for (const chunk of sortedChunks) {
            for (const file of chunk.files) {
                const path = publicPath + (options.hash ? appendHash(file, chunk.hash) : file);
                if (/\.js($|\?)/.test(file)) {
                    bodyTags.push(`<script type="text/javascript" src="${path}"></script>`);
                } else if (/\.css($|\?)/.test(file)) {
                    headTags.push(`<link href="${path}" rel="stylesheet" />`);
                }
            }
        }

        let rawHtml = fs.readFileSync(options.template, 'utf8');
        let output = rawHtml
            .replace(/(<\/head>)/i, match => headTags.join('') + match)
            .replace(/(<\/body>)/i, match => bodyTags.join('') + match);

        if (options.minify) {
            output = minify(output, options.minify);
        }

        compilation.assets[options.filename] = {
            source: () => output,
            size: () => output.length
        }

        if (options.alwaysWriteToDisk) {
            var fullPath = path.resolve(this.outputPath || compilation.compiler.outputPath, options.filename);
            var directory = path.dirname(fullPath);
            mkdirp.sync(directory);
            fs.writeFileSync(fullPath, compilation.assets[options.filename].source());
        }

        callback();
    });

    function appendHash(path, hash) {
        return `${path}${path.indexOf('?') === -1 ? '?' : '&'}${hash}`;
    }

    function sortChunks(chunks) {
        const nodeMap = {};
        const edges = [];

        for(const chunk of chunks) {
            nodeMap[chunk.id] = chunk;
        }
        for(const chunk of chunks) {
            if (!chunk.parents) {
                continue;
            }

            for(const parentId of chunk.parents) {
                const parentChunk = typeof parentId === 'object' ? parentId : nodeMap[parentId]
                if (parentChunk) {
                    edges.push([parentChunk, chunk])
                }
            }
        }

        return toposort.array(chunks, edges);
    }
};

module.exports = SimpleHtmlWebpackPlugin;