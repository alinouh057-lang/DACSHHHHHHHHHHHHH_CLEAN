// frontend/test-imports.mjs
import { COLORS } from './lib/constants/colors.js';
import { ROUTES, PUBLIC_ROUTES } from './lib/constants/routes.js';
import { CONFIG } from './lib/constants/config.js';
import { formatDateTime, formatTime, getTimeAgo } from './lib/utils/dates.js';
import { formatPower, getStatusColor, formatPercent } from './lib/utils/formatters.js';
import { isValidEmail, isValidPassword, isValidDeviceId } from './lib/utils/validators.js';

console.log('🧪 Test des imports\n');

console.log('📦 Constantes:');
console.log(`  COLORS: ${Object.keys(COLORS).length} couleurs`);
console.log(`  ROUTES: ${Object.keys(ROUTES).length} routes`);
console.log(`  CONFIG: ${Object.keys(CONFIG).length} configurations`);

console.log('\n📅 Utils dates:');
console.log(`  formatDateTime: ${formatDateTime(new Date().toISOString())}`);
console.log(`  formatTime: ${formatTime(new Date().toISOString())}`);
console.log(`  getTimeAgo: ${getTimeAgo(new Date())}`);

console.log('\n📊 Utils formatters:');
console.log(`  formatPower(1500): ${formatPower(1500)}`);
console.log(`  formatPercent(85.5): ${formatPercent(85.5)}`);
console.log(`  getStatusColor("Warning"): ${getStatusColor('Warning')}`);

console.log('\n✅ Utils validators:');
console.log(`  isValidEmail("test@email.com"): ${isValidEmail('test@email.com')}`);
const pwdTest = isValidPassword('Test1234');
console.log(`  isValidPassword("Test1234"): ${pwdTest.valid}`);
console.log(`  isValidDeviceId("esp32_test-01"): ${isValidDeviceId('esp32_test-01')}`);

console.log('\n🎉 Tous les tests sont passés !');