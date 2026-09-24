const fs = require('fs');
const os = require('os');
const path = require('path');
const { prepareEnvironmentFiles } = require('../../../scripts/bootstrap-env');

describe('Environment bootstrap', () => {
    let tempRoot;

    beforeEach(() => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'msgsync-env-'));
        fs.mkdirSync(path.join(tempRoot, 'packages/platform'), { recursive: true });
        fs.mkdirSync(path.join(tempRoot, 'packages/aggregator'), { recursive: true });
        fs.writeFileSync(path.join(tempRoot, 'packages/platform/.env.example'), 'PORT=3001\nDATABASE_URL=postgres://localhost:5432/msgsync\n', 'utf8');
        fs.writeFileSync(path.join(tempRoot, 'packages/aggregator/.env.example'), 'PORT=3000\nREDIS_URL=redis://localhost:6379\n', 'utf8');
    });

    afterEach(() => {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    });

    it('creates missing environment files from examples', () => {
        const result = prepareEnvironmentFiles({ workspaceRoot: tempRoot });

        expect(result.created).toEqual(expect.arrayContaining([
            'packages/platform/.env',
            'packages/aggregator/.env'
        ]));

        const platformEnv = fs.readFileSync(path.join(tempRoot, 'packages/platform/.env'), 'utf8');
        const aggregatorEnv = fs.readFileSync(path.join(tempRoot, 'packages/aggregator/.env'), 'utf8');

        expect(platformEnv).toContain('PORT=3001');
        expect(aggregatorEnv).toContain('REDIS_URL=redis://localhost:6379');
    });
});
