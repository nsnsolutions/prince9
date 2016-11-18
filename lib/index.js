'use strict';

const childProcess = require('child_process');

module.exports = function Constructor(opts) {
    var self = prince,
        binPath = opts.path || opts,
        workingDir = opts.workingDir || '.';

    if(!binPath)
        throw { name: "Error", message: "Missing required parameter 'path'" };

    Object.defineProperty(self, 'workingDir', {
        get: function( ) { return workingDir; },
        set: function(v) { return workingDir = v; }
    });

    return self;

    // ------------------------------------------------------------------------

    function prince(opts, cb) {

        var input = opts.input,
            format = opts.format && opts.format.toLowerCase() || 'pdf',
            output = opts.outputPrefix || 'output',
            dpi = opts.raster && opts.raster.dpi || 300,
            pages = opts.raster && opts.raster.pages || "all",
            mimeType, err = [], cp;

        if(!input) {
            cb({ name: "Error", message: "No input file to render." });
            return;
        } else if(['jpeg', 'png', 'pdf'].indexOf(format) < 0) {
            cb({ name: "Error", message: "Invalid value for option 'format'." });
            return;
        } else if(['first', 'all'].indexOf(pages) < 0 && typeof pages !== 'number') {
            cb({ name: "Error", message: "Invalid value for option 'pages'." });
            return;
        } else if(typeof dpi !== 'number' || dpi > 1000 || dpi < 10) {
            cb({ name: "Error", message: "Invalid value for option 'dpi'." });
            return;
        }

        var args = [ ];

        if(format === 'pdf') {
            args.push(`--output=${output}.pdf`);
            mimeType = "application/pdf";
        } else {
            args.push(`--raster-output=${output}-%d.${format}`);
            args.push(`--raster-format=${format}`);
            args.push(`--raster-dpi=${dpi}`);
            args.push(`--raster-pages=${pages}`);
            if(format === "png")
                mimeType = "image/png";
            else
                mimeType = "image/jpeg";
        }

        args.push(input);

        cp = childProcess.spawn(binPath, args, { cwd: workingDir });
        cp.stderr.on('data', (data) => {
            var _e = data.toString('utf8');
            process.stderr.write(_e);
            err.push(_e);
        });

        cp.on('exit', (code) => {
            if(code === 0)
                cb(null, {
                    path: binPath,
                    workingDir: workingDir,
                    outputPrefix: output,
                    dpi: dpi,
                    format: format,
                    mimeType: mimeType
                });

            else
                cb({ name: "Error", message: err.join() });
        });
    };
};
