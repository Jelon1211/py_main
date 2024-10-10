export interface AppDetails {

	pid: number,
	runPath: string,
	argv: string[],
	mainModule: string,
	title: string,
	version: string,
	versions: unknown,
	os: {
		hostname: string,
		type: string,
		platform: string,
		arch: string,
		release: string,
		totalMemory: number,
		freeMemory: number

	}
}
