const fs = require('fs');
const path = require('path');

const exportDir = './generatedFiles';
const exportFile = 'edlJson';
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


const EDLToJsonReducer = (lineArray = []) => {
  return lineArray.reduce((col, item, i) => {
    const hit = Boolean(item.match(/.mp3/gi));
    if (hit) {
      let columns = lineArray[i - 1];
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
}

let files = walkSync(dir);

// Filter out non-edl files
files = files.filter((f) => {
  const strArray = f.split("\.");
  return strArray[strArray.length - 1] === 'edl';
})


const fileArray = files.map((m) => fs.readFileSync(m, 'utf8'));

const output = fileArray.reduce((col, item, i) => {
  const lineArray = item.split(/\r\n|\r|\n/gi);
  const data = EDLToJsonReducer(lineArray);
  col.data[i + 1] = data;
  return col
}, { data: {} });

console.log(output);

// make the directory if it has been deleted
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

fs.writeFile(`${exportDir}/${exportFile}`, JSON.stringify(output, null, '\t'), (err) => {
  if (err) throw err;
  console.log('Saved EDL to JSON file');
});