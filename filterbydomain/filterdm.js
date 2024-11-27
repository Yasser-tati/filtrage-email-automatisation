const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function filterLinesFromStream(readStream, domain, writeStream, callback) {
    let remaining = '';
    readStream.on('data', chunk => {
        const lines = (remaining + chunk).split(/\r?\n/);
        remaining = lines.pop();

        lines.forEach(line => {
            if (line.includes(domain)) {
                writeStream.write(line + '\n');
            }
        });
    });

    readStream.on('end', () => {
        if (remaining && remaining.includes(domain)) {
            writeStream.write(remaining + '\n');
        }
        writeStream.end(callback);
    });
}

function processDirectory(dirPath, domain, outputDirectory, callback) {
    const files = fs.readdirSync(dirPath);

    function processNextFile(index) {
        if (index >= files.length) {
            callback();
            return;
        }

        const file = files[index];
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile() && path.extname(file) === '.txt') {
            const outputFile = path.join(outputDirectory, `${domain}.txt`);
            const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
            const writeStream = fs.createWriteStream(outputFile, { flags: 'a', encoding: 'utf8' });

            filterLinesFromStream(readStream, domain, writeStream, () => {
                processNextFile(index + 1);
            });
        } else if (stats.isDirectory()) {
            processDirectory(filePath, domain, outputDirectory, () => {
                processNextFile(index + 1);
            });
        } else {
            processNextFile(index + 1);
        }
    }

    processNextFile(0);
}

const sourceDirectory = 'DATA';
const outputDirectory = 'Filtered_domain';
const domainsFilePath = 'input.txt'; // Path to the domains file

function startFiltering() {
    // Read domains from the domains.txt file
    const domains = fs.readFileSync(domainsFilePath, 'utf8').split(/\r?\n/);

    function processNextDomain(index) {
        if (index >= domains.length) {
            rl.close();
            processFilesInFolder(folderPath);
            return;
        }

        const domain = domains[index];
        processDirectory(sourceDirectory, domain, outputDirectory, () => {
            processNextDomain(index + 1);
        });
    }

    processNextDomain(0);
}

startFiltering();

const folderPath = 'Filtered_domain'; // Change this to the actual folder path

async function removeDuplicateLines(filePath) {
    const linesSet = new Set();
    const tempFilePath = filePath + '.temp';

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        linesSet.add(line);
    }

    rl.close();

    const uniqueLines = Array.from(linesSet).join('\n');
    fs.writeFileSync(tempFilePath, uniqueLines);

    fs.renameSync(tempFilePath, filePath);
}

async function processFilesInFolder(folderPath) {
    try {
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileStats = fs.statSync(filePath);

            if (fileStats.isFile() && path.extname(file) === '.txt') {
                console.log(`Processing: ${filePath}`);
                await removeDuplicateLines(filePath);
                console.log(`Duplicates removed from: ${filePath}`);
            }
        }

        console.log('All files processed.');
    } catch (err) {
        console.error('An error occurred:', err);
    }
}
