import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
