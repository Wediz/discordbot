import {Config} from '@remotion/cli/config';

// Rendu H.264 (MP4), qualité élevée.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);

// Si Remotion ne peut pas télécharger son navigateur, indiquer un Chrome local :
//   REMOTION_BROWSER=/chemin/vers/chrome npm run render
if (process.env.REMOTION_BROWSER) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
