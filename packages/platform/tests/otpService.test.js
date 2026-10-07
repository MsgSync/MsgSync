const { OTPService, MAX_ATTEMPTS } = require('../src/services/otpService');

describe('OTPService', () => {
    let service;

    beforeEach(() => {
        service = new OTPService();
    });

    it('validates a correct code once', async () => {
        const { otp } = await service.generateOTP('+1', 6, 300, 'org-1');

        expect(await service.validateOTP('+1', otp, 'org-1')).toEqual({ valid: true });
        expect((await service.validateOTP('+1', otp, 'org-1')).valid).toBe(false);
    });

    it('does not store the plaintext code', async () => {
        const { otp } = await service.generateOTP('+1', 6, 300, 'org-1');

        const stored = JSON.stringify([...service.otps.values()]);
        expect(stored).not.toContain(otp);
    });

    it('isolates codes between organizations', async () => {
        const { otp } = await service.generateOTP('+1', 6, 300, 'org-1');

        expect((await service.validateOTP('+1', otp, 'org-2')).valid).toBe(false);
        expect((await service.validateOTP('+1', otp, 'org-1')).valid).toBe(true);
    });

    it('locks out after too many invalid attempts', async () => {
        const { otp } = await service.generateOTP('+1', 6, 300, 'org-1');
        const wrong = otp === '000000' ? '111111' : '000000';

        for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
            await service.validateOTP('+1', wrong, 'org-1');
        }

        const result = await service.validateOTP('+1', otp, 'org-1');
        expect(result.valid).toBe(false);
        expect(result.message).toMatch(/No OTP/);
    });

    it('expires codes and clamps length and ttl', async () => {
        const { otp, ttl } = await service.generateOTP('+1', 99, 99999, 'org-1');
        expect(otp).toHaveLength(8);
        expect(ttl).toBe(600);

        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now + 601 * 1000);
        expect((await service.validateOTP('+1', otp, 'org-1')).message).toMatch(/expired/);
        Date.now.mockRestore();
    });
});
