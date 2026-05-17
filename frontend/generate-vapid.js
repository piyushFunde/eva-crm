import webpush from 'web-push';
import fs from 'fs';

console.log('Generating VAPID Keys for EVA CRM...');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('---------------------------------------------------');
console.log('PUBLIC KEY:');
console.log(vapidKeys.publicKey);
console.log('---------------------------------------------------');
console.log('PRIVATE KEY:');
console.log(vapidKeys.privateKey);
console.log('---------------------------------------------------');

const envContent = `
# VAPID KEYS FOR PUSH NOTIFICATIONS
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

fs.appendFileSync('.env', envContent);

console.log('✅ Keys generated and appended to .env file.');
console.log('Next Steps:');
console.log('1. Add VAPID_PUBLIC_KEY to your frontend .env');
console.log('2. Add both keys to your backend application.yml');
