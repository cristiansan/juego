const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Todos los temas (existentes + nuevos)
const temas = [
    { year: '1945', url: 'https://shabam.dk/link/hrR0v0' },
    { year: '1965', url: 'https://shabam.dk/link/QZwOPJ' },
    { year: '1978', url: 'https://shabam.dk/link/rgcRN2' },
    { year: '2013', url: 'https://shabam.dk/link/CuqvIR' },
    { year: '1995', url: 'https://shabam.dk/link/t0gRQn' },
    { year: '1973', url: 'https://shabam.dk/link/S5nWeQ' },
    { year: '1968', url: 'https://shabam.dk/link/9KMTR5' },
    { year: '2018', url: 'https://shabam.dk/link/14gihZ' },
    { year: '1982', url: 'https://shabam.dk/link/AB12cd' },
    { year: '1990', url: 'https://shabam.dk/link/XY34ef' },
    { year: '2005', url: 'https://shabam.dk/link/MN56gh' },
    { year: '2020', url: 'https://shabam.dk/link/PQ78ij' }
];

// Crear carpeta images si no existe
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Generar QR para cada tema
temas.forEach(tema => {
    const outputPath = path.join(imagesDir, `${tema.year}.png`);

    QRCode.toFile(outputPath, tema.url, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, (err) => {
        if (err) {
            console.error(`Error generando QR para ${tema.year}:`, err);
        } else {
            console.log(`✅ QR generado: ${outputPath}`);
        }
    });
});
