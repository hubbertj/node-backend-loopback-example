# Operation Hope BaaS

### getting started ###

1. build your .ENV file
```sh
./make-env.sh
```
2. update .ENV
```Note
Note
if your MySQL is runing in a container the host address needs to be your machines network IP ex: 192.168.10.xx
use `ifconfig` en0 interface's IP
```

3. build the docker image
```sh
./docker-build-image.sh
```

4. start the service in development mode
```sh
./docker-dev-run.sh
```

200 – OK – Everything is working
201 – OK – New resource has been created
204 – OK – The resource was successfully deleted
304 – Not Modified – The client can use cached data
400 – Bad Request – The request was invalid or cannot be served. The exact error should be explained in the error payload. E.g. „The JSON is not valid“
401 – Unauthorized – The request requires an user authentication
403 – Forbidden – The server understood the request, but is refusing it or the access is not allowed.
404 – Not found – There is no resource behind the URI.
422 – Unprocessable Entity – Should be used if the server cannot process the entity, e.g. if an image cannot be formatted or mandatory fields are missing in the payload.
500 – Internal Server Error – API developers should avoid this error. If an error occurs in the global catch blog, the stracktrace should be logged and not returned as response.

