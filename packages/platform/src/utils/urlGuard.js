const dns = require('dns').promises;
const net = require('net');

function isPrivateIPv4(ip) {
    const [a, b] = ip.split('.').map(Number);
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0) ||
        (a === 198 && (b === 18 || b === 19)) ||
        a >= 224
    );
}

function isPrivateAddress(ip) {
    if (net.isIPv4(ip)) return isPrivateIPv4(ip);
    const lower = ip.toLowerCase();
    if (lower.startsWith('::ffff:')) {
        const mapped = lower.slice(7);
        return net.isIPv4(mapped) ? isPrivateIPv4(mapped) : true;
    }
    return (
        lower === '::' ||
        lower === '::1' ||
        lower.startsWith('fc') ||
        lower.startsWith('fd') ||
        lower.startsWith('fe8') ||
        lower.startsWith('fe9') ||
        lower.startsWith('fea') ||
        lower.startsWith('feb')
    );
}

async function assertPublicHttpUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http and https URLs are allowed');
    }

    if (process.env.ALLOW_PRIVATE_OUTBOUND_URLS === 'true') {
        return parsed;
    }

    const host = parsed.hostname.replace(/^\[|\]$/g, '');
    const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });

    if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) {
        throw new Error('URL resolves to a private or reserved address');
    }

    return parsed;
}

module.exports = { assertPublicHttpUrl, isPrivateAddress };
