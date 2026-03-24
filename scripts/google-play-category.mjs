#!/usr/bin/env node
/**
 * Google Play — Set Contact Details via edits.details API
 */

import { google } from 'googleapis';
import fs from 'fs';

const PACKAGE_NAME = 'com.finansatlas.app';
const SERVICE_ACCOUNT_JSON = '/Users/neslihan/Desktop/Deploy/android deploy/analog-artifact-487900-m1-01c4a4da3e93.json';

async function main() {
  const keyFile = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_JSON, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await auth.getClient();
  const androidPublisher = google.androidpublisher({ version: 'v3', auth: authClient });

  // Create Edit
  console.log('[EDIT] Creating edit...');
  const editRes = await androidPublisher.edits.insert({
    packageName: PACKAGE_NAME,
    requestBody: {},
  });
  const editId = editRes.data.id;
  console.log(`[EDIT] Edit: ${editId}`);

  // Get current details
  console.log('[DETAILS] Getting current details...');
  try {
    const details = await androidPublisher.edits.details.get({
      packageName: PACKAGE_NAME,
      editId,
    });
    console.log('[DETAILS] Current:', JSON.stringify(details.data, null, 2));
  } catch (e) {
    console.log('[DETAILS] Not set yet:', e.message);
  }

  // Update details with contact info
  console.log('[DETAILS] Setting contact details...');
  const updateRes = await androidPublisher.edits.details.update({
    packageName: PACKAGE_NAME,
    editId,
    requestBody: {
      contactEmail: 'g.alpatar@gmail.com',
      contactWebsite: 'https://owebsite.wordpress.com/contact/',
      defaultLanguage: 'tr-TR',
    },
  });
  console.log('[DETAILS] ✅ Updated:', JSON.stringify(updateRes.data, null, 2));

  // Commit
  console.log('[COMMIT] Committing edit...');
  await androidPublisher.edits.commit({
    packageName: PACKAGE_NAME,
    editId,
  });
  console.log('[COMMIT] ✅ Done');
}

main().catch(err => {
  console.error('❌ ERROR:', err.message);
  if (err.response?.data) console.error('Details:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
