'use strict';

module.exports = function(HeroImage) {


    /**
     * Uploads a image and places it within the correct location in 
     * our content bucket, then return the updated HeroImage
     * 
     * @param  {int}   		heroImageId The id of the heroImage we want to update
     * @param  {request}   	req         The request object
     * @param  {Function} 	cb          Our callback
     * @return {heroImage}  HeroImage   A heroImage object.    
     */
    HeroImage.upload = function(heroImageId, req, res, cb) {
        var Models = HeroImage.app.models;
        var heroImage = null;
        HeroImage.findById(heroImageId)
            .then(function(aheroImage) {
                heroImage = aheroImage;
                return Models.Upload.uploadHeroImage(HeroImage.definition.name, aheroImage.curriculumId, req, res);
            }).then(function(fileUrls) {
                heroImage.imageUrl = fileUrls[0];
                return heroImage.save();
            }).then(function(heroImages) {
                cb(null, heroImages);
            }).catch(function(error) {
                cb(error);
            });
    };

    HeroImage.remoteMethod('upload', {
        description: "Uploads a image and places it within the correct location",
        http: {
            path: '/:id/upload',
            verb: 'put',
            status: 200,
            parse: 'form',
            errorStatus: 422
        },
        accepts: [{ arg: 'id', type: 'number', required: true },
            { arg: 'req', type: 'object', 'http': { source: 'req' } },
            { arg: 'res', type: 'object', 'http': { source: 'res' } }
        ],
        returns: [{ arg: 'HeroImages', type: 'HeroImage', root: true }]
    });
};
