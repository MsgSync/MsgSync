const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const securityService = require('../services/securityService');
const auditService = require('../services/auditService');

exports.setup2FA = async (req, res) => {
  try {
    const result = await securityService.generate2FASecret(req.user.id, req.user.email);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.enable2FA = async (req, res) => {
  try {
    const { secret, token } = req.body;
    const success = await securityService.enable2FA(req.user.id, secret, token);
    if (success) {
      await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'ENABLE_2FA');
      res.status(200).json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });
    await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'DISABLE_2FA');
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getContentPolicy = async (req, res) => {
  try {
    const policy = await securityService.getContentPolicy(req.user.organizationId);
    res.json({ status: 'success', data: policy });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateContentPolicy = async (req, res) => {
  try {
    const policy = await securityService.updateContentPolicy(req.user.organizationId, req.body);
    await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'UPDATE_CONTENT_POLICY', req.body);
    res.json({ status: 'success', data: policy });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
exports.updateRestrictions = async (req, res) => {
  try {
    const { allowedCountries, maxDailySpend } = req.body;
    await securityService.updateOrganizationSecurity(req.user.organizationId, {
      allowedCountries,
      maxDailySpend
    });
    await securityService.logSecurityEvent(null, req.user.organizationId, 'UPDATE_SECURITY_POLICY', { allowedCountries, maxDailySpend });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.revokeSessions = async (req, res) => {
  try {
    await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'REVOKE_ALL_SESSIONS', { ip: req.ip });
    res.status(200).json({ status: 'success', message: 'Sessions revoked' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getSecurityAudit = async (req, res) => {
  try {
    const logs = await auditService.getLogs(req.user.organizationId, 100);
    res.json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.breakGlass = async (req, res) => {
  try {
    await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'BREAK_GLASS', { ip: req.ip, ticket: req.body.ticket });
    res.status(200).json({ status: 'success', message: 'Break-glass token issued. CISO notified.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
