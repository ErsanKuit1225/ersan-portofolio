const core = require("@budibase/backend-core")
const { getScopedConfig } = require("@budibase/backend-core/db")
const { google } = require("@budibase/backend-core/middleware")
const { oidc } = require("@budibase/backend-core/middleware")
const { Configs, EmailTemplatePurpose } = require("../../../constants")
const { sendEmail, isEmailConfigured } = require("../../../utilities/email")
const {
  setCookie,
  getCookie,
  clearCookie,
  getGlobalUserByEmail,
  hash,
  platformLogout,
} = core.utils
const { Cookies, Headers } = core.constants
const { passport } = core.auth
const { checkResetPasswordCode } = require("../../../utilities/redis")
const {
  getGlobalDB,
  getTenantId,
  isMultiTenant,
} = require("@budibase/backend-core/tenancy")
const env = require("../../../environment")
import { users } from "@budibase/pro"

const ssoCallbackUrl = async (config: any, type: any) => {
  // incase there is a callback URL from before
  if (config && config.callbackURL) {
    return config.callbackURL
  }

  const db = getGlobalDB()
  const publicConfig = await getScopedConfig(db, {
    type: Configs.SETTINGS,
  })

  let callbackUrl = `/api/global/auth`
  if (isMultiTenant()) {
    callbackUrl += `/${getTenantId()}`
  }
  callbackUrl += `/${type}/callback`

  return `${publicConfig.platformUrl}${callbackUrl}`
}

export const googleCallbackUrl = async (config: any) => {
  return ssoCallbackUrl(config, "google")
}

export const oidcCallbackUrl = async (config: any) => {
  return ssoCallbackUrl(config, "oidc")
}

async function authInternal(ctx: any, user: any, err = null, info = null) {
  if (err) {
    console.error("Authentication error", err)
    return ctx.throw(403, info ? info : "Unauthorized")
  }

  if (!user) {
    return ctx.throw(403, info ? info : "Unauthorized")
  }

  // set a cookie for browser access
  setCookie(ctx, user.token, Cookies.Auth, { sign: false })
  // set the token in a header as well for APIs
  ctx.set(Headers.TOKEN, user.token)
  // get rid of any app cookies on login
  // have to check test because this breaks cypress
  if (!env.isTest()) {
    clearCookie(ctx, Cookies.CurrentApp)
  }
}

export const authenticate = async (ctx: any, next: any) => {
  return passport.authenticate(
    "local",
    async (err: any, user: any, info: any) => {
      await authInternal(ctx, user, err, info)
      ctx.status = 200
    }
  )(ctx, next)
}

export const setInitInfo = (ctx: any) => {
  const initInfo = ctx.request.body
  setCookie(ctx, initInfo, Cookies.Init)
  ctx.status = 200
}

export const getInitInfo = (ctx: any) => {
  ctx.body = getCookie(ctx, Cookies.Init) || {}
}

/**
 * Reset the user password, used as part of a forgotten password flow.
 */
export const reset = async (ctx: any) => {
  const { email } = ctx.request.body
  const configured = await isEmailConfigured()
  if (!configured) {
    ctx.throw(
      400,
      "Please contact your platform administrator, SMTP is not configured."
    )
  }
  try {
    const user = await getGlobalUserByEmail(email)
    // only if user exists, don't error though if they don't
    if (user) {
      await sendEmail(email, EmailTemplatePurpose.PASSWORD_RECOVERY, {
        user,
        subject: "{{ company }} platform password reset",
      })
    }
  } catch (err) {
    console.log(err)
    // don't throw any kind of error to the user, this might give away something
  }
  ctx.body = {
    message: "Please check your email for a reset link.",
  }
}

/**
 * Perform the user password update if the provided reset code is valid.
 */
export const resetUpdate = async (ctx: any) => {
  const { resetCode, password } = ctx.request.body
  try {
    const { userId } = await checkResetPasswordCode(resetCode)
    const db = getGlobalDB()
    const user = await db.get(userId)
    user.password = await hash(password)
    await db.put(user)
    ctx.body = {
      message: "password reset successfully.",
    }
  } catch (err) {
    ctx.throw(400, "Cannot reset password.")
  }
}

export const logout = async (ctx: any) => {
  if (ctx.user && ctx.user._id) {
    await platformLogout({ ctx, userId: ctx.user._id })
  }
  ctx.body = { message: "User logged out." }
}

export const datasourcePreAuth = async (ctx: any, next: any) => {
  const provider = ctx.params.provider
  const middleware = require(`@budibase/backend-core/middleware`)
  const handler = middleware.datasource[provider]

  setCookie(
    ctx,
    {
      provider,
      appId: ctx.query.appId,
      datasourceId: ctx.query.datasourceId,
    },
    Cookies.DatasourceAuth
  )

  return handler.preAuth(passport, ctx, next)
}

export const datasourceAuth = async (ctx: any, next: any) => {
  const authStateCookie = getCookie(ctx, Cookies.DatasourceAuth)
  const provider = authStateCookie.provider
  const middleware = require(`@budibase/backend-core/middleware`)
  const handler = middleware.datasource[provider]
  return handler.postAuth(passport, ctx, next)
}

/**
 * The initial call that google authentication makes to take you to the google login screen.
 * On a successful login, you will be redirected to the googleAuth callback route.
 */
export const googlePreAuth = async (ctx: any, next: any) => {
  const db = getGlobalDB()

  const config = await core.db.getScopedConfig(db, {
    type: Configs.GOOGLE,
    workspace: ctx.query.workspace,
  })
  let callbackUrl = await exports.googleCallbackUrl(config)
  const strategy = await google.strategyFactory(config, callbackUrl, users.save)

  return passport.authenticate(strategy, {
    scope: ["profile", "email"],
  })(ctx, next)
}

export const googleAuth = async (ctx: any, next: any) => {
  const db = getGlobalDB()

  const config = await core.db.getScopedConfig(db, {
    type: Configs.GOOGLE,
    workspace: ctx.query.workspace,
  })
  const callbackUrl = await exports.googleCallbackUrl(config)
  const strategy = await google.strategyFactory(config, callbackUrl, users.save)

  return passport.authenticate(
    strategy,
    { successRedirect: "/", failureRedirect: "/error" },
    async (err: any, user: any, info: any) => {
      await authInternal(ctx, user, err, info)

      ctx.redirect("/")
    }
  )(ctx, next)
}

async function oidcStrategyFactory(ctx: any, configId: any) {
  const db = getGlobalDB()
  const config = await core.db.getScopedConfig(db, {
    type: Configs.OIDC,
    group: ctx.query.group,
  })

  const chosenConfig = config.configs.filter((c: any) => c.uuid === configId)[0]
  let callbackUrl = await exports.oidcCallbackUrl(chosenConfig)

  return oidc.strategyFactory(chosenConfig, callbackUrl)
}

/**
 * The initial call that OIDC authentication makes to take you to the configured OIDC login screen.
 * On a successful login, you will be redirected to the oidcAuth callback route.
 */
export const oidcPreAuth = async (ctx: any, next: any) => {
  const { configId } = ctx.params
  const strategy = await oidcStrategyFactory(ctx, configId)

  setCookie(ctx, configId, Cookies.OIDC_CONFIG)

  return passport.authenticate(strategy, {
    // required 'openid' scope is added by oidc strategy factory
    scope: ["profile", "email"],
  })(ctx, next)
}

export const oidcAuth = async (ctx: any, next: any) => {
  const configId = getCookie(ctx, Cookies.OIDC_CONFIG)
  const strategy = await oidcStrategyFactory(ctx, configId)

  return passport.authenticate(
    strategy,
    { successRedirect: "/", failureRedirect: "/error" },
    async (err: any, user: any, info: any) => {
      await authInternal(ctx, user, err, info)

      ctx.redirect("/")
    }
  )(ctx, next)
}
