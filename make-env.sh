#!/bin/bash
if [ ! -f ./.ENV ]; then
    echo "NODE_ENV=dev" >> ./.ENV
    echo "DB_HOST=127.0.0.1" >> ./.ENV
    echo "DB_PORT=3306" >> ./.ENV
    echo "DB_NAME=operationhope" >> ./.ENV
    echo "DB_USER=root" >> ./.ENV
    echo "DB_PASS=root" >> ./.ENV
else
    echo "oops, .ENV already exist. did nothing"
fi
