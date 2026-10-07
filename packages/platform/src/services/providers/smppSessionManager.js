const SMPPProvider = require('./smpp');

/**
 * Keeps one bound SMPP session per provider so messages reuse connections
 * and delivery receipts keep arriving between sends.
 */
class SmppSessionManager {
    constructor() {
        this.sessions = new Map();
    }

    async get(provider) {
        const key = provider.id || provider.name;
        const hash = SMPPProvider.configHash(provider.config);
        let entry = this.sessions.get(key);

        if (entry && entry.hash !== hash) {
            await entry.session.disconnect();
            this.sessions.delete(key);
            entry = null;
        }

        if (!entry) {
            entry = { hash, session: new SMPPProvider(provider.config) };
            this.sessions.set(key, entry);
        }

        try {
            await entry.session.connect();
        } catch (error) {
            await entry.session.disconnect();
            this.sessions.delete(key);
            throw error;
        }
        return entry.session;
    }

    async closeAll() {
        const entries = [...this.sessions.values()];
        this.sessions.clear();
        await Promise.all(entries.map((entry) => entry.session.disconnect()));
    }
}

module.exports = new SmppSessionManager();
module.exports.SmppSessionManager = SmppSessionManager;
