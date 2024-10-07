import {join} from 'path';

export const assignProcessEnvs = (dir: string) => {
	const pjson: { name: string, version: string } = require(join(dir, '..', 'package.json')) as { name: string, version: string };
	process.env.APP_VERSION = `${pjson.name}@${pjson.version}`;
	process.env.APP_VERSION_NUMBER = pjson.version;
};
