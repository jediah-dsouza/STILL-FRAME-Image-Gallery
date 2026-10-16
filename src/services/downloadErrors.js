const registration = {
  auth: 'Download registration is unavailable. Check the server configuration.',
  'rate-limit': 'The download request limit was reached. Wait before retrying.',
  network: 'Download registration could not be reached. Try again.',
  api: 'Download registration failed. Try again.',
}
export class DownloadError extends Error {
  constructor(stage, type = 'api') {
    super(stage === 'delivery'
      ? 'The download was registered, but file delivery could not start. Open the image to save it, or retry delivery.'
      : (Object.hasOwn(registration, type) ? registration[type] : registration.api))
    this.name = 'DownloadError'
    this.stage = stage
  }
}
