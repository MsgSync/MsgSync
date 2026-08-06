const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RoutingService {
    /**
   * Finds the most optimal providers for a message based on prefix, MCC/MNC, and organization rules.
   */
    async getOptimalProviders(phone, organizationId = null) {
        const cleanPhone = phone.replace('+', '');
        const lookupService = require('./lookupService');

        // 1. Perform HLR/MNP Dipping to get actual network info
        const lookup = await lookupService.performLookup(cleanPhone);
        const mcc = lookup?.mcc;
        const mnc = lookup?.mnc;

        // 2. Fetch all active routing rules for this organization
        const rules = await prisma.routingRule.findMany({
            where: {
                active: true,
                OR: [{ organizationId: organizationId }, { organizationId: null }]
            },
            include: { provider: true },
            orderBy: [{ priority: 'asc' }]
        });

        // 3. Filter rules based on MCC/MNC (Highest priority) or Prefix
        let matchingProviders = [];

        // First, check for exact MNP (MCC+MNC) match
        if (mcc && mnc) {
            matchingProviders = rules
                .filter((rule) => rule.mcc === mcc && rule.mnc === mnc)
                .map((rule) => rule.provider);
        }

        // If no MNP match, fall back to prefix matching
        if (matchingProviders.length === 0) {
            // Sort by prefix length desc for longest prefix match
            const prefixRules = rules
                .filter((rule) => rule.prefix && cleanPhone.startsWith(rule.prefix))
                .sort((a, b) => (b.prefix?.length || 0) - (a.prefix?.length || 0));

            if (prefixRules.length > 0) {
                // Get providers for the longest matching prefix
                const longestPrefix = prefixRules[0].prefix;
                matchingProviders = prefixRules
                    .filter((rule) => rule.prefix === longestPrefix)
                    .map((rule) => rule.provider);
            }
        }

        // 4. Fallback to all active providers if no specific rules found
        if (matchingProviders.length === 0) {
            const globalRules = rules.filter(
                (rule) => !rule.prefix && !rule.mcc && !rule.mnc
            );
            if (globalRules.length > 0) {
                matchingProviders = globalRules.map((rule) => rule.provider);
            } else {
                matchingProviders = await prisma.provider.findMany({
                    where: { active: true },
                    orderBy: { priority: 'asc' }
                });
            }
        }

        // 5. Double check provider capabilities
        matchingProviders = matchingProviders.filter((p) => {
            if (!p.supportedPrefixes || p.supportedPrefixes.length === 0) return true;
            return p.supportedPrefixes.some((prefix) =>
                cleanPhone.startsWith(prefix)
            );
        });

        return matchingProviders;
    }

    async createRule(data) {
        return await prisma.routingRule.create({ data });
    }

    async updateRule(id, data) {
        return await prisma.routingRule.update({
            where: { id },
            data
        });
    }

    async listRules() {
        return await prisma.routingRule.findMany({
            include: { provider: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteRule(id) {
        return await prisma.routingRule.delete({ where: { id } });
    }
}

module.exports = new RoutingService();
