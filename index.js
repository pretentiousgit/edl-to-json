const fs = require('fs');
const path = require('path');

const exportDir = './generatedFiles';
const exportFile = 'edlJson';
const dir = './imports';
const VALID_SOUND_EXTENSIONS = /.mp3/gi;

const moment = require('moment');
const momentFormat = 'HH:mm:ss.SS'


function replaceAt(target, index, replacement) {
  return target.substr(0, index) + replacement + target.substr(index + replacement.length);
}
// thanks to https://gist.github.com/kethinov/6658166#gistcomment-2774154
// [].flat only works in very recent browsers and servers: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
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
    const hit = Boolean(item.match(VALID_SOUND_EXTENSIONS));
    if (hit) {
      let columns = lineArray[i - 1];
      const index = item.lastIndexOf(" ") + 1;
      const fileName = item.substr(index);

      const startColumns = columns.indexOf(":") - 2;
      columns = columns.substr(startColumns).split(" ");
      columns = columns.map((m) => {
        const lastIndex = m.lastIndexOf(":");
        m = replaceAt(m, lastIndex, '.');
        return m;
      })
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

function returnDuration(srcOut, srcIn) {
  const dur = moment.duration(srcOut.diff(srcIn));
  const seconds = dur.seconds();
  const milliseconds = dur.milliseconds();
  return seconds + milliseconds / 1000;
}
// Now let's find the duration and when to turn things on and off
const data = Object.keys(output.data).map((m) => {
  return output.data[m].map((n) => {
    console.log('CHECK N', n);
    const sourceOut = moment(n.columns.sourceOut, "HH:mm:ss.SS");
    const sourceIn = moment(n.columns.sourceIn, "HH:mm:ss.SS");

    const recOut = moment(n.columns.recordOut, "HH:mm:ss.SS");
    const recIn = moment(n.columns.recordIn, "HH:mm:ss.SS");

    n.duration = returnDuration(sourceOut, sourceIn);
    n.videoDuration = returnDuration(recOut, recIn);

    const lengthMatch = Boolean(n.duration == n.videoDuration);
    // if we consistently get non-matching video lengths,
    // we should figure out how to adjust them next to the tape automatically - closer or further out

    n.videoInject = Number(recIn.format("s.SS"));
    return n;
  })
})

console.log(data);

// make the directory if it has been deleted
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

fs.writeFile(`${exportDir}/${exportFile}`, JSON.stringify(data, null, '\t'), (err) => {
  if (err) throw err;
  console.log('Saved EDL to JSON file');
});
