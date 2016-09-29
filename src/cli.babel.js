#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import meow from 'meow';
import glob from 'glob';
import mkdirp from 'mkdirp';

const {input} = meow();
const [projectName, command, category, slug] = input;

if (!projectName) {
  throw new Error('projectName was required');
}

if (!command) {
  throw new Error('command was required');
}

const wd = path.resolve(process.env.PWD);
const configFilePaths = glob.sync(`${wd}/**/site.config.*`);
const projectDirs = configFilePaths.map(filePath => {
  return path.dirname(filePath).split('/').reverse()[0];
});

const targetIdx = projectDirs.indexOf(projectName)
if (!~targetIdx) {
  throw new Error(`project ${projectName} don't found`);
}

const filePath = configFilePaths[targetIdx]
const {frontmatter} = require(filePath);
switch (command) {
  case 'new': {
    if (!category) {
      throw new Error('category was required');
    }

    if (!slug) {
      throw new Error('slug was required');
    }

    const dirPath = path.join(path.dirname(filePath), category, slug);
    mkdirp.sync(dirPath);
    const content = generateFrontmatter(frontmatter);
    const file = `${dirPath}/entry.md`
    try {
      fs.accessSync(file, (fs.constants ? fs.constants.F_OK : fs.F_OK));
      console.log(`
${file.replace(wd + '/', '')} was existed
      `);
    } catch (e) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`
${file.replace(wd + '/', '')} was created!
      `);
    }
  }
}

function generateFrontmatter(frontmatter) {
  let str = '---\n';
  for (const key in frontmatter) {
    const val = (() => {
      const target = frontmatter[key].default;
      return isFunction(target) ? target() : target;
    })();
    str += `${key}: ${val || ''}\n`;
  }
  str += '---\n';
  return str;
}

function isFunction(obj) {
 return obj && ({}).toString.call(obj) === '[object Function]';
}
