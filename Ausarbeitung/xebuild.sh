#! /bin/bash


xelatex $1
xelatex $1
biber $1
xelatex $1
