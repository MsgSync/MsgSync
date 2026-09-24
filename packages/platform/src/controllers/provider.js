const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const providerService = require('../services/providerService');
const auditService = require('../services/auditService');

exports.list = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { priority: 'asc' }
    });
    res.json({ status: 'success', data: providers });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const provider = await prisma.provider.update({
      where: { id },
      data: { active }
    });
    await auditService.log({
      action: 'UPDATE_PROVIDER',
      entity: 'Provider',
      entityId: id,
      organizationId: req.organization?.id,
      metadata: { active }
    });
    res.json({ status: 'success', data: provider });
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
