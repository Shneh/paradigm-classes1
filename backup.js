const https = require('https');
const fs = require('fs');

function unwrapValue(value) {
    if (value === null || value === undefined) return null;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
    if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue !== undefined) {
        return (value.arrayValue.values || []).map(val => unwrapValue(val));
    }
    if (value.mapValue !== undefined) {
        const obj = {};
        const fields = value.mapValue.fields || {};
        for (const [key, val] of Object.entries(fields)) {
            obj[key] = unwrapValue(val);
        }
        return obj;
    }
    return value;
}

function unwrapDocument(doc) {
    const obj = {};
    const fields = doc.fields || {};
    for (const [key, val] of Object.entries(fields)) {
        obj[key] = unwrapValue(val);
    }
    return obj;
}

console.log('📥 Connecting to Firestore REST API...');
https.get('https://firestore.googleapis.com/v1/projects/paradigm-classes/databases/(default)/documents/appData', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const rawJson = JSON.parse(data);
            
            // Save raw backup
            fs.writeFileSync('firestore_backup_raw.json', JSON.stringify(rawJson, null, 2));
            console.log('✅ Saved raw JSON backup to: firestore_backup_raw.json');

            // Unwrap document list
            const cleanBackup = {};
            const docs = rawJson.documents || [];
            
            docs.forEach(doc => {
                const parts = doc.name.split('/');
                const docId = parts[parts.length - 1];
                cleanBackup[docId] = unwrapDocument(doc);
            });

            fs.writeFileSync('firestore_backup_clean.json', JSON.stringify(cleanBackup, null, 2));
            console.log('✅ Saved clean formatted JSON backup to: firestore_backup_clean.json');
            console.log('🎉 Backup completed successfully!');
        } catch (e) {
            console.error('❌ Failed to parse or save backup:', e);
        }
    });
}).on('error', (err) => {
    console.error('❌ Request failed:', err);
});
