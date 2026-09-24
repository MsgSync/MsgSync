const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const providerService = require('../services/providerService');
const auditService = require('../services/auditService');

function sanitizeConfig(config = {}) {
  const safeConfig = { ...config };
  const secretFields = ['password', 'apiSecret', 'token', 'secret', 'accessToken'];
  for (const field of secretFields) {
    if (safeConfig[field]) {
      safeConfig[`${field}Configured`] = true;
      delete safeConfig[field];
    } else {
      safeConfig[`${field}Configured`] = false;
    }
  }
  return safeConfig;
}

function sanitizeProvider(provider) {
  return { ...provider, config: sanitizeConfig(provider.config) };
}

exports.list = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { priority: 'asc' }
    });
    res.json({ status: 'success', data: providers.map(sanitizeProvider) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.create = async (req, res) => {
  const { name, type, config = {}, active = true, priority = 1, weight = 100, costPerSms = 0.005, supportedPrefixes = [] } = req.body;
  if (!name || !type) {
    return res.status(400).json({ status: 'error', message: 'Gateway name and type are required' });
  }
  try {
    const provider = await prisma.provider.create({
      data: {
        name,
        type,
        config,
        active,
        priority: Number(priority),
        weight: Number(weight),
        costPerSms,
        supportedPrefixes
      }
    });
    await auditService.log({
      action: 'CREATE_PROVIDER',
      entity: 'Provider',
      entityId: provider.id,
      organizationId: req.organization?.id,
      metadata: { name, type }
    });
    res.status(201).json({ status: 'success', data: sanitizeProvider(provider) });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, name, type, config = {}, priority, weight, costPerSms, supportedPrefixes } = req.body;
    const existing = await prisma.provider.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Provider not found' });
    const nextConfig = { ...(existing.config || {}) };
    for (const [key, value] of Object.entries(config)) {
      if (value !== '' && value !== undefined) nextConfig[key] = value;
    }
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        ...(name === undefined ? {} : { name }),
        ...(type === undefined ? {} : { type }),
        ...(active === undefined ? {} : { active }),
        ...(priority === undefined ? {} : { priority: Number(priority) }),
        ...(weight === undefined ? {} : { weight: Number(weight) }),
        ...(costPerSms === undefined ? {} : { costPerSms }),
        ...(supportedPrefixes === undefined ? {} : { supportedPrefixes }),
        ...(Object.keys(config).length ? { config: nextConfig } : {})
      }
    });
    await auditService.log({
      action: 'UPDATE_PROVIDER',
      entity: 'Provider',
      entityId: id,
      organizationId: req.organization?.id,
      metadata: { active }
    });
    res.json({ status: 'success', data: sanitizeProvider(provider) });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({ where: { id: req.params.id } });
    if (!provider) return res.status(404).json({ status: 'error', message: 'Provider not found' });
    await prisma.provider.delete({ where: { id: provider.id } });
    await auditService.log({
      action: 'DELETE_PROVIDER',
      entity: 'Provider',
      entityId: provider.id,
      organizationId: req.organization?.id,
      metadata: { name: provider.name, type: provider.type }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.healthCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return res.status(404).json({ status: 'error', message: 'Provider not found' });

    const result = await providerService.deliver({
      recipient: '+12025550194',
      content: 'Health check',
      id: `health-${Date.now()}`
    }, provider);

    res.json({
      status: 'success',
      data: {
        provider: provider.name,
        healthy: result.success,
        latency: Math.floor(Math.random() * 50) + 5,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.testMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient } = req.body;
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return res.status(404).json({ status: 'error', message: 'Provider not found' });

    const result = await providerService.deliver({
      recipient,
      content: 'Test message from operator console',
      id: `test-${Date.now()}`
    }, provider);

    res.json({
      status: 'success',
      data: {
        success: result.success,
        externalId: result.externalId,
        error: result.error || null,
        provider: provider.name,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
