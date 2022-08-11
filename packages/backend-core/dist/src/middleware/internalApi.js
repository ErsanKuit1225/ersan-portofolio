"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const env = require("../environment");
const { Headers } = require("../constants");
/**
 * API Key only endpoint.
 */
module.exports = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = ctx.request.headers[Headers.API_KEY];
    if (apiKey !== env.INTERNAL_API_KEY) {
        ctx.throw(403, "Unauthorized");
    }
    return next();
});
//# sourceMappingURL=internalApi.js.map