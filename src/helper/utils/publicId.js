import mongoose from 'mongoose';
import { Sequence } from '../../modules/sequence/sequence.model.js';

const DEFAULT_WIDTH = 4;

export const buildPublicId = async (key, prefix, width = DEFAULT_WIDTH) => {
  const sequence = await Sequence.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  return `${prefix}${String(sequence.value).padStart(width, '0')}`;
};

export const buildDocumentIdentityFilter = (id) => {
  const orConditions = [{ publicId: id }];

  if (mongoose.Types.ObjectId.isValid(id)) {
    orConditions.push({ _id: id });
  }

  return { $or: orConditions };
};
