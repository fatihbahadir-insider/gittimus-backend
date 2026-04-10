const Rule = require('../models/Rule');
const crypto = require('crypto');

const createRule = async (req, res) => {
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
};

const updateRule = async (req, res) => {
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
};

const deleteRule = async (req, res) => {
  const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
  if (!rule)
    return res.status(404).json({ message: 'Rule not found.' });

  rule.deletedAt = new Date();
  await rule.save();

  res.sendStatus(204);
};

const listRules = async (req, res) => {
  const rules = await Rule.find({ userId: req.userId, deletedAt: null })
    .select('ruleId name versions shareToken createdAt updatedAt')
    .sort({ updatedAt: -1 });

  const result = rules.map((rule) => ({
    ruleId: rule.ruleId,
    name: rule.name,
    versionCount: rule.versions.length,
    latestAt: rule.versions[rule.versions.length - 1]?.createdAt ?? rule.createdAt,
    shareToken: rule.shareToken,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }));

  res.json(result);
};

const getRuleHistory = async (req, res) => {
  const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
  if (!rule)
    return res.status(404).json({ message: 'Rule not found.' });

  const history = rule.versions.map((v, i) => ({
    index: i,
    contentBase64: v.contentBase64,
    createdAt: v.createdAt,
  }));

  res.json({ ruleId: rule.ruleId, name: rule.name, history });
};

const downloadRule = async (req, res) => {
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
  const filename = `${rule.name.replace(/[^a-z0-9]/gi, '_')}_v${versionIndex + 1}.txt`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
};

const shareRule = async (req, res) => {
  const rule = await Rule.findOne({ userId: req.userId, ruleId: req.params.ruleId, deletedAt: null });
  if (!rule)
    return res.status(404).json({ message: 'Rule not found.' });

  if (!rule.shareToken) {
    rule.shareToken = crypto.randomBytes(16).toString('hex');
    await rule.save();
  }

  res.json({ shareToken: rule.shareToken });
};

const getSharedRule = async (req, res) => {
  const rule = await Rule.findOne({ shareToken: req.params.shareToken, deletedAt: null });
  if (!rule)
    return res.status(404).json({ message: 'Not found.' });

  const latest = rule.versions[rule.versions.length - 1];
  const content = Buffer.from(latest.contentBase64, 'base64').toString('utf-8');

  res.json({
    ruleId: rule.ruleId,
    name: rule.name,
    content,
    versionCount: rule.versions.length,
    updatedAt: rule.updatedAt,
  });
};

const formatRule = (rule) => ({
  ruleId: rule.ruleId,
  name: rule.name,
  versionCount: rule.versions.length,
  latestAt: rule.versions[rule.versions.length - 1]?.createdAt ?? rule.createdAt,
  shareToken: rule.shareToken,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});

module.exports = {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  getRuleHistory,
  downloadRule,
  shareRule,
  getSharedRule,
};
