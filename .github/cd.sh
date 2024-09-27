#!/bin/sh

directory = "~/quiz_backend"
repo = "git@github.com:developersTestnTrack/quiz_backend.git"

pull_repo() {
    git pull origin production
    git status
    npm install
}

if [ -d $directory]
then
    cd $directory
    pull_repo
else 
    git clone $repo
    cd $directory
    pull_repo
