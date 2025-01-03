import * as crypto from 'crypto';
import {Buffer} from 'buffer';
import {Config} from "../../config-builder/config.interface";
import ConfigBuilder from "../../config-builder/config-builder";

const algorithm = 'aes-256-cbc';
const config: Config = ConfigBuilder.getConfig().config;
const secretKey = config.apilo.crypto;
const iv = crypto.randomBytes(16);

// eslint-disable-next-line func-style,require-jsdoc
export function encrypt(text: string): string {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// eslint-disable-next-line func-style,require-jsdoc
export function decrypt(hash: string): string {
    const [ivText, encryptedText] = hash.split(':');
    const ivBuffer = Buffer.from(ivText, 'hex');
    const encryptedBuffer = Buffer.from(encryptedText, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), ivBuffer);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

    return decrypted.toString();
}
