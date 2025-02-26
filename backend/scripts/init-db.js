const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get all migration files
const migrationsDir = path.join(__dirname, '..', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

// Execute each migration in order
try {
    for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        console.log(`Applying migration: ${migrationFile}`);
        execSync(`wrangler d1 execute gayness-scale-db --local --file="${migrationPath}"`, { stdio: 'inherit' });
    }
    console.log('Database initialized successfully');
} catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
} 