const fs = require('fs');
const path = require('path');

function prepareEnvironmentFiles(options = {}) {
    const workspaceRoot = options.workspaceRoot || process.cwd();
    const targets = [
        {
            examplePath: path.join(workspaceRoot, 'packages/platform/.env.example'),
            targetPath: path.join(workspaceRoot, 'packages/platform/.env')
        },
        {
            examplePath: path.join(workspaceRoot, 'packages/aggregator/.env.example'),
            targetPath: path.join(workspaceRoot, 'packages/aggregator/.env')
        }
    ];

    const created = [];

    for (const entry of targets) {
        if (!fs.existsSync(entry.examplePath)) {
            continue;
        }

        if (!fs.existsSync(entry.targetPath)) {
            fs.copyFileSync(entry.examplePath, entry.targetPath);
            created.push(path.relative(workspaceRoot, entry.targetPath).replace(/\\/g, '/'));
        }
    }

    return { created };
}

if (require.main === module) {
    const result = prepareEnvironmentFiles();
    if (result.created.length > 0) {
        console.log(`Created environment files: ${result.created.join(', ')}`);
    } else {
        console.log('Environment files already exist.');
    }
}

module.exports = { prepareEnvironmentFiles };
