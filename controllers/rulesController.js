const Rule = require('../models/Rule');
const crypto = require('crypto');

const formatRule = (rule) => ({
  ruleId: rule.ruleId,
  name: rule.name,
  versionCount: rule.versions.length,
  latestAt: rule.versions[rule.versions.length - 1]?.createdAt ?? rule.createdAt,
  shareToken: rule.shareToken,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});

const createRule = async (req, res, next) => {
  try {
    const { ruleId, name, contentBase64 } = req.body;

    if (!ruleId || !name || !contentBase64)
      return res.status(400).json({ message: 'ruleId, name and contentBase64 are required.' });

    const existing = await Rule.findOne({ userId: req.userId, ruleId, deletedAt: null });
    if (existing)
      return res.status(409).json({ message: 'Rule already exists.' });

    const rule = await Rule.create({
      userId: req.userId,
      ruleId,
      name,
      versions: [{ contentBase64 }],
    });

    res.status(201).json(formatRule(rule));
  } catch (err) {
    next(err);
  }
};

const updateRule = async (req, res, next) => {
  try {
    const { contentBase64, name } = req.body;

    if (!contentBase64)
      return res.status(400).json({ message: 'contentBase64 is required.' });

    const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Rule not found.' });

    const latest = rule.versions[rule.versions.length - 1];
    if (latest && latest.contentBase64 === contentBase64)
      return res.status(200).json(formatRule(rule));

    rule.versions.push({ contentBase64 });
    if (name) rule.name = name;
    await rule.save();

    res.json(formatRule(rule));
  } catch (err) {
    next(err);
  }
};

const deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Rule not found.' });

    rule.deletedAt = new Date();
    await rule.save();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const listRules = async (req, res, next) => {
  try {
    const rules = await Rule.find({ userId: req.userId, deletedAt: null })
      .select('ruleId name versions shareToken createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json(rules.map((rule) => ({
      ruleId: rule.ruleId,
      name: rule.name,
      versionCount: rule.versions.length,
      latestAt: rule.versions[rule.versions.length - 1]?.createdAt ?? rule.createdAt,
      shareToken: rule.shareToken,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    })));
  } catch (err) {
    next(err);
  }
};

const getRuleHistory = async (req, res, next) => {
  try {
    const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Rule not found.' });

    res.json({
      ruleId: rule.ruleId,
      name: rule.name,
      history: rule.versions.map((v, i) => ({
        index: i,
        contentBase64: v.contentBase64,
        createdAt: v.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

const downloadRule = async (req, res, next) => {
  try {
    const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Rule not found.' });

    const versionIndex = req.query.version !== undefined
      ? parseInt(req.query.version, 10)
      : rule.versions.length - 1;

    const version = rule.versions[versionIndex];
    if (!version)
      return res.status(404).json({ message: 'Version not found.' });

    const content = Buffer.from(version.contentBase64, 'base64').toString('utf-8');
    const filename = `${rule.name.replace(/[^a-z0-9]/gi, '_')}_v${versionIndex + 1}.js`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(content);
  } catch (err) {
    next(err);
  }
};

const shareRule = async (req, res, next) => {
  try {
    const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Rule not found.' });

    if (!rule.shareToken) {
      rule.shareToken = crypto.randomBytes(16).toString('hex');
      await rule.save();
    }

    res.json({ shareToken: rule.shareToken });
  } catch (err) {
    next(err);
  }
};

const revokeShare = async (req, res, next) => {
  try {
    const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Rule not found.' });

    if (!rule.shareToken)
      return res.status(400).json({ message: 'Rule is not shared.' });

    rule.shareToken = null;
    await rule.save();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const getSharedRule = async (req, res, next) => {
  try {
    const rule = await Rule.findOne({ shareToken: req.params.shareToken, deletedAt: null });
    if (!rule)
      return res.status(404).json({ message: 'Not found.' });

    res.json({
      ruleId: rule.ruleId,
      name: rule.name,
      versionCount: rule.versions.length,
      updatedAt: rule.updatedAt,
      history: rule.versions.map((v, i) => ({
        index: i,
        contentBase64: v.contentBase64,
        createdAt: v.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  getRuleHistory,
  downloadRule,
  shareRule,
  revokeShare,
  getSharedRule,
};
