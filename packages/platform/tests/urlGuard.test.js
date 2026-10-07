const { assertPublicHttpUrl, isPrivateAddress } = require('../src/utils/urlGuard');

describe('urlGuard', () => {
    it('flags private and reserved addresses', () => {
        for (const ip of [
            '127.0.0.1',
            '10.1.2.3',
            '172.16.0.1',
            '192.168.1.1',
            '169.254.169.254',
            '::1',
            'fd00::1',
            '::ffff:127.0.0.1'
        ]) {
            expect(isPrivateAddress(ip)).toBe(true);
        }
        expect(isPrivateAddress('8.8.8.8')).toBe(false);
    });

    it('rejects non-http protocols and private hosts', async () => {
        await expect(assertPublicHttpUrl('file:///etc/passwd')).rejects.toThrow();
        await expect(assertPublicHttpUrl('http://169.254.169.254/latest')).rejects.toThrow(
            /private/
        );
        await expect(assertPublicHttpUrl('http://localhost:3001')).rejects.toThrow(/private/);
        await expect(assertPublicHttpUrl('not a url')).rejects.toThrow(/Invalid/);
    });

    it('accepts public IP literals', async () => {
        await expect(assertPublicHttpUrl('https://8.8.8.8/hlr')).resolves.toBeDefined();
    });
});
