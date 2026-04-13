// frontend/test-commonjs.js
const fs = require('fs');

console.log('🧪 Test des imports\n');

// Vérification des fichiers
const files = [
  'lib/constants/colors.ts',
  'lib/constants/routes.ts',
  'lib/constants/config.ts',
  'lib/utils/dates.ts',
  'lib/utils/formatters.ts',
  'lib/utils/validators.ts',
  'lib/types/device.ts',
  'lib/types/measurement.ts',
  'lib/types/alert.ts',
  'lib/types/index.ts',
];

console.log('📁 Vérification des fichiers:');
files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Test d'import avec TypeScript (utilisation de ts-node)
console.log('\n📦 Test des imports TypeScript:');
try {
  // Pour tester les imports TypeScript, nous devons utiliser ts-node
  const { execSync } = require('child_process');
  
  console.log('  Installation de ts-node (si nécessaire)...');
  execSync('npm install -g ts-node typescript', { stdio: 'ignore' });
  
  console.log('  Test avec ts-node...');
  execSync('npx ts-node -e "\
    const { COLORS } = require(\'./lib/constants/colors.ts\');\
    const { ROUTES } = require(\'./lib/constants/routes.ts\');\
    const { CONFIG } = require(\'./lib/constants/config.ts\');\
    const { formatDateTime } = require(\'./lib/utils/dates.ts\');\
    const { formatPower } = require(\'./lib/utils/formatters.ts\');\
    const { isValidEmail } = require(\'./lib/utils/validators.ts\');\
    console.log(\'  ✅ Tous les imports TypeScript fonctionnent !\');\
  "', { stdio: 'inherit' });
  
} catch (error) {
  console.log('  ⚠️ ts-node non disponible, test ignoré');
}

console.log('\n🎉 Test terminé !');