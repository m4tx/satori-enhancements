satori-enhancements
===================
_a.k.a. Satori Premium_

satori-enhancements is a WebExtension built for Jagiellonian University's
[Satori Online Judge](https://satori.tcs.uj.edu.pl) website. The main goal is
to improve usability, ease of use and add some useful features, that should
have been there since the beginning (but for some reason, they aren't).

## Features
* Ability to sort ranking tables by given column
* Auto-refreshing results page and notifying about problem status changes
* Removing UI clutter and replacing some image assets (e.g. Satori Premium logo)
* Adding tab-order in forms for quicker navigation
* Fixing table columns' positions whenever it makes sense (e.g. ranking)
* Ability to hide particular problems and remembering hidden problem groups
* Auto-redirect to the recent contest, auto-redirect after a submit

## Building
First, make sure you have git and [npm](https://nodejs.org/) installed. Then:
```
$ git clone https://github.com/m4tx/satori-enhancements.git
$ cd satori-enhancements
$ npm install
```
`npm install` will automatically execute `gulp`, which will create `dist/`
directory with all necessary files, that can be used to pack or load extension
inside Chrome. Executing `gulp compress` (assuming you have gulp installed
globally) can also be used to put these files inside a zip package (inside
`bin/`) which can be sent to the AMO or Chrome Web Store Developer Dashboard.
See `gulpfile.js` for more gulp tasks.

## Download
* [Chrome Web Store](https://chrome.google.com/webstore/detail/satori-enhancements/oghiinfmhnkmfecckbpcoieaieobblog)
