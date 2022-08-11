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
const { Cookies } = require("../../constants");
const env = require("../../environment");
const { authError } = require("./utils");
exports.options = {
    secretOrKey: env.JWT_SECRET,
    jwtFromRequest: function (ctx) {
        return ctx.cookies.get(Cookies.Auth);
    },
};
exports.authenticate = function (jwt, done) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return done(null, jwt);
        }
        catch (err) {
            return authError(done, "JWT invalid", err);
        }
    });
};
//# sourceMappingURL=jwt.js.map