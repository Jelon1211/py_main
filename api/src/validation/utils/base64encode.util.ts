import {Buffer} from 'buffer';

export function encodeToBase64(input: string): string {
    return Buffer.from(input, 'utf-8').toString('base64');
}