const Router = require("@koa/router")
const controller = require("../../controllers/public/tables")

const router = Router()

/**
 * @openapi
 * /tables/search:
 *   post:
 *     summary: Search internal and external tables based on their name.
 *     tags:
 *       - tables
 *     parameters:
 *       - $ref: '#/components/parameters/appId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the table, this is a case insensitive search using the provided
 *                   name as a starts with search.
 *     responses:
 *       200:
 *         description: Returns the found tables, based on the search parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/table'
 *             examples:
 *               tables:
 *                 $ref: '#/components/examples/tables'
 */
router.post("/tables/search", controller.search)

/**
 * @openapi
 * /tables:
 *   post:
 *     summary: Create a new table.
 *     tags:
 *       - tables
 *     parameters:
 *       - $ref: '#/components/parameters/appId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/table'
 *           examples:
 *             table:
 *               $ref: '#/components/examples/table'
 *     responses:
 *       200:
 *         description: Returns the created table, including the ID which has been generated for it. This can be
 *           internal or external data sources.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/tableOutput'
 *             examples:
 *               table:
 *                 $ref: '#/components/examples/table'
 */
router.post("/tables", controller.create)

/**
 * @openapi
 * /tables/:tableId:
 *   put:
 *     summary: Update the specified table. This can be for internal or external tables.
 *     tags:
 *       - tables
 *     parameters:
 *       - $ref: '#/components/parameters/tableId'
 *       - $ref: '#/components/parameters/appId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/table'
 *           examples:
 *             table:
 *               $ref: '#/components/examples/table'
 *     responses:
 *       200:
 *         description: Returns the updated table.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/tableOutput'
 *             examples:
 *               table:
 *                 $ref: '#/components/examples/table'
 */
router.put("/tables/:tableId", controller.update)

/**
 * @openapi
 * /tables/{tableId}:
 *   delete:
 *     summary: Delete a single table and all of its data.
 *     tags:
 *       - tables
 *     parameters:
 *       - $ref: '#/components/parameters/tableId'
 *       - $ref: '#/components/parameters/appId'
 *     responses:
 *       200:
 *         description: Returns the deleted table.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/tableOutput'
 *             examples:
 *               table:
 *                 $ref: '#/components/examples/table'
 */
router.delete("/tables/:tableId", controller.delete)

/**
 * @openapi
 * /tables/{tableId}:
 *   get:
 *     summary: Gets a single table by its ID.
 *     tags:
 *       - tables
 *     parameters:
 *       - $ref: '#/components/parameters/tableId'
 *       - $ref: '#/components/parameters/appId'
 *     responses:
 *       200:
 *         description: Returns the retrieved table.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/tableOutput'
 *             examples:
 *               table:
 *                 $ref: '#/components/examples/table'
 */
router.get("/tables/:tableId", controller.read)

module.exports = router
