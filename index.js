const fs = require('fs');
const path = require('path');
const util = require('util');

const dir = './imports';
const VALID_SOUND_EXTENSIONS = /.mp3/gi;

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
  return filelist.flat();
};

return walkSync(dir)
  .filter((f) => { // Filter out non-edl files
    const strArray = f.split("\.");
    return strArray[strArray.length - 1] === 'edl';
  })
  .map((m) => { // Read each file so we can start messing with the numbers
    fs.readFile(m, 'utf8', function (err, data) {
      if (err) throw err;

      return data.split(/\r\n|\r|\n/) // split lines up
        .reduce((col, item, i) => {
          const hit = Boolean(item.match(VALID_SOUND_EXTENSIONS));
          if (hit) {
            let columns = splitFileByLines[i - 1];
            const index = item.lastIndexOf(" ") + 1;
            const fileName = item.substr(index);

            const startColumns = columns.indexOf(":") - 2;
            columns = columns.substr(startColumns).split(" ");
            col.push({
              columns: {
                sourceIn: columns[0],
                sourceOut: columns[1],
                recordIn: columns[2],
                recordOut: columns[3]
              },
              file: fileName
            });
          }
          return col;
        }, []);
    });
  })