'use strict';

var AWS = require('aws-sdk');
var aws = require('aws-sdk/clients/s3');
var s3MulterStorage = require('multer-storage-s3');

var async = require('async');
var crypto = require('crypto');
var util = require('util');
var salt = 'secret-cat';
var algorithm = 'aes-256-ctr';
var multer = require('multer');

var _encrypt = function(text) {
    var cipher = crypto.createCipher(algorithm, salt)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

var _decrypt = function(text) {
    var decipher = crypto.createDecipher(algorithm, salt)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

/**
 *  Converts model name to AWS name.
 * 
 * @param  {String}  Type The model name
 * @return {String}  The name of the content folder.
 */
var _getTypeName = function(type) {
    switch (type) {
        case 'Lesson':
            type = 'lessons';
            break;
        case 'Activity':
            type = 'activities';
            break;
        case 'Video':
            type = 'videos';
            break;
        case 'Assessment':
            type = 'assessments';
            break;
        case 'Chapter':
            type = 'chapters';
            break;
        default:
            type = null;
            break;
    }
    return type;
}

module.exports = function(Upload) {

    Upload.generateHash = function(userId, folderId) {
        return new Promise(function(reslove, reject) {
            var hash = userId + salt + folderId + salt + new Date().getTime();
            return reslove(_encrypt(hash));
        });
    };

    /**
     * Moves image to the correct content location
     * 
     * @param  {String}     Name of model name
     * @param  {int} id     Records id
     * @param  {obj} req    req object
     * @param  {obj} res    res object
     * @return {promise}    Just a promise
     */
    Upload.uploadHeroImage = function(name, id, req, res) {
        const MAX_FILE_UPLOAD = 20;
        var uploadedFiles = [];
        var awsConfigs = Upload.app.get('aws');
        var s3Bucket = Upload.app.get(Upload.app.get('env')).s3.buckets.content;
        var options = util._extend(awsConfigs, s3Bucket);
        AWS.config.update(awsConfigs);
        return new Promise(function(reslove, reject) {
            var type = 'curriculums';
            //create the storage
            var storage = s3MulterStorage({
                destination: function(req, file, cb) {
                    uploadedFiles.push('https://s3-' + s3Bucket.region +
                        '.amazonaws.com/' + s3Bucket.name +
                        '/' + type + '/' + id + '/' + 'hero-images/' + file.originalname);
                    cb(null, type + '/' + id + '/' + 'hero-images');
                },
                filename: function(req, file, cb) {
                    cb(null, file.originalname);
                },
                bucket: s3Bucket.name,
                region: s3Bucket.region
            });

            var uploadMiddleware = multer({ storage: storage }).array('file', MAX_FILE_UPLOAD);

            //uploads the files
            uploadMiddleware(req, res, function(error, data) {
                if (error) {
                    return reject(error);
                }
                return reslove(uploadedFiles);
            });
        });
    };

    /**
     * As the name states it removed the file by its key.
     * @param  {string} key   The path of the file or its AWS key.
     * @return {promise}      Just a promise
     */
    Upload.removeFileByKey = function(modelName, key) {
        var s3Bucket = Upload.app.get(Upload.app.get('env')).s3.buckets.content;
        var s3 = new aws({
            apiVersion: '2006-03-01',
            region: s3Bucket.region,
            credentials: Upload.app.get('aws')
        });

        return new Promise(function(reslove, reject) {

            var params = {
                Bucket: s3Bucket.name,
                Key: key
            }

            s3.deleteObject(params, function(err, data) {
                if (err) {
                    return reject("Error failed to remove file with error: ", err);
                } else {
                    return reslove(data);
                }
            });
        });
    };

    /**
     * Moves language files to the correct content location
     * 
     * @param  {String}     Name of model name
     * @param  {int} id     Records id
     * @param  {obj} req    req object
     * @param  {obj} res    res object
     * @return {promise}    Just a promise
     */
    Upload.uploadLanguageFiles = function(name, id, req, res) {
        const MAX_FILE_UPLOAD = 20;
        var uploadedFiles = [];

        var awsConfigs = Upload.app.get('aws');
        var s3Bucket = Upload.app.get(Upload.app.get('env')).s3.buckets.content;
        var options = util._extend(awsConfigs, s3Bucket);
        AWS.config.update(awsConfigs);

        return new Promise(function(reslove, reject) {
            var type = _getTypeName(name);

            switch (type) {
                case 'lessons':
                    //create the storage
                    var storage = s3MulterStorage({
                        destination: function(req, file, cb) {
                            uploadedFiles.push(type + '/' + id + '/' + 'language/' + file.originalname);
                            cb(null, type + '/' + id + '/' + 'language');
                        },
                        filename: function(req, file, cb) {
                            cb(null, file.originalname);
                        },
                        bucket: s3Bucket.name,
                        region: s3Bucket.region
                    });

                    var uploadMiddleware = multer({ storage: storage }).array('file', MAX_FILE_UPLOAD);

                    //uploads the files
                    uploadMiddleware(req, res, function(error, data) {
                        if (error) {
                            return reject(error);
                        }
                        return reslove(uploadedFiles);
                    });
                    break;
                case 'activities':
                    return reject("Activities Not supported!");
                    break;
                case 'videos':
                    return reject("Videos Not supported!");
                    break;
                case 'assessments':
                    return reject("Assessments Not supported!");
                    break;
                default:
                    return reject("Not supported!");
                    break;
            }
        });
    };

    /**
     * Can be used to just upload a file to a certain dir in AWS content folder.
     * @param  {string} location The key or location you want the file stored in.
     * @param  {object} req      Request object
     * @param  {object} res      Respond object
     * @return {promise}         Just a promise
     */
    Upload.simpleFileUpload = function(location, req, res) {
        const MAX_FILE_UPLOAD = 20;
        var uploadedFiles = [];

        var awsConfigs = Upload.app.get('aws');
        var s3Bucket = Upload.app.get(Upload.app.get('env')).s3.buckets.content;
        var options = util._extend(awsConfigs, s3Bucket);
        var urlPrefix = 'https://s3-' + options.region + '.amazonaws.com/' + options.name + '/';
        AWS.config.update(awsConfigs);
        return new Promise(function(reslove, reject) {
            //create the storage
            var storage = s3MulterStorage({
                destination: function(req, file, cb) {
                    uploadedFiles.push(urlPrefix + location + '/' + file.originalname);
                    cb(null, location);
                },
                filename: function(req, file, cb) {
                    cb(null, file.originalname);
                },
                bucket: s3Bucket.name,
                region: s3Bucket.region
            });

            var uploadMiddleware = multer({ storage: storage }).array('file', MAX_FILE_UPLOAD);

            //uploads the files
            uploadMiddleware(req, res, function(error, data) {
                if (error) {
                    return reject(error);
                }
                return reslove(uploadedFiles);
            });
        });
    };


    Upload.createFolder = function(id, dir, type) {
        var s3Bucket = Upload.app.get(Upload.app.get('env')).s3.buckets.content;
        var s3 = new aws({
            apiVersion: '2006-03-01',
            region: s3Bucket.region,
            credentials: Upload.app.get('aws')
        });

        if (dir.charAt(0) == "/") {
            dir = dir.substr(1) + '/';
        } else {
            dir = dir + '/';
        }

        return new Promise(function(reslove, reject) {
            type = _getTypeName(type);

            if (!type) {
                return reject("Type not found!");
            } else if (!s3Bucket) {
                return reject("Failed to find bucket");
            }

            s3.putObject({
                Bucket: s3Bucket.name,
                Key: type + '/' + id + '/' + dir,
                ACL: 'public-read',
                Body: ''
            }, function(err, data) {
                if (err) {
                    return reject("Error creating the folder: ", err);
                } else {
                    return reslove(data);
                }
            });
        });
    }

    Upload.deleteFolder = function(id, dir, type) {
        var s3Bucket = Upload.app.get(Upload.app.get('env')).s3.buckets.content;
        var ext = dir.substr(dir.lastIndexOf('.') + 1);
        var nDir = '';
        var s3 = new aws({
            apiVersion: '2006-03-01',
            region: s3Bucket.region,
            credentials: Upload.app.get('aws')
        });

        if (dir.charAt(0) == "/") {
            nDir = dir.substr(1);
        }

        if (!ext || ext == dir) {
            nDir = nDir + '/';
        }


        return new Promise(function(reslove, reject) {
            type = _getTypeName(type);

            if (!type) {
                return reject("Type not found!");
            } else if (!s3Bucket) {
                return reject("Failed to find bucket");
            }

            var params = {
                Bucket: s3Bucket.name,
                Key: type + '/' + id + '/' + nDir
            }

            s3.deleteObject(params, function(err, data) {
                if (err) {
                    return reject("Error creating the folder: ", err);
                } else {
                    return reslove(data);
                }
            });
        });
    };

    /**
     * Creates the folder for the content and pushes the defaults into folder.
     * @param  {String} type    What type of folder will be created
     * @param  {int}    id      The Id of the content
     * @return {String}         The name of the directory which all files were saved too
     */
    Upload.initFolder = function(type, id) {
        var s3cdnBucket = Upload.app.get("cdn").bucket;
        var s3Buckets = Upload.app.get(Upload.app.get('env')).s3.buckets;
        var aws = Upload.app.get('aws');
        var options = util._extend(aws, s3Buckets.upload);
        var urlPrefix = 'https://s3-' + s3Buckets.content.region + '.amazonaws.com/';
        AWS.config.update(aws);

        return new Promise(function(reslove, reject) {
            var s3 = new AWS.S3({ params: { Bucket: s3cdnBucket.name }, region: s3cdnBucket.region });
            var modelName = _getTypeName(type);
            var prefix = "defaults/" + modelName;

            if (!modelName) {
                return reject("Type not found!");
            } else if (!s3Buckets) {
                return reject("Failed to find bucket");
            }

            if (typeof "undefined" === id || id == null) {
                return reject("Id not provided!");
            }

            s3.listObjects({ Prefix: prefix }, function(err, data) {
                if (err) {
                    return reject(err.message);

                } else if (data && data.Contents.length) {
                    async.each(data.Contents, function(file, cb) {
                        var aPrefix = file.Key.replace(prefix + '/', '');
                        var params = {
                            Bucket: s3Buckets.content.name + '/' + modelName + '/' + id,
                            Key: aPrefix,
                            CopySource: encodeURIComponent(s3cdnBucket.name + '/' + file.Key),
                            MetadataDirective: 'COPY'
                        };
                        s3.copyObject(params, function(copyErr, copyData) {
                            if (copyErr) {
                                console.log('Error: ' + copyErr.message);
                            } else {
                                cb();
                            }
                        });

                    }, function(err, data) {
                        if (err) console.log(err);
                    });
                }
            });
            return reslove(urlPrefix + s3Buckets.content.name + '/' + modelName + '/' + id);
        });
    };

    Upload.afterUpload = function(hash, type, userId) {
        var s3Buckets = Upload.app.get(Upload.app.get('env')).s3.buckets;
        var aws = Upload.app.get('aws');
        var options = util._extend(aws, s3Buckets.upload);


        var dataArr = _decrypt(hash).split(salt);
        var userId = dataArr[0];
        var folderId = dataArr[1];
        var timeStamp = dataArr[2];

        //sets our aws configs;
        AWS.config.update(aws);

        //move files to the correct folder;
        return new Promise(function(reslove, reject) {

            type = _getTypeName(type);

            if (!type) {
                return reject("Type not found!");
            } else if (!s3Buckets) {
                return reject("Failed to find bucket");
            }

            var s3 = new AWS.S3({ params: { Bucket: s3Buckets.upload.name }, region: s3Buckets.upload.region });

            s3.listObjects({ Prefix: hash }, function(err, data) {

                if (err) {
                    return reject(err.message);

                } else if (data && data.Contents.length) {
                    async.each(data.Contents, function(file, cb) {
                        var prefix = file.Key.replace(hash + '/', '');
                        var params = {
                            Bucket: s3Buckets.content.name + '/' + type + '/' + folderId,
                            Key: prefix,
                            CopySource: encodeURIComponent(s3Buckets.upload.name + '/' + file.Key),
                            MetadataDirective: 'COPY'
                        };

                        s3.copyObject(params, function(copyErr, copyData) {
                            if (copyErr) {
                                console.log('Error: ' + err);
                            } else {
                                cb();
                            }
                        });

                    }, function(err, data) {
                        if (err) console.log(err);
                    });
                }
            });


            return reslove(hash);
        });
    };

};
