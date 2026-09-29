import mongoose, { Schema, Document } from 'mongoose';

export type EvidenceType =
  | 'FAO'
  | 'FAO GIAHS'
  | 'FAO AGRIS'
  | 'Government'
  | 'Peer-Reviewed Research'
  | 'Research Institution';

export interface IKnowledgeProvenance {
  sourceType: string;
  organization: string;
  title: string;
  year?: number;
  url: string;
  retrievedAt: string;
}

export interface IKnowledgePractice extends Document {
  practiceId: string;
  title: string;
  country: 'India' | 'Brazil' | 'Russia' | 'China' | 'South Africa';
  region: string;
  crop: string;
  climateZone?: string;
  practiceType: string;
  description: string;
  practiceDetails: string;
  evidenceType: EvidenceType;
  sourceOrganization: string;
  sourceTitle: string;
  sourceYear?: number;
  sourceUrl: string;
  imageUrl: string;
  imageSource?: string;
  imageLicense?: string;
  imageAttribution?: string;
  researchEvidence?: string[];
  expectedBenefit?: string;
  adaptationNotes?: string;
  bricsRelevance?: string;
  provenance?: IKnowledgeProvenance;
  tags: string[];
  views: number;
  likes: number;
  likedByUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgePracticeSchema = new Schema<IKnowledgePractice>(
  {
    practiceId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    country: {
      type: String,
      required: true,
      enum: ['India', 'Brazil', 'Russia', 'China', 'South Africa'],
      index: true,
    },
    region: { type: String, default: '' },
    crop: { type: String, default: '' },
    climateZone: { type: String, default: '' },
    practiceType: { type: String, default: '' },
    description: { type: String, required: true },
    practiceDetails: { type: String, default: '' },
    evidenceType: {
      type: String,
      enum: [
        'FAO',
        'FAO GIAHS',
        'FAO AGRIS',
        'Government',
        'Peer-Reviewed Research',
        'Research Institution',
      ],
      default: 'Peer-Reviewed Research',
    },
    sourceOrganization: { type: String, default: '' },
    sourceTitle: { type: String, default: '' },
    sourceYear: { type: Number },
    sourceUrl: { type: String, default: '' },
    imageUrl: { type: String, default: '/images/farmer-hero.jpg' },
    imageSource: { type: String, default: '' },
    imageLicense: { type: String, default: '' },
    imageAttribution: { type: String, default: '' },
    researchEvidence: [{ type: String }],
    expectedBenefit: { type: String, default: '' },
    adaptationNotes: { type: String, default: '' },
    bricsRelevance: { type: String, default: '' },
    provenance: {
      sourceType: { type: String },
      organization: { type: String },
      title: { type: String },
      year: { type: Number },
      url: { type: String },
      retrievedAt: { type: String },
    },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedByUsers: [{ type: String }],
  },
  { timestamps: true }
);

KnowledgePracticeSchema.index({ country: 1, createdAt: -1 });

export const KnowledgePracticeModel = mongoose.model<IKnowledgePractice>(
  'KnowledgePractice',
  KnowledgePracticeSchema
);
