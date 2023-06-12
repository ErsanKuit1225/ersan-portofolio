import crypto from "crypto"
import fs from "fs"
import zlib from "zlib"
import env from "../environment"
import { join } from "path"

const ALGO = "aes-256-ctr"
const SEPARATOR = "-"
const ITERATIONS = 10000
const RANDOM_BYTES = 16
const STRETCH_LENGTH = 32

export enum SecretOption {
  API = "api",
  ENCRYPTION = "encryption",
}

export function getSecret(secretOption: SecretOption): string {
  let secret, secretName
  switch (secretOption) {
    case SecretOption.ENCRYPTION:
      secret = env.ENCRYPTION_KEY
      secretName = "ENCRYPTION_KEY"
      break
    case SecretOption.API:
    default:
      secret = env.API_ENCRYPTION_KEY
      secretName = "API_ENCRYPTION_KEY"
      break
  }
  if (!secret) {
    throw new Error(`Secret "${secretName}" has not been set in environment.`)
  }
  return secret
}

function stretchString(string: string, salt: Buffer) {
  return crypto.pbkdf2Sync(string, salt, ITERATIONS, STRETCH_LENGTH, "sha512")
}

export function encrypt(
  input: string,
  secretOption: SecretOption = SecretOption.API
) {
  const salt = crypto.randomBytes(RANDOM_BYTES)
  const stretched = stretchString(getSecret(secretOption), salt)
  const cipher = crypto.createCipheriv(ALGO, stretched, salt)
  const base = cipher.update(input)
  const final = cipher.final()
  const encrypted = Buffer.concat([base, final]).toString("hex")
  return `${salt.toString("hex")}${SEPARATOR}${encrypted}`
}

export function decrypt(
  input: string,
  secretOption: SecretOption = SecretOption.API
) {
  const [salt, encrypted] = input.split(SEPARATOR)
  const saltBuffer = Buffer.from(salt, "hex")
  const stretched = stretchString(getSecret(secretOption), saltBuffer)
  const decipher = crypto.createDecipheriv(ALGO, stretched, saltBuffer)
  const base = decipher.update(Buffer.from(encrypted, "hex"))
  const final = decipher.final()
  return Buffer.concat([base, final]).toString()
}

export async function encryptFile(
  { dir, filename }: { dir: string; filename: string },
  secret: string
) {
  const outputFileName = `${filename}.enc`

  const filePath = join(dir, filename)
  const inputFile = fs.createReadStream(filePath)
  const outputFile = fs.createWriteStream(join(dir, outputFileName))

  const salt = crypto.randomBytes(RANDOM_BYTES)
  const stretched = stretchString(secret, salt)
  const cipher = crypto.createCipheriv(ALGO, stretched, salt)

  const encrypted = inputFile.pipe(cipher).pipe(zlib.createGzip())

  encrypted.pipe(outputFile)

  return new Promise<{ filename: string; dir: string }>(r => {
    outputFile.on("finish", () => {
      r({
        filename: outputFileName,
        dir,
      })
    })
  })
}
