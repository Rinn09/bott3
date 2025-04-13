const prism = require('prism-media');
const { Readable } = require('stream');

function convertToOpusStream(inputStream) {
    const ffmpeg = new prism.FFmpeg({
        args: [
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-i', 'pipe:0',
            '-f', 'opus',
            '-ar', '48000',
            '-ac', '2',
            '-acodec', 'libopus',
            'pipe:1'
        ]
    });

    return inputStream.pipe(ffmpeg);
}

module.exports = convertToOpusStream;
