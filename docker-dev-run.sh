# runs the operation-hope-api mounting the local /app source and using nodemon instead of node by itself
# --rm flag maske sure the image is deleted when its stops
docker run -p=3000:3000 --rm -i --name operation-hope-api --env-file ./.ENV -v $PWD/server/:/usr/src/app/server/ operation-hope-api nodemon .
