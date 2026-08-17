/**
 * Safe Orphaned Uploads Inspection & Cleanup Tool
 *
 * Scans the server/uploads/resumes directory, cross-references physical files
 * with MongoDB Resume documents, and safely identifies orphaned/temporary files.
 *
 * Usage:
 *   node server/utils/cleanOrphanUploads.js           (Dry run: only scans & reports)
 *   node server/utils/cleanOrphanUploads.js --delete  (Deletes ONLY unreferenced files)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

import Resume from '../models/Resume.js';

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'resumes');
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function scanOrphanUploads() {
  const shouldDelete = process.argv.includes('--delete');

  console.log('====================================================');
  console.log('🔍 SAFE ORPHANED UPLOADS SCANNER');
  console.log(`📂 Scanning Directory: ${UPLOADS_DIR}`);
  console.log(`⚙️  Mode: ${shouldDelete ? '💥 DELETE (Active Cleanup)' : '🛡️ DRY RUN (Scan Only)'}`);
  console.log('====================================================\n');

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('Uploads directory does not exist.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  // Fetch all registered resume file paths from MongoDB
  const registeredResumes = await Resume.find({}, 'filePath fileName').lean();
  const registeredFileNames = new Set();

  registeredResumes.forEach((r) => {
    if (r.fileName) registeredFileNames.add(r.fileName);
    if (r.filePath) {
      registeredFileNames.add(path.basename(r.filePath));
    }
  });

  console.log(`📌 Found ${registeredResumes.length} registered resume documents in MongoDB.\n`);

  const filesOnDisk = fs.readdirSync(UPLOADS_DIR);
  const physicalFiles = filesOnDisk.filter((f) => f !== '.gitkeep');

  console.log(`📁 Found ${physicalFiles.length} physical files on disk.`);

  let orphanedCount = 0;
  let preservedCount = 0;

  for (const file of physicalFiles) {
    const isRegistered = registeredFileNames.has(file);

    if (isRegistered) {
      preservedCount++;
    } else {
      orphanedCount++;
      const fullPath = path.join(UPLOADS_DIR, file);
      if (shouldDelete) {
        fs.unlinkSync(fullPath);
        console.log(`  🗑️  Deleted unreferenced file: ${file}`);
      } else {
        console.log(`  ⚠️  Orphaned file detected (not in MongoDB): ${file}`);
      }
    }
  }

  console.log('\n====================================================');
  console.log('SCAN SUMMARY:');
  console.log(`  Preserved / MongoDB Active Files : ${preservedCount}`);
  console.log(`  Orphaned / Unreferenced Files   : ${orphanedCount}`);
  console.log('====================================================');

  if (!shouldDelete && orphanedCount > 0) {
    console.log('\n💡 To remove orphaned files, re-run with: node server/utils/cleanOrphanUploads.js --delete\n');
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

scanOrphanUploads().catch((err) => {
  console.error('💥 Error running orphan scanner:', err);
  process.exit(1);
});
