const fs = require('fs-extra');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { minify } = require('html-minifier-terser');

async function build() {
    console.log('Starting build...');

    // 1. Clean and create dist directory
    const distDir = path.join(__dirname, 'dist');
    await fs.emptyDir(distDir);
    console.log('Cleaned dist directory');

    // 2. Copy static assets
    // Copy img directory
    if (await fs.pathExists('img')) {
        await fs.copy('img', path.join(distDir, 'img'));
    }
    // Copy favicon
    if (await fs.pathExists('favicon.ico')) {
        await fs.copy('favicon.ico', path.join(distDir, 'favicon.ico'));
    }
    // Copy nginx conf if needed (optional, but good to keep)
    if (await fs.pathExists('littlesticker.amile.top.conf')) {
        await fs.copy('littlesticker.amile.top.conf', path.join(distDir, 'littlesticker.amile.top.conf'));
    }
    console.log('Copied static assets');

    // 3. Obfuscate JS files
    const jsDir = path.join(distDir, 'js');
    await fs.ensureDir(jsDir);

    const jsFiles = await fs.readdir('js');
    for (const file of jsFiles) {
        if (file.endsWith('.js')) {
            const content = await fs.readFile(path.join('js', file), 'utf8');
            const obfuscationResult = JavaScriptObfuscator.obfuscate(content, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: false,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                renameGlobals: false,
                rotateStringArray: true,
                selfDefending: true,
                stringArray: true,
                stringArrayEncoding: ['base64', 'rc4'],
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: false
            });
            
            await fs.writeFile(path.join(jsDir, file), obfuscationResult.getObfuscatedCode());
            console.log(`Obfuscated js/${file}`);
        }
    }

    // 4. Minify HTML (and inline JS/CSS)
    const htmlContent = await fs.readFile('index.html', 'utf8');
    const minifiedHtml = await minify(htmlContent, {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true, // This uses Terser to minify inline scripts
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true
    });
    
    await fs.writeFile(path.join(distDir, 'index.html'), minifiedHtml);
    console.log('Minified index.html');

    console.log('Build complete! Output in ./dist');
}

build().catch(console.error);

