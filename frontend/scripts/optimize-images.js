const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../public/images');
const outputDir = path.join(__dirname, '../public/images/optimized');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readdirSync(inputDir).forEach(file => {
  if (path.extname(file) === '.png' || path.extname(file) === '.jpg' || path.extname(file) === '.jpeg') {
    sharp(path.join(inputDir, file))
      .resize(800)
      .toFile(path.join(outputDir, file), (err, info) => {
        if (err) {
          console.error(err);
        } else {
          console.log(info);
        }
      });
  }
});
