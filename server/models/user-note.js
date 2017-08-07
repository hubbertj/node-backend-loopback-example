'use strict';

module.exports = function (UserNote) {

    // set createdDate
    UserNote.observe('before save', (ctx, next) => {
        // console.log('wr before save');
        if (ctx.isNewInstance !== undefined && ctx.isNewInstance) {
            ctx.instance.created = new Date();
            ctx.instance.updated = ctx.instance.created;
        } else {
            if (ctx.instance) {
                ctx.instance.updated = new Date();
            } else {
                if (ctx.data.created) {
                    delete ctx.data.created;
                }
                ctx.data.updated = new Date();
            }
        }
        next();
    });

};
