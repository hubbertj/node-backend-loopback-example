'use strict';

module.exports = function (Assessmentscore) {
    // set createdDate
    Assessmentscore.observe('before save', (ctx, next) => {
        // console.log('wr before save');
        if (ctx.isNewInstance !== undefined && ctx.isNewInstance) {
            ctx.instance.created = new Date();

            // {"score":40,"maxScore":100,"data":[{"q":1,"a":0,"aString":"No"},{"q":2,"a":1,"aString":"Yes"},{"q":3,"a":3,"aString":"Some times"},{"q":4,"a":0,"aString":"Never"}],"assessmentId":1}

            // {"created":"2017-03-29T00:32:22.744Z","scoreType":"Start","ownerId":19}
            // ctx: {"instance":{"created":"2017-03-29T00:43:31.228Z","maxScore":100,"score":40,"scoreType":"Start","data":[{"q":"1","a":"0","aString":"No"},{"q":"2","a":"1","aString":"Yes"},{"q":"3","a":"3","aString":"Some times"},{"q":"4","a":"0","aString":"Never"}],"assessmentId":1,"ownerId":19},"isNewInstance":true,"hookState":{},"options":{}}

            // find out if there is an existing assessment score
            if (ctx.instance.assessmentId && ctx.instance.ownerId) {
                Assessmentscore.findOne({
                    where: {
                        and: [{
                            assessmentId: ctx.instance.assessmentId
                        }, {
                            ownerId: ctx.instance.ownerId
                        }]
                    }
                })
                    .then(result => {

                        // we have a result, then the new instance cant be scoreType Start
                        if (result)
                            ctx.instance.scoreType = 'Exit'

                        next();
                    })
                    .catch(error => {
                        next(error);
                    })
            } else { //  if (ctx.instance.assessmentId && ctx.instance.ownerId)
                next();
            }
        } else { // if (ctx.isNewInstance !== undefined && ctx.isNewInstance)
            next();
        }

        console.log(JSON.stringify(ctx));


    });

};
