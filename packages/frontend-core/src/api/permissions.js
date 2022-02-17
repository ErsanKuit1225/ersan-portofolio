export const buildPermissionsEndpoints = API => ({
  /**
   * Gets the permission required to access a specific resource
   * @param resourceId the resource ID to check
   */
  getPermissionForResource: async resourceId => {
    return await API.get({
      url: `/api/permission/${resourceId}`,
    })
  },

  /**
   * Updates the permissions for a certain resource
   * @param resourceId the ID of the resource to update
   * @param roleId the ID of the role to update the permissions of
   * @param level the level to assign the role for this resource
   * @return {Promise<*>}
   */
  updatePermissionForResource: async ({ resourceId, roleId, level }) => {
    return await API.post({
      url: `/api/permission/${roleId}/${resourceId}/${level}`,
    })
  },
})
