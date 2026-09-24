const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const axios = require('axios');

class LookupService {
    /**
   * Performs an HLR/MNP lookup for a phone number.
   * Uses cache if available and fresh (less than 30 days).
   */
    async performLookup(phone) {
        const cleanPhone = phone.replace('+', '');

        // 1. Check Cache
        const cached = await prisma.lookup.findUnique({
            where: { phone: cleanPhone }
        });

        const cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (
            cached &&
      Date.now() - new Date(cached.lastCheckedAt).getTime() < cacheExpiry
        ) {
            return cached;
        }

        // 2. Try configured HLR providers
        const activeConfigs = await prisma.hlrConfig.findMany({
            where: { active: true }
        });
        let result = null;

        if (activeConfigs.length > 0) {
            // Attempt to use the first active HLR provider (or fallback through them)
            // For now we just use the first one, but could be enhanced with fallback logic
            result = await this.performExternalHlr(activeConfigs[0], cleanPhone);
        }

        // 3. Fallback to mock if no real provider or real provider failed
        if (!result) {
            result = await this.mockExternalHlr(cleanPhone);
        }

        // 4. Update Cache
        return await prisma.lookup.upsert({
            where: { phone: cleanPhone },
            update: {
                isValid: result.isValid,
                carrier: result.carrier,
                mcc: result.mcc,
                mnc: result.mnc,
                type: result.type,
                isPorted: result.isPorted,
                lastCheckedAt: new Date()
            },
            create: {
                phone: cleanPhone,
                isValid: result.isValid,
                carrier: result.carrier,
                mcc: result.mcc,
                mnc: result.mnc,
                type: result.type,
                isPorted: result.isPorted
            }
        });
    }

    /**
   * Performs a real external HLR request based on configuration.
   */
    async performExternalHlr(config, phone) {
        try {
            console.log(
                `Calling HLR provider ${config.name} for ${phone} via ${config.baseUrl}`
            );

            const options = {
                method: config.method,
                url: config.baseUrl,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Authentication
            if (config.apiKey) {
                // Common patterns: Auth header or query params
                // Here we'll support a generic Bearer token or Key if apiSecret exists
                if (config.apiSecret) {
                    options.headers['Authorization'] =
            `Basic ${Buffer.from(config.apiKey + ':' + config.apiSecret).toString('base64')}`;
                } else {
                    options.headers['X-API-Key'] = config.apiKey;
                }
            }

            // Handle GET params or POST body
            if (config.method === 'GET') {
                options.params = { phone: phone };
            } else {
                options.data = { phone: phone };
            }

            const response = await axios(options);
            const data = response.data;

            // Apply mapping if provided
            if (config.mapping) {
                const mapping =
          typeof config.mapping === 'string'
              ? JSON.parse(config.mapping)
              : config.mapping;
                return {
                    isValid: this.getValueByPath(data, mapping.isValid) ?? true,
                    carrier:
            this.getValueByPath(data, mapping.carrier) ||
            config.name + ' Network',
                    mcc: this.getValueByPath(data, mapping.mcc) || '000',
                    mnc: this.getValueByPath(data, mapping.mnc) || '00',
                    type: this.getValueByPath(data, mapping.type) || 'mobile',
                    isPorted: !!this.getValueByPath(data, mapping.isPorted)
                };
            }

            // Fallback if no mapping (assumes standard structure if possible)
            return {
                isValid: data.isValid ?? true,
                carrier: data.carrier || data.network || config.name + ' Network',
                mcc: data.mcc || '000',
                mnc: data.mnc || '00',
                type: data.type || 'mobile',
                isPorted: !!data.isPorted
            };
        } catch (error) {
            console.error(
                `HLR External Call for ${config.name} Failed:`,
                error.message
            );
            return null;
        }
    }

    /**
   * Helper to get nested value from object via path strings like 'data.user.name'
   */
    getValueByPath(obj, path) {
        if (!path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
   * Simulates an HLR/MNP response.
   */
    async mockExternalHlr(phone) {
    // Simulated network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Logic to simulate different results based on number patterns
        const isPorted = phone.endsWith('1') || phone.endsWith('7');
        const carrierType =
      phone.startsWith('1') || phone.length > 10 ? 'mobile' : 'landline';

        const mobileCarriers = [
            'Vodafone',
            'T-Mobile',
            'AT&T',
            'Orange',
            'Telefónica'
        ];
        const carrier =
      carrierType === 'mobile'
          ? mobileCarriers[Math.floor(Math.random() * mobileCarriers.length)]
          : 'Fixed Line Operator';

        return {
            isValid: true,
            carrier: carrier,
            mcc: phone.substring(0, 3),
            mnc: phone.substring(3, 5),
            type: carrierType,
            isPorted: isPorted
        };
    }

    async listRecentLookups() {
        return await prisma.lookup.findMany({
            orderBy: { lastCheckedAt: 'desc' },
            take: 100
        });
    }

    // Config Management
    async getConfigs() {
        return await prisma.hlrConfig.findMany();
    }

    async saveConfig(data) {
        const auditService = require('./auditService');
        if (data.id) {
            const updated = await prisma.hlrConfig.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    baseUrl: data.baseUrl,
                    method: data.method,
                    apiKey: data.apiKey,
                    apiSecret: data.apiSecret,
                    active: data.active,
                    mapping: data.mapping
                }
            });

            await auditService.log({
                action: 'UPDATE_HLR_CONFIG',
                entity: 'HlrConfig',
                entityId: updated.id,
                organizationId: 'SYSTEM', // System-level config
                metadata: { name: updated.name }
            });

            return updated;
        }

        const created = await prisma.hlrConfig.create({
            data: {
                name: data.name,
                baseUrl: data.baseUrl,
                method: data.method,
                apiKey: data.apiKey,
                apiSecret: data.apiSecret,
                active: data.active,
                mapping: data.mapping
            }
        });

        await auditService.log({
            action: 'CREATE_HLR_CONFIG',
            entity: 'HlrConfig',
            entityId: created.id,
            organizationId: 'SYSTEM',
            metadata: { name: created.name }
        });

        return created;
    }

    async deleteConfig(id) {
        const auditService = require('./auditService');
        const deleted = await prisma.hlrConfig.delete({ where: { id } });

        await auditService.log({
            action: 'DELETE_HLR_CONFIG',
            entity: 'HlrConfig',
            entityId: id,
            organizationId: 'SYSTEM',
            metadata: { name: deleted.name }
        });

        return deleted;
    }
}

module.exports = new LookupService();
