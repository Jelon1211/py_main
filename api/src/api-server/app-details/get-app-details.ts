import os from 'os';
import {AppDetails} from './app-details.interface';

export const getAppDetails = (mainModule: string): AppDetails => ({
	pid:      process.pid,
	runPath:  process.execPath,
	argv:     process.argv,
	mainModule,
	title:    process.title,
	version:  process.version,
	versions: process.versions,
	os:       {
		hostname:    os.hostname(),
		type:        os.type(),
		platform:    os.platform(),
		arch:        os.arch(),
		release:     os.release(),
		totalMemory: os.totalmem(),
		freeMemory:  os.freemem()
	}
});
