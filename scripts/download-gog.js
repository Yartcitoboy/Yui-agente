import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as os from 'os';
import { execSync } from 'child_process';

const BIN_DIR = path.join(process.cwd(), 'bin');
if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
}

let downloadUrl = '';
let isExe = false;

if (os.platform() === 'win32') {
    downloadUrl = 'https://github.com/steipete/gogcli/releases/download/v0.12.0/gogcli_0.12.0_windows_amd64.zip';
    isExe = true;
} else if (os.platform() === 'linux') {
    downloadUrl = 'https://github.com/steipete/gogcli/releases/download/v0.12.0/gogcli_0.12.0_linux_amd64.tar.gz';
}

if (!downloadUrl) {
    console.log('OS no soportado para auto-descarga de gogcli');
    process.exit(0);
}

const archiveFile = path.join(BIN_DIR, isExe ? 'gogcli.zip' : 'gogcli.tar.gz');

console.log(`Descargando gogcli para ${os.platform()}...`);

https.get(downloadUrl, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location || "", (res2) => {
            const stream = fs.createWriteStream(archiveFile);
            res2.pipe(stream);
            stream.on('finish', () => {
                stream.close();
                extractArchive();
            });
        });
    } else {
        const stream = fs.createWriteStream(archiveFile);
        res.pipe(stream);
        stream.on('finish', () => {
            stream.close();
            extractArchive();
        });
    }
});

function extractArchive() {
    console.log('Extrayendo gogcli...');
    if (isExe) {
        execSync(`tar -xf ${archiveFile} -C ${BIN_DIR}`, { stdio: 'inherit' });
    } else {
        execSync(`tar -xzf ${archiveFile} -C ${BIN_DIR}`, { stdio: 'inherit' });
    }
    fs.unlinkSync(archiveFile);
    console.log('Gogcli descargado exitosamente.');
}
