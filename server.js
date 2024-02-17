const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const { body, validationResult } = require("express-validator");

const app = express();
const port = 3000;

const options = {
  swaggerDefinition: {
    info: {
      title: "Express API with Swagger",
      description:
        "This is a  CRUD API application made with Express Mariadb and documented with Swagger",
      contact: {
        name: "Swagger",
        url: "https://swagger.io",
        email: "pvenkat6@uncc.edu",
      },
      servers: ["http://localhost:3000"],
    },
  },
  apis: ["server.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Sanitization middleware
const sanitizeTodo = [
  body("task").trim().escape(),
  body("completed").toBoolean(),
];

const mariadb = require("mariadb");
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sample",
  port: 3306,
  connectionLimit: 5,
});

// Define sanitization, validation, and transformation middleware
const sanitizeCustomer = [
    body('customerCode').trim().escape(),
    body('customerName').trim().escape(),
    body('customerCity').trim().escape(),
    body('workingArea').trim().escape(),
    body('customerCountry').trim().escape(),
    body('grade').trim().escape(),
    body('agentCode').trim().escape(),
    body('completed').toBoolean() // Transform completed to boolean
];

// Validation middleware
const validateCustomer = [
    body('customerCode').notEmpty().withMessage('Customer code is required'),
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('customerCity').notEmpty().withMessage('Customer city is required'),
    body('workingArea').notEmpty().withMessage('Working area is required'),
    body('customerCountry').notEmpty().withMessage('Customer country is required'),
    body('grade').notEmpty().withMessage('Grade is required'),
    body('agentCode').notEmpty().withMessage('Agent code is required')
];


/**
 * @swagger
 * /getCustomers:
 *   get:
 *     summary: Retrieves customers
 *     description: Retrieves all customers from the database.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Customer'
 *       500:
 *         description: Internal server error
 */
app.get("/getCustomers", (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * FROM customer")
        .then((rows) => {
          res.json(rows);
          conn.end();
        })
        .catch((err) => {
          console.log(err);
          conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

/**
 * Post Customer by country
 */

// Define the Customer schema
/**
 * @swagger
 * definitions:
 *   Customer:
 *     type: object
 *     properties:
 *       customerName:
 *         type: string
 *         example: John Doe
 *       customerCountry:
 *         type: string
 *         example: USA
 */


/**
 * @swagger
 * /getCustomersByCountry:
 *   post:
 *     summary: Retrieves customers by country
 *     description: Retrieves customers from the database based on the provided country.
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Country parameter
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               example: USA
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Customer'
 *       500:
 *         description: Internal server error
 */
app.post("/getCustomersByCountry",sanitizeCustomer,validateCustomer, (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      //res.setHeader('Access-Control-Allow-Origin', '*');

       
    const country = req.body.country;
    
    conn.query("SELECT * FROM customer WHERE CUST_COUNTRY=?", [country]) // Pass country as a parameter
    .then((rows) => {
            res.json(rows);
            conn.end();
        })
        .catch((err) => {
            console.log(err);
            conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});


/**
 * @swagger
 * /deleteCustomer:
 *   delete:
 *     summary: Deletes a customer by Customer code
 *     description: Deletes a customer from the database based on the provided Customer code.
 *     parameters:
 *       - in: query
 *         name: customerCode
 *         description: Customer code of the customer to delete
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
app.delete('/deleteCustomer', (req, res) => {
    const customerCode = req.query.customerCode;
    if (!customerCode) {
        res.status(400).json({ error: "Customer Code is required" });
        return;
    }

    pool
    .getConnection()
    .then((conn) => {
        conn
            .query("DELETE FROM customer where CUST_CODE=?", [customerCode])
            .then((rows) => {
                res.status(200).json({ message: "Customer deleted successfully" })
                conn.end();
            })
            .catch((err) => {
                res.status(500).json({ error: "Internal server error" })
            conn.end();
            });
    });
});




// Define validation and sanitization rules
const updateCustomerValidationRules = [
    body("customerName").trim().notEmpty(),
    body("customerCity").trim().notEmpty(),
    body("customerCountry").trim().notEmpty(),
    body("customerCode").trim().notEmpty()
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * @swagger
 * /updateCustomer:
 *   patch:
 *     summary: Partially updates a customer by Code
 *     description: Partially updates a customer in the database based on the provided customer code.
 *     parameters:
 *       - in: query
 *         name: customerCode
 *         description: Customer code of the customer to update
 *         required: true
 *         type: string
 *       - in: body
 *         name: body
 *         description: Fields to update for the customer
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             customerName:
 *               type: string
 *             customerCity:
 *              type: string
 *             customerCountry:
 *               type: string
 *             customerCode:
 *               type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */

app.patch('/updateCustomer', updateCustomerValidationRules, handleValidationErrors, (req, res) => {
    const customerCode = req.query.customerCode;
    if (!customerCode) {
        res.status(400).json({ error: "Customer Code is required" });
        return;
    }

    const { customerName, customerCity, customerCountry } = req.body;


    pool
    .getConnection()
    .then((conn) => {
        conn
            .query("UPDATE customer set CUST_NAME=?, CUST_CITY=?, CUST_COUNTRY=? where CUST_CODE=?", [customerName, customerCity, customerCountry, customerCode])
            .then((rows) => {
                res.status(200).json({ message: "Customer updated successfully" })
                conn.end();
            })
            .catch((err) => {
                res.status(500).json({ error: "Internal server error" })
            conn.end();
            });
    });
});



/**
 * @swagger
 * /addAgent:
 *   put:
 *     summary: Add a new agent
 *     description: Add a new agent to the database
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Agent data to add
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *               agentCode:
 *                 type: string
 *               agentName:
 *                 type: string
 *               workingArea:
 *                 type: string
 *               commission:
 *                 type: string
 *               phoneNo:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent added successfully
 *       400:
 *         description: Bad request, validation failed
 *       500:
 *         description: Internal server error
 */
app.put('/addAgent', [

    // Sanitization and transformation
    body('agentCode').trim().escape(),
    body('agentName').trim().escape(),
    body('workingArea').trim().escape(),
    body('commission').trim().escape(),
    body('phoneNo').trim().escape(),
    body('country').trim().escape(),


    // Validation
    body('agentCode').notEmpty().isString(),
    body('agentName').notEmpty().isString(),
    body('workingArea').notEmpty().isString(),
    body('commission').notEmpty().isString(),
    body('phoneNo').notEmpty().isString(),
    body('country').notEmpty().isString(),
], (req, res) => {

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    pool.getConnection()
    .then((conn) => {
        conn.query("INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)", [req.body.agentCode, req.body.agentName, req.body.workingArea, req.body.commission, req.body.phoneNo, req.body.country])
            .then((rows) => {
                res.status(200).json({ message: "Agent added successfully" });
                conn.end();
            })
            .catch((err) => {
                res.status(500).json({ error: "Internal server error" });
                conn.end();
            });
    });
});



/**
 * @swagger
 * /getAgents:
 *   get:
 *     summary: Retrieves agents
 *     description: Retrieves all agents from the database.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Agent'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * definitions:
 *   Agent:
 *     type: object
 *     properties:
 *       agentCode:
 *         type: string
 *       agentName:
 *         type: string
 *       workingArea:
 *         type: string
 *       commission:
 *         type: string
 *       phoneNo:
 *         type: string
 *       country:
 *         type: string
 */
app.get("/getAgents", (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * FROM agents")
        .then((rows) => {
          res.json(rows);
          conn.end();
        })
        .catch((err) => {
          console.log(err);
          conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

/**
 * @swagger
 * definitions:
 *   Food:
 *     type: object
 *     properties:
 *       ITEM_ID:
 *         type: integer
 *       ITEM_NAME:
 *         type: string
 *       ITEM_UNIT:
 *         type: string
 *       COMPANY_ID:
 *         type: string
 */

/**
 * @swagger
 * /getFoodList:
 *   get:
 *     summary: Retrieves list of food items
 *     description: Retrieves all food items from the database.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Food'
 *       500:
 *         description: Internal server error
 */
app.get("/getFoodList", (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * FROM foods")
        .then((rows) => {
          res.json(rows);
          conn.end();
        })
        .catch((err) => {
          console.log(err);
          conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});


/**
 * @swagger
 * definitions:
 *   Order:
 *     type: object
 *     properties:
 *       ORD_NUM:
 *         type: string
 *       productName:
 *         type: string
 *       ORD_AMOUNT:
 *         type: string
 *       ADVANCE_AMOUNT:
 *         type: string
 *       ORD_DATE:
 *         type: string
 *       customerCode:
 *         type: string
 *       AGENT_CODE:
 *         type: string
 *       ORD_DESCRIPTION:
 *         type: string
 */

/**
 * @swagger
 * /getOrders:
 *   get:
 *     summary: Retrieves orders
 *     description: Retrieves all orders from the database.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Order'
 *       500:
 *         description: Internal server error
 */

app.get("/getOrders", (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * FROM orders")
        .then((rows) => {
          res.json(rows);
          conn.end();
        })
        .catch((err) => {
          console.log(err);
          conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

/**
 * @swagger
 * definitions:
 *   Student:
 *     type: object
 *     properties:
 *       NAME:
 *         type: integer
 *       TITLE:
 *         type: string
 *       CLASS:
 *         type: string
 *       SECTION:
 *         type: string
 *       ROLL_NO:
 *         type: string
 */

/**
 * @swagger
 * /getStudents:
 *   get:
 *     summary: Retrieves students
 *     description: Retrieves all students from the database.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Student'
 *       500:
 *         description: Internal server error
 */
app.get("/getStudents", (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * FROM student")
        .then((rows) => {
          res.json(rows);
          conn.end();
        })
        .catch((err) => {
          console.log(err);
          conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});


/**
 * @swagger
 * definitions:
 *   StudentReport:
 *     type: object
 *     properties:
 *       CLASS:
 *         type: string
 *       SECTION:
 *         type: string
 *       ROLLID:
 *         type: string
 *       GRADE:
 *         type: string
 *       SEMISTER:
 *         type: string
 *       CLASS_ATTENDED:
 *        type: string
 */

/**
 * @swagger
 * /getStudentreport:
 *   get:
 *     summary: Retrieves student reports
 *     description: Retrieves all student reports from the database.
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/StudentReport'
 *       500:
 *         description: Internal server error
 */
app.get("/getStudentreport", (req, res) => {
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query("SELECT * FROM studentreport")
        .then((rows) => {
          res.json(rows);
          conn.end();
        })
        .catch((err) => {
          console.log(err);
          conn.end();
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
