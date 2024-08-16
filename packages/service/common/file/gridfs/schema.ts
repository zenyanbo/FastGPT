import { connectionMongo, type Model } from '../../mongo';
const { Schema, model, models } = connectionMongo;

const FileSchema = new Schema({});

try {
  FileSchema.index({ 'metadata.teamId': 1 });
  FileSchema.index({ 'metadata.uploadDate': -1 });
} catch (error) {
  console.log(error);
}

export const MongoFileSchema = models['dataset.files'] || model('dataset.files', FileSchema);

MongoFileSchema.syncIndexes();
