export const buildSystemLogsEndpoints = API => ({
  /**
   * Gets a stream for the system logs.
   */
  getSystemLogs: async () => {
    return await API.get({
      url: "/api/global/system/logs",
      json: false,
      parseResponse: async response => {
        return response
      },
    })
  },
})
