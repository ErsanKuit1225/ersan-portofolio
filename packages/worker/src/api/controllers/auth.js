const authPkg = require("@budibase/auth")
const { google } = require("@budibase/auth/src/middleware")
const { clearCookie } = authPkg.utils
const { Cookies } = authPkg
const { passport } = authPkg.auth

exports.authenticate = async (ctx, next) => {
  return passport.authenticate("local", async (err, user) => {
    if (err) {
      return ctx.throw(403, "Unauthorized")
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + 1)

    if (!user) {
      return ctx.throw(403, "Unauthorized")
    }

    ctx.cookies.set(Cookies.Auth, user.token, {
      expires,
      path: "/",
      httpOnly: false,
      overwrite: true,
    })

    delete user.token

    ctx.body = { user }
  })(ctx, next)
}

exports.logout = async ctx => {
  clearCookie(ctx, Cookies.Auth)
  ctx.body = { message: "User logged out" }
}

exports.googlePreAuth = async (ctx, next) => {
  const strategy = await google.strategyFactory()

  return passport.authenticate(strategy, {
    scope: ["profile", "email"],
  })(ctx, next)
}

exports.googleAuth = async (ctx, next) => {
  const strategy = await google.strategyFactory()

  return passport.authenticate(
    strategy,
    { successRedirect: "/", failureRedirect: "/error" },
    async (err, user) => {
      if (err) {
        return ctx.throw(403, "Unauthorized")
      }

      const expires = new Date()
      expires.setDate(expires.getDate() + 1)

      if (!user) {
        return ctx.throw(403, "Unauthorized")
      }

      ctx.cookies.set(Cookies.Auth, user.token, {
        expires,
        path: "/",
        httpOnly: false,
        overwrite: true,
      })

      ctx.redirect("/")
    }
  )(ctx, next)
}
