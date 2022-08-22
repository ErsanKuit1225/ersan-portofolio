import { ObjectStoreBuckets } from "../../constants"
import { extractPluginTarball } from "../../utilities/fileSystem"
import { getGlobalDB } from "@budibase/backend-core/tenancy"
import { generatePluginID, getPluginParams } from "../../db/utils"
import { uploadDirectory } from "@budibase/backend-core/objectStore"
import { PluginType, FileType } from "@budibase/types"
import { ClientAppSocket } from "../../app"

export async function getPlugins(type?: PluginType) {
  const db = getGlobalDB()
  const response = await db.allDocs(
    getPluginParams(null, {
      include_docs: true,
    })
  )
  const plugins = response.rows.map((row: any) => row.doc)
  if (type) {
    return plugins.filter((plugin: any) => plugin.schema?.type === type)
  } else {
    return plugins
  }
}

export async function upload(ctx: any) {
  const plugins: FileType[] =
    ctx.request.files.file.length > 1
      ? Array.from(ctx.request.files.file)
      : [ctx.request.files.file]
  try {
    let docs = []
    // can do single or multiple plugins
    for (let plugin of plugins) {
      const doc = await processPlugin(plugin)
      docs.push(doc)
    }
    ctx.body = {
      message: "Plugin(s) uploaded successfully",
      plugins: docs,
    }
  } catch (err: any) {
    const errMsg = err?.message ? err?.message : err
    ctx.throw(400, `Failed to import plugin: ${errMsg}`)
  }
}

export async function fetch(ctx: any) {
  ctx.body = await getPlugins()
}

export async function destroy(ctx: any) {}

export async function processPlugin(plugin: FileType) {
  const db = getGlobalDB()
  const { metadata, directory } = await extractPluginTarball(plugin)
  const version = metadata.package.version,
    name = metadata.package.name,
    description = metadata.package.description,
    hash = metadata.schema.hash

  // first open the tarball into tmp directory
  const bucketPath = `${name}/${version}/`
  const files = await uploadDirectory(
    ObjectStoreBuckets.PLUGINS,
    directory,
    bucketPath
  )
  const jsFile = files.find((file: any) => file.name.endsWith(".js"))
  if (!jsFile) {
    throw new Error(`Plugin missing .js file.`)
  }
  const jsFileName = jsFile.name
  const pluginId = generatePluginID(name, version)

  // overwrite existing docs entirely if they exist
  let rev
  try {
    const existing = await db.get(pluginId)
    rev = existing._rev
  } catch (err) {
    rev = undefined
  }
  const doc = {
    _id: pluginId,
    _rev: rev,
    name,
    version,
    hash,
    description,
    ...metadata,
    jsUrl: `${bucketPath}${jsFileName}`,
  }
  const response = await db.put(doc)
  ClientAppSocket.emit("plugin-update", { name, hash })
  return {
    ...doc,
    _rev: response.rev,
  }
}
