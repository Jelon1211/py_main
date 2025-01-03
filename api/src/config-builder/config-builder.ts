import {env} from "node:process";

import {merge} from 'lodash';

import {Config} from "./config.interface";

class ConfigBuilder {
	private static instance: ConfigBuilder | null = null;
	public readonly config: Config;

	private constructor() {
		this.config = merge(
			require('../../config/main'),
			// eslint-disable-next-line security/detect-non-literal-require
			require(`../../config/server.${env.NODE_ENV}.js`)) as Config;
	}

	public static getConfig() {
		if (ConfigBuilder.instance) {
			return ConfigBuilder.instance;
		}
		return (ConfigBuilder.instance = new ConfigBuilder());
	}
}

export default ConfigBuilder;
