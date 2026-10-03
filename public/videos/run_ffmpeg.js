const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

console.log('Using ffmpeg at:', ffmpegPath);

const ffmpeg = spawn(ffmpegPath, [
    '-i', 'heronew.mp4',
    '-vcodec', 'libx264',
    '-crf', '23',
    '-preset', 'slow',
    '-an', 'heronew-optimized.mp4'
]);

ffmpeg.stdout.on('data', (data) => console.log(`stdout: ${data}`));
ffmpeg.stderr.on('data', (data) => console.log(`stderr: ${data}`));

ffmpeg.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
