import { Router } from 'express';
import { client, getUser } from '../database/db';
import {
  verifyUserToken,
  verifyAdminToken,
  verifyToken,
} from '../authentication/loginauth';

const getRouter = Router();

// GET all the users
getRouter.get('/:email/:token', verifyAdminToken, async (req, res) => {
  try {
    const usersData = await client.query('SELECT * FROM users');
    res.json(usersData.rows);
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
});

getRouter.get('/admin/:email/:token', async (req, res) => {
  try {
    const usersData = await client.query('SELECT * FROM admins');
    res.json(usersData.rows);
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
});

// GET all the users' packages
getRouter.get('/:email/:token/packages', async (req, res) => {
  try {
    const packages = await client.query('SELECT * FROM packages');
    res.json(packages.rows);
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
});

// GET all the new packages users
getRouter.get(
  '/:email/:token/packages/:condition',
  verifyAdminToken,
  async (req, res) => {
    const { condition } = req.params;
    try {
      const check = await client.query(
        `SELECT EXISTS(SELECT 1 FROM packages WHERE _status = $1)`,
        [condition]
      );
      if (!check.rows[0].exists) {
        throw new Error(`There is no package ${condition}`);
      } else {
        const packages = await client.query(
          'SELECT * FROM packages WHERE _status = $1',
          [condition]
        );
        res.json(packages.rows);
      }
    } catch (error) {
      res.status(400).json({ errMessage: error.message });
    }
  }
);

// get the packages of a single user that are either on transit, at the location or delivered
getRouter.get(
  '/:email/:username/:token/packages/:condition',
  verifyUserToken,
  async (req, res) => {
    const { condition, username } = req.params;
    try {
      const check = await client.query(
        `SELECT EXISTS(SELECT 1 FROM packages WHERE _username = $1 AND _status = $2)`,
        [username, condition]
      );
      if (!check.rows[0].exists) {
        throw new Error(`There is no package ${condition}`);
      } else {
        const packages = await client.query(
          'SELECT * FROM packages WHERE _status = $1 AND _username = $2',
          [condition, username]
        );
        res.json(packages.rows);
      }
    } catch (error) {
      res.status(400).json({ errMessage: error.message });
    }
  }
);
// GET a single user
getRouter.get('/:userid/:email/:token', verifyUserToken, async (req, res) => {
  const userid = parseInt(req.params.userid);
  const incomingUser = { users_id: userid };
  try {
    const check = await client.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE users_id = $1)`,
      [userid]
    );
    if (!check.rows[0].exists) {
      res.status(404).send('wrong Email');
    } else {
      const user = await getUser(incomingUser);
      res.json(user.rows[0]);
    }
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
});

// GET all packages of a single user
getRouter.get(
  '/:username/:userid/:email/:token/packages',
  verifyToken,
  async (req, res) => {
    const { username } = req.params;
    try {
      const check = await client.query(
        `SELECT EXISTS(SELECT 1 FROM packages WHERE _username = $1)`,
        [username]
      );
      if (!check.rows[0].exists) {
        throw new Error('You do not have any package yet');
      } else {
        const packages = await client.query(
          `SELECT * FROM packages WHERE _username = $1`,
          [username]
        );
        res.json(packages.rows);
      }
    } catch (error) {
      res.status(400).json({ errMessage: error.message });
    }
  }
);

// GET a single package of the user
getRouter.get('/:email/packages/:packageid', async (req, res) => {
  const packageid = parseInt(req.params.packageid);
  const { email } = req.params;
  try {
    const check = await client.query(
      `SELECT EXISTS (SELECT 1 FROM packages WHERE 
      _email = $2 AND package_id = $1)`,
      [packageid, email]
    );
    if (!check.rows[0].exists) {
      throw new Error('Wrong Email address or package ID');
    } else {
      const parcel = await client.query(
        `SELECT * FROM packages WHERE 
        _email = $2 AND package_id = $1`,
        [packageid, email]
      );
      res.json(parcel.rows[0]);
    }
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
});

export default getRouter;
