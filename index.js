const fs = require('fs');
const path = require('path');
const util = require('util');

// thanks to https://gist.github.com/kethinov/6658166#gistcomment-2774154
// [].flat only works in very recent browsers and servers: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      console.log('directory', path.join(dir, file));
      var odir = [];
      odir = walkSync(dirFile, dir.files);
      filelist.push(odir);
    } else {
      filelist.push(dirFile);
    }
  }
  filelist = filelist.flat();
  return filelist;
};

let files = walkSync('./imports');

// Filter out non-edl files
files = files.filter((f) => {
  const strArray = f.split("\.");
  return strArray[strArray.length - 1] === 'edl';
})

// Read each file so we can start messing with the numbers
files.map((m) => {
  fs.readFile(m, 'utf8', function (err, data) {
    if (err) throw err;

    const splitFileByLines = data.split(/\r\n|\r|\n/);

    const mp3AndTimecodes = splitFileByLines.reduce((col, item, i) => {
      const hit = Boolean(item.match(/.mp3/gi));
      if (hit) {
        col.push(splitFileByLines[i - 1])
        col.push(splitFileByLines[i])
      }
      return col;
    }, []);

    console.log(mp3AndTimecodes);
  });
})