const fs = require('fs');
const path = require('path');

const rootFolder = 'DATA'; // Change this to your root folder path

function renameCSVToTXT(filePath) {
    const newFilePath = filePath.replace('.csv', '(txt).txt');
    fs.rename(filePath, newFilePath, (err) => {
        if (err) {
            console.error(`Error renaming ${filePath}:`, err);
        } else {
            console.log(`Renamed ${filePath} to ${newFilePath}`);
        }
    });
}

function processFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Error reading folder ${folderPath}:`, err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for ${filePath}:`, err);
                    return;
                }

                if (stats.isDirectory()) {
                    processFolder(filePath); // Recurse into subfolder
                } else if (stats.isFile() && path.extname(filePath).toLowerCase() === '.csv') {
                    renameCSVToTXT(filePath);
                }
            });
        });
    });
}

processFolder(rootFolder);