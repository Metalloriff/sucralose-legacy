# Sucralose!
### A sweeter way to use e621.net.

#
## Note, this was my second React site, so the source may contain a lot of things that will make you go "why!?"
## I'm slowly improving the source as I update things, but I'm working on other, bigger projects and don't have a lot of time.

## What is it?
Sucralose is a humble front-end replacement for https://e621.net, using their API/back-end.

The goal is to provide a smoother, more user-friendly and mobile-friendly experience,
along with a little extra customization.

## Why?
I've always found e621 to have an outdated and lacking UX.

Managing sets is a disaster, you have to visit posts to vote/favorite them, UI feels clunky, etc.

And also, I just enjoy making things, and e621 provides a pretty good and easy-to-understand API.

## GitHub Pages
You can visit the site at https://metalloriff.github.io/sucralose/#/.

## Known Issues
There are a few known issues currently, if you know how to fix any of these, please contact me or PR.
* <b>Inability to remove favorites</b>
    * e621's API does not seem to let me remove from the favorites list. I'm sure this is an error on my side,
      but I was unable to find a solution.
* <b>The search bar randomly gets stuck in its "opened" state</b>
    * This is likely a very easy fix, but hasn't been enough of a problem to look into.
    * Basically, I'm lazy.

## Installing
If you wish to fork or download this repo, simply run `npm i` to install its dependencies,
and `npm start` to start the development environment.