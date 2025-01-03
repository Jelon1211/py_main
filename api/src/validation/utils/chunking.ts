// eslint-disable-next-line func-style,require-jsdoc
export function chunkArray(array: any[], chunkSize: number): any[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}