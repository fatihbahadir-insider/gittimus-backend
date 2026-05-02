const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  contentBase64: {
    type: String,
    required: true,
  },
}, { timestamps: { createdAt: true, updatedAt: false } });

const ruleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ruleId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  versions: [versionSchema],
  shareToken: {
    type: String,
    sparse: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

ruleSchema.index({ userId: 1, ruleId: 1 }, { unique: true });

module.exports = mongoose.model('Rule', ruleSchema);
